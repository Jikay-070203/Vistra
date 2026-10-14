from contextlib import ExitStack
from dataclasses import asdict
from pathlib import Path
from uuid import uuid4

from src.database.chat_memory_store import ChatMemoryStore
from src.memory.short_term_memory import ShortTermMemory
from src.orchestration.chat_orchestrator import ChatOrchestrator
from src.orchestration.presentation import result_images, result_places
from src.schema.chat import ChatResponse, Conversation, restore_search_response
from src.schema.models import RetrievalRoute
from src.utils.utils import load_config, resolve_path
from src.guardrails.policy import CredentialRedactor, INJECTION


class ChatService:
    def __init__(
        self,
        search_service=None,
        generator=None,
        memory_store: ChatMemoryStore | None = None,
        short_term_memory: ShortTermMemory | None = None,
        memory_path: str | Path | None = None,
        travel_tools=None,
    ):
        self.config = load_config()
        self._resources = ExitStack()
        self._closed = False
        self._search_service = search_service
        self._generator = generator
        self._travel_tools = travel_tools
        self._feedback_agent = None
        self.short_term = short_term_memory if short_term_memory is not None else ShortTermMemory()
        self.long_term = memory_store if memory_store is not None else ChatMemoryStore(memory_path)
        if memory_store is None:
            self._resources.callback(self.long_term.close)
        self.orchestrator = ChatOrchestrator(
            config=self.config,
            memory_store=self.long_term,
            max_messages=self.short_term.max_messages,
            generation_factory=self._generation,
            search_factory=self._search,
            travel_tools_factory=self._travel,
            image_embedder_factory=lambda: self._search().image_embedder(),
            feedback_factory=self._feedback,
            checkpointer=self.short_term.checkpointer,
        )
        self.graph = self.orchestrator.graph


    result_images = staticmethod(result_images)
    result_places = staticmethod(result_places)


    def _save_short_term(self, conversation: Conversation) -> None:
        self.short_term.save(conversation, self.graph, as_node=self.orchestrator.terminal_node)


    def _check_open(self) -> None:
        if self._closed:
            raise RuntimeError("ChatService is closed.")


    def _search(self):
        if self._search_service is None:
            from src.service.search_service import SearchService

            self._search_service = SearchService(text_embedder_factory=self.long_term.get_embedder)
            self._resources.callback(self._search_service.close)
        return self._search_service


    def _generation(self):
        if self._generator is None:
            from src.generation.openai_generation import OpenAIGeneration

            self._generator = OpenAIGeneration()
            self._resources.callback(self._generator.close)
        return self._generator


    def _travel(self):
        if self._travel_tools is None:
            from src.tools.travel_tools import TravelTools

            self._travel_tools = TravelTools(self.config, embedder_factory=self.long_term.get_embedder)
            self._resources.callback(self._travel_tools.close)
        return self._travel_tools


    def _feedback(self):
        if self._feedback_agent is None:
            from src.agents.feedback_agent import FeedbackAgent
            from src.database.travel_dna_store import TravelDNAStore

            path = self.config.get("travel_dna_path", "databases/sqlite_db/travel_dna.sqlite")
            self._feedback_agent = FeedbackAgent(TravelDNAStore(path), self.long_term)
        return self._feedback_agent


    def submit_feedback(self, request, user_id="local"):
        self._check_open()
        conversation = self.long_term.load_conversation(request.conversation_id, user_id, None)
        if conversation is None:
            raise ValueError("Conversation not found for this user.")
        ids = {place["entity_id"] for message in conversation.messages for place in message.get("places", [])}
        if conversation.search_response:
            ids.update(result.entity_id for result in conversation.search_response.results)
        return self._feedback().record(request, user_id=user_id, allowed_entity_ids=ids)


    def travel_dna(self, user_id="local"):
        self._check_open()
        agent = self._feedback()
        return {"profile": agent.store.profile(user_id).model_dump(mode="json"), "events": agent.store.events(user_id)}


    def delete_feedback(self, event_id=None, user_id="local"):
        self._check_open()
        agent = self._feedback()
        agent.store.remove(user_id, event_id)
        agent.sync_memory(user_id)


    def update_feedback(self, event_id, attributes, user_id="local"):
        """Replace a confirmed event's attributes through an explicit user edit."""
        self._check_open()
        agent = self._feedback()
        agent.store.edit(user_id, event_id, attributes)
        agent.sync_memory(user_id)


    def new_conversation(self, user_id: str = "local") -> str:
        self._check_open()
        conversation = Conversation(conversation_id=str(uuid4()), user_id=user_id)
        self.long_term.create_conversation(conversation)
        self._save_short_term(conversation)
        return conversation.conversation_id


    def get_conversation(self, conversation_id: str, user_id: str = "local") -> Conversation:
        self._check_open()
        conversation = self.short_term.get(conversation_id, user_id, self.graph)
        if conversation is None:
            conversation = self.long_term.load_conversation(conversation_id, user_id, self.short_term.max_messages)
            if conversation is None:
                raise ValueError("Conversation not found for this user.")
            self._save_short_term(conversation)
        return conversation


    def delete_conversation(self, conversation_id: str, user_id: str = "local") -> bool:
        self._check_open()
        if not self.long_term.delete_conversation(conversation_id, user_id):
            return False
        self.short_term.delete(conversation_id, user_id)
        return True


    def memories(self, user_id: str = "local") -> dict[str, str]:
        self._check_open()
        facts = self.long_term.get_memories(user_id, self.config["chat_memory_limit"])
        return CredentialRedactor().data({name: value[:self.config["chat_memory_fact_chars"]] for name, value in facts.items()})


    def remember(self, name: str, value: str, user_id: str = "local") -> None:
        self._check_open()
        name, value = name.strip(), value.strip()
        if not name or not value:
            raise ValueError("A memory needs a name and a value.")
        redactor = CredentialRedactor()
        if redactor.text(name) != name or redactor.text(value) != value or INJECTION.search(value):
            raise ValueError("Preferences cannot contain credentials or instructions to override system rules.")
        self.long_term.remember(user_id, name[:80], value[:self.config["chat_memory_fact_chars"]])


    def forget(self, name: str, user_id: str = "local") -> None:
        self._check_open()
        self.long_term.forget(user_id, name.strip())


    def chat(
        self,
        message: str | None = None,
        *,
        conversation_id: str | None = None,
        user_id: str = "local",
        image: str | Path | None = None,
        images: list[str | Path] | None = None,
        preferences: dict | None = None,
        route: RetrievalRoute | None = None,
        limit: int | None = None,
        on_progress=None,
    ) -> ChatResponse:
        self._check_open()
        from src.schema.preferences import PreferenceInput

        image_paths = [str(resolve_path(path)) for path in (images or ([] if image is None else [image]))]
        if len(image_paths) > 5:
            raise ValueError("Use at most five inspiration images.")
        if any(not Path(path).is_file() for path in image_paths):
            raise FileNotFoundError("An inspiration image is unavailable.")
        image_path = image_paths[0] if image_paths else None
        preference_input = PreferenceInput.model_validate(preferences or {}).model_dump(mode="json")
        if image_path is not None and not Path(image_path).is_file():
            raise FileNotFoundError(f"Image not found: {image_path}")
        message = (message or "").strip()
        if not message:
            if image_path is None:
                raise ValueError("Provide a message or an image.")
            message = "Find places with scenery like this image."

        conversation = (
            self.get_conversation(conversation_id, user_id) if conversation_id
            else Conversation(conversation_id=str(uuid4()), user_id=user_id)
        )
        try:
            inputs = {
                "conversation": asdict(conversation),
                "message": message,
                "image_path": image_path,
                "image_paths": image_paths,
                "preference_input": preference_input,
                "route": route,
                "limit": limit,
            }
            config = self.short_term.uuid_config(conversation.conversation_id, user_id)
            state = self.orchestrator.invoke(inputs, config, on_progress=on_progress)
        except Exception:
            self._save_short_term(conversation)
            raise
        self._save_short_term(Conversation.from_dict(state["conversation"]))
        result = state["result"]
        return ChatResponse(
            **{key: value for key, value in result.items() if key != "search_response"},
            search_response=restore_search_response(result["search_response"]),
        )


    def close(self) -> None:
        if not self._closed:
            self._closed = True
            self._resources.close()


    def __enter__(self):
        return self


    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self.close()

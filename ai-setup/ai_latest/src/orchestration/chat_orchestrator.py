from langgraph.graph import END, START, StateGraph

from src.agents.manager_agent import ManagerAgent
from src.agents.memory_agent import MemoryAgent
from src.agents.response_agent import ResponseAgent
from src.agents.answer_verification_agent import AnswerVerificationAgent
from src.guardrails.nodes import GuardrailNodes
from src.guardrails.policy import guardrail_scope
from src.agents.retrieval_agent import RetrievalAgent
from src.agents.destination_context_agent import DestinationContextAgent
from src.agents.poi_agent import POIAgent
from src.agents.transport_agent import TransportAgent
from src.agents.budget_agent import BudgetAgent
from src.agents.weather_agent import WeatherSeasonAgent
from src.agents.planner_agent import PlannerAgent
from src.agents.critic_agent import CriticAgent
from src.agents.visual_preference_agent import VisualPreferenceAgent
from src.agents.travel_remix_agent import TravelRemixAgent

from src.orchestration.travel_assessments import aggregate_assessments, next_after_sources
from src.orchestration.progress import TurnProgress, _progress
from src.schema.chat import ChatState
from src.schema.travel import TravelSettings
from src.orchestration.constraint_ranking import rank_constraints


class ChatOrchestrator:
    terminal_node = "save_memory"

    def __init__(
        self,
        *,
        config: dict,
        memory_store,
        max_messages: int,
        generation_factory,
        search_factory,
        travel_tools_factory,
        checkpointer,
        image_embedder_factory=None,
        feedback_factory=None,
    ):
        config = {**config, **TravelSettings.model_validate(config).model_dump()}

        self.manager = ManagerAgent(config, generation_factory)

        self.retrieval = RetrievalAgent(search_factory)

        self.guards = GuardrailNodes(config)
        self.response = ResponseAgent(generation_factory, config)
        self.verifier = AnswerVerificationAgent(config, generation_factory)

        self.memory = MemoryAgent(memory_store, config, max_messages)

        self.planner = PlannerAgent(config, travel_tools_factory)

        self.critic = CriticAgent(config, travel_tools_factory)

        self.visual = VisualPreferenceAgent(config, image_embedder_factory)

        self.remix = TravelRemixAgent()

        self._feedback = feedback_factory

        self.specialists = [
            DestinationContextAgent(config, travel_tools_factory),
            POIAgent(config, travel_tools_factory),
            TransportAgent(config, travel_tools_factory),
            BudgetAgent(config, travel_tools_factory),
            WeatherSeasonAgent(config, travel_tools_factory)
        ]

        workflow = StateGraph(ChatState)
        workflow.add_node("input_guardrails", self.guards.input)
        workflow.add_node("plan_guardrails", self.guards.plan)
        workflow.add_node("verify_answer", self.verifier.run)
        
        workflow.add_node("load_memory", self.memory.load)
        workflow.add_node("manager", self.manager.run)
        workflow.add_node("visual_preference", self.visual.run)
        workflow.add_node("travel_remix", self.remix.run)
        workflow.add_node("feedback", self.load_feedback)
        workflow.add_node("retrieve", self.retrieval.search)
        workflow.add_node("prepare_sources", self.retrieval.prepare_sources)

        for agent in self.specialists:
            workflow.add_node(agent.name, agent.run)
        workflow.add_node("aggregate_assessments", aggregate_assessments)
        workflow.add_node("constraint_ranking", rank_constraints)
        workflow.add_node("planner", self.planner.run)
        workflow.add_node("critic", self.critic.run)
        workflow.add_node("respond", self.response.run)
        workflow.add_node(self.terminal_node, self.memory.save)
        workflow.add_edge(START, "input_guardrails")
        workflow.add_conditional_edges("input_guardrails", self.guards.after_input,
            {"respond": "respond", "load_memory": "load_memory"})
        workflow.add_edge("load_memory", "feedback")
        workflow.add_edge("feedback", "manager")
        workflow.add_edge("manager", "plan_guardrails")
        workflow.add_edge("plan_guardrails", "visual_preference")
        workflow.add_edge("visual_preference", "travel_remix")
        workflow.add_conditional_edges("travel_remix", self.manager.next_node, {
            "retrieve": "retrieve",
            "prepare_sources": "prepare_sources",
        })
        for node in ("retrieve", "prepare_sources"):
            workflow.add_conditional_edges(node, next_after_sources, {
                "destination_context": "destination_context", "respond": "respond",
                "aggregate_assessments": "aggregate_assessments",
                "constraint_ranking": "constraint_ranking",
            })
        for current, following in zip(self.specialists, self.specialists[1:]):
            workflow.add_edge(current.name, following.name)
        workflow.add_edge(self.specialists[-1].name, "aggregate_assessments")
        workflow.add_edge("aggregate_assessments", "constraint_ranking")
        workflow.add_conditional_edges("constraint_ranking", self.after_ranking, {"planner": "planner", "respond": "respond"})
        workflow.add_edge("planner", "critic")
        workflow.add_conditional_edges("critic", self.critic.next_node, {"planner": "planner", "respond": "respond"})
        workflow.add_edge("respond", "verify_answer")
        workflow.add_edge("verify_answer", self.terminal_node)
        workflow.add_edge(self.terminal_node, END)
        self.graph = workflow.compile(checkpointer=checkpointer)


    def load_feedback(self, state):
        return self._feedback().run(state) if self._feedback else {"travel_dna": {}}


    @staticmethod
    def after_ranking(state):
        return "planner" if state["decision"].get("workflow", {}).get("build_itinerary") and not state["decision"]["ambiguous"] else "respond"


    def invoke(self, inputs: ChatState, config: dict, *, on_progress=None) -> dict:
        # Keep callbacks and timers out of serializable graph checkpoints.
        token = _progress.set(TurnProgress(on_progress))
        try:
            with guardrail_scope(self.guards.settings):
                return self.graph.invoke(inputs, {**config, "recursion_limit": 40 + 2*self.planner.settings.max_revisions})
        finally:
            _progress.reset(token)

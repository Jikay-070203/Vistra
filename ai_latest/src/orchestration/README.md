# VISTRA chat orchestrator

`ChatOrchestrator` coordinates the existing chat capabilities through a LangGraph
workflow. FastAPI and the terminal interface continue to call `ChatService.chat()`.
`ChatService` owns the provider/search clients, conversations and short-term cache;
the orchestrator coordinates the work inside each turn.

## Current graph

![Compiled LangGraph workflow](../../docs/diagrams/current-flow.png)

This diagram comes directly from `orchestrator.graph.get_graph().draw_mermaid()`.
Dashed edges show the manager's conditional branches. The saved
[PNG](../../docs/diagrams/current-flow.png),
[SVG](../../docs/diagrams/current-flow.svg), and
[Mermaid source](../../docs/diagrams/current-flow.mmd) reflect the compiled nodes
and edges; the images were rendered locally.

Regenerate the Mermaid source after editing the workflow:

```sh
python -m src.orchestration.export_graph
```

[export_graph.py](export_graph.py) compiles the real `ChatOrchestrator` without
invoking its agents, opening databases, or initializing search/generation clients.
By default the export stays local. `--output path/to/graph.png` changes the output
basename. The optional `--png` uses LangGraph's `draw_mermaid_png()` renderer through
the external `mermaid.ink` API and sends it the graph structure; it requires network
access. The Mermaid source is saved before that rendering attempt.

The graph executes one bounded turn. Intent planning and answer generation use the existing
OpenAI generation object. Final claim review and bounded repair also use that object.
Retrieval and memory are tool-backed components that
call the existing services; they do not make additional agent LLM calls.
Automatic text routing still uses Jev inside `SearchService`.

## Agent responsibilities

| Component | Responsibility |
| --- | --- |
| [ManagerAgent](../agents/manager_agent.py) | Prepare the structured `ChatPlan`, normalize the query/location, validate referenced entity IDs, decide whether to retrieve, and prepare summary/preference updates. |
| [RetrievalAgent](../agents/retrieval_agent.py) | Search through `SearchService`, scope selected-place lookups, reuse previous evidence, or prepare clarification context. Preserve original result numbers on follow-ups. |
| [DestinationContextAgent](../agents/destination_context_agent.py) | Gather entity metadata, scoped Wikivoyage context and verified-QID Wikidata facts. |
| [POIAgent](../agents/poi_agent.py) | Find nearby experiences in SQLite and optionally Overpass; filter scope and rank using local embeddings or distance. |
| [TransportAgent](../agents/transport_agent.py) | Retrieve modeled road routes or dated public transport schedules, with missing inputs and time limits. |
| [BudgetAgent](../agents/budget_agent.py) | Calculate sourced or user-supplied cost ranges, FX conversion, coverage and affordability. |
| [WeatherSeasonAgent](../agents/weather_agent.py) | Retrieve daily forecasts and separately labeled historical seasonal samples. |
| [VisualPreferenceAgent](../agents/visual_preference_agent.py) | Suggest visual attributes with the existing SigLIP instance and preserve explicit preference edits. |
| [TravelRemixAgent](../agents/travel_remix_agent.py) | Combine up to five compatible image vectors and explicit attribute weights. |
| [PlannerAgent](../agents/planner_agent.py) | Build a bounded schedule for one selected destination using sourced POIs, routes, and opening windows. |
| [CriticAgent](../agents/critic_agent.py) | Independently check schedule/evidence, distinguish failures from unknowns, and request bounded corrections. |
| [FeedbackAgent](../agents/feedback_agent.py) | Read confirmed Travel DNA; explicit feedback endpoints record, edit, and remove its user-scoped source events. |
| [GuardrailNodes](../guardrails/nodes.py) | Validate/redact input before routing and gate Manager memory proposals before downstream work. |
| [ResponseAgent](../agents/response_agent.py) | Build bounded evidence, draft structured prose and prepare the response/photos/map envelope. |
| [AnswerVerificationAgent](../agents/answer_verification_agent.py) | Check drafts, independently review claims, allow one checked repair, render a released answer or fixed fallback before persistence. |
| [MemoryAgent](../agents/memory_agent.py) | Load relevant preferences and persist the completed messages, summary, explicit preference updates, image reference and selected results. |
| [ChatOrchestrator](chat_orchestrator.py) | Register nodes, select graph branches, compile with the conversation checkpointer, and establish turn-local progress tracking. |

### Branch rules

| Request | Branch | Source handling |
| --- | --- | --- |
| New image | `retrieve` | Search using the uploaded image and planned scope. |
| New travel search | `retrieve` | Use the existing text/image routing and location filters. |
| Additional facts about selected results | `retrieve` | Call `search_follow_up()` with the validated previous entities. |
| Explain/compare previous results | `prepare_sources` | Select previous entities without calling search. |
| Ambiguous or unknown entity reference | `prepare_sources` | Mark the response `clarification_required`; keep previous identities available for clarification. |
| Greeting or preference request | `prepare_sources` | Supply conversation/preferences without retrieved travel evidence. |

A changed, nonblank location forces a new search. New uploads and explicit route
overrides force the search action. A visual description without an active image or
route override selects `image_text`. The retrieval service continues to enforce
location membership and keep mapped destination context separate from place facts.

## State and checkpoints

[ChatState and TurnDecision](../schema/chat.py) carry the shared state:

- Inputs: conversation, message, image path, optional route and result limit.
- `memory`: relevant saved preferences, including explicit updates for this turn.
- `decision`: normalized action/query/route, active image, search options, references,
  ambiguity flag, summary and bounded memory updates.
- `response`: serialized `SearchResponse` containing accepted evidence.
- `trip_request`: current structured dates, origin, travelers, budget and constraints.
- Separate specialist output fields and `assessments`: current-turn evidence with status,
  provenance and missing inputs; passed explicitly to the answer model.
- `result`: serialized `ChatResponse` containing the answer and UI attachments.
- `answer_evidence`, `answer_draft`, `answer_verification`: snapshot, transient draft and release report.
- `guardrails`, `loaded_memory`: boundary decisions and baseline memory for consent checks.

Agents restore dataclasses locally and return dictionaries for graph updates.
Provider objects, models, callbacks and timers remain outside graph state.
Factories supplied by `ChatService` retain lazy initialization and resource ownership.

The final node is `save_memory`. `ChatService` passes that node to
`ShortTermMemory.save()` when creating or compacting checkpoints. This records an
idle conversation after the graph has ended. The cache keeps its existing message
and conversation limits and deletes intermediate checkpoints during compaction.

Every response passes `verify_answer` first. `save_memory` checks its released hash
and repeats the preference consent gate. See [the verification guide](../../docs/verification_guardrails.md)
for policy, configuration, costs, reports and practical limits.

If a graph node raises, `ChatService` restores the prior short-term conversation
and propagates the exception to the existing API error handler. Long-term writes
occur in the final node. There is no transaction across providers and Qdrant, and
this workflow does not automatically replay failed turns.

## Progress and API integration

[progress.py](progress.py) uses a `ContextVar` to hold a fresh activity tracker for
each invocation. Agent and retrieval events still use the existing step names:
`memory`, `plan`, `retrieval`, `context` and `generation`. Retrieval can emit its
existing route/model events through the same tracker.

[tool_activity.py](tool_activity.py) adds unique `tool_N` steps to this same stream.
The context manager/decorator reports running and terminal status with tool and
operation names, requesting agent, timestamps and duration. Shared provider caching
reports cache hits and HTTP status only; bodies, authorization headers and raw
exception messages are excluded. The browser renders these as tool rows in the
Activity & tools panel. Updates replace a row in place, preserving call start order.
Instrumentation is inactive outside an orchestrator turn. Completed tool history is
persisted in assistant-message activity and returned through the existing API.

Use `ChatService.chat(..., on_progress=callback)` to invoke the full workflow.
The existing JSON and NDJSON API response formats remain the integration contract.
`ChatService.graph` exposes the compiled graph for inspection.

Start the app as described in the [backend tutorial](../../backend_tutorial.md):

```sh
docker compose -f compose.qdrant.yaml up -d
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

## Travel specialists and extension agents

Destination Context, POI / Local Experience, Transport, Budget and Weather & Season
are implemented. Read [the travel agent guide](../../docs/travel_agents.md) for
setup, file organization, provider behavior and catalog schemas. Selected specialists
run sequentially after source preparation and before response generation. Nodes skip
unrequested work. Ambiguous references require clarification before provider calls.

Planner and Critic are implemented after constraint ranking. The correction loop
defaults to two revisions; unresolved evidence produces a draft. Visual Preference
and Travel Remix prepare retrieval inputs after Manager. Feedback reads confirmed
Travel DNA before Manager; persistence uses explicit feedback endpoints.

Read [the additional agent guide](../../docs/additional_agents.md) for setup and limitations.

To extend the workflow further:

1. Define the specialist's input and output schema. Keep entity IDs, source URLs,
   timestamps and missing-data status with every returned fact.
2. Add a component under `src/agents/` with a node method accepting `ChatState`
   and returning only its updated state fields. Supply external clients through
   factories and let the service own their lifecycle.
3. Add optional output fields to `ChatState` and extend the manager decision if
   it needs to request that specialist. Keep graph state serializable.
4. Register the node and conditional edges in `ChatOrchestrator`. For example,
   weather can run after retrieval when accepted candidates and trip dates exist.
   Handle empty results and missing dates before calling its provider.
5. Explicitly pass specialist evidence into the answer-generation context. Merely
   adding a graph node or state field does not make its output available to the LLM.
   Preserve the distinction between place facts and destination context.
6. Give any critic/revision cycle an explicit attempt limit and a defined exit
   path for unresolved issues. Keep persistence after the final accepted response.

The existing generation object and search service can still be injected through
the `ChatService` constructor. This supports future isolated workflow checks with
fake providers and memory stores.

Automated graph/API regressions and live provider/database execution were run on
2026-10-09. Read [the pipeline review](../../docs/pipeline_review.md) for reproducible
commands, fixes and limits. Request-planning activity now includes action, selected
IDs, requested specialists, Planner intent and clarification state.

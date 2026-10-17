# VISTRA chat demo

For Docker deployment and API-key-authenticated developer calls with JSON input/output, see [the developer API guide](../api/README.md).

From `E:\VISTRA`:

```powershell
./.venv/python.exe -m pip install -r requirements.txt
./.venv/python.exe -B -m frontend.server
```

Open **http://127.0.0.1:8000**. Use `--port 8001` if needed. Stop with Ctrl+C.

After updating backend Python files, restart the frontend server before testing. Refreshing the browser does not reload Python modules; `-B` disables bytecode writes but does not enable live reload.

To inspect the same chat backend before browser formatting, run `./.venv/python.exe -B main.py --chat`. Type `/last` for the full backend JSON, or launch with `--chat --json` to print it after every reply. `/new` starts a new session and `/session NAME` resumes a named session for the same terminal owner.

The demo uses the existing `.env`, PostgreSQL, Qdrant, models, and `ChatService`. PostgreSQL must be running; API keys are required to generate replies. Indexed travel questions additionally need the existing retrieval services and model cache.

Itinerary requests now run the **TravelPlanner-style flow**: selected tools → evidence notebook → structured itinerary planner → constraint checks and bounded repair. The chat shows planning status and an expandable tool trace. The current itinerary is saved for later edits such as “Make day two more relaxed; keep the other days unchanged.” Missing route, fare and booking data is explicitly marked unverified. The implementation lives in `src/planning/`.

Before rendering, a bounded schedule search assigns sourced venues and proposed times against opening windows, directed travel estimates, unique-venue requirements and known costs. It can reconsider earlier choices to reserve venues needed later in the trip. Recorded dietary tags and room rules filter incompatible candidates; unknown facts remain unverified. Lodging covers actual nights only, with known minimum stays checked. Insufficient evidence may leave clearly marked gaps in a partial itinerary. The search has a fixed work budget and cannot establish that no feasible trip exists outside the supplied candidates. Configured city aliases are normalized before planning lookups.

When dates and duration disagree, the chat explains the two stay-length choices and offers buttons. You can also reply naturally with “4 nights at Duong Dong” or “keep the dates”; the pending trip is updated and planning continues without repeating your other details.

Explicit schedule creation and edit requests are reconciled with the conversation interpretation before response routing. A mistaken search classification cannot bypass the planner's requirement checks. Explanations, translations and explicit cancellations retain ordinary response routing; exclusions such as “don't include flights” remain planning constraints. Selected planning requests return a structured planning report or clarification, and never silently fall through to an unchecked narrative itinerary. Explicit `planning_mode: off` and direct-response overrides retain their existing behavior.

Destination discovery also uses retrieval before a city is chosen. Ask “Recommend beautiful beach destinations in Vietnam” to search within the country; a follow-up like “suggest me please” retains the country and interests from the conversation. Dates and budget are needed when planning an itinerary, rather than when recommending destinations.

Try **Make it personal**, send the suggested message, then start **New conversation** and ask “What preferences do you remember about me?” Open **Memory → Across chats** to see the stored preferences. **This chat** shows current trip details and the conversation summary. Reloading reopens the active conversation; the sidebar lists saved chats. Clearing a chat retains long-term preferences, which can be removed separately.

Delete a conversation with the trash button beside it in the sidebar. Confirming removes its messages, trip state, and saved results; long-term preferences and other conversations are kept. Deleting the open conversation starts a fresh chat. The existing **Memory → This chat → Clear this chat’s history** action uses the same confirmation.

This is a local demo bound to loopback. A signed HttpOnly browser cookie scopes conversations and memory to this browser. Keep `frontend/.runtime/signing-key` between restarts so existing browser sessions remain accessible. It is ignored by Git and never served. Browser storage keeps only the active conversation ID. There is no account/login system.

Direct and grounded Q&A replies stream progressively while the model generates them. Draft previews use plain text; the checked final reply replaces them with sanitized Markdown, sources, photos and planning/weather panels. Source review can revise a preview. Structured itineraries appear progressively after validation. Only completed, checked replies are saved; a streaming error removes the unfinished preview. The developer API retains its JSON response contract.

Factual questions and guide-based explanations use semantic evidence routing;
photos remain available for visual requests and scenic discovery. Explicit
no-photo requests take precedence. Time-sensitive questions retain source-based
answers with freshness caveats; missing official sources do not trigger a fixed refusal. If answer
verification fails, the final reply explains the limitation without dumping raw
source excerpts or unrelated business details. Review outages and rejected drafts
have distinct diagnostics in the terminal JSON (`grounding`) and local server logs;
these limitation replies have `pipeline_status: partial`.

Direct and retrieved Q&A also pass deterministic response-contract checks before
delivery: allowed citation IDs and exact syntax, readable Markdown, explicitly
requested tables/lists, and clear English/Vietnamese language drift. Current
language/translation requests override saved language preferences; otherwise saved
preferences precede question-language inference. Names and quotations are preserved.
The generator receives a small resolved `response_contract` object and can repair
one rejected draft. A repeated violation returns a limitation marked partial;
the JSON `response_contract` diagnostics distinguish these checks from `grounding`
fact verification. Language/layout request detection is conservative and does not
guarantee every phrasing or sentence is classified. These Q&A checks do not replace
structured itinerary validation.

Closing the browser does not cancel an already running model call or its memory commit. Reload the conversation to recover a completed reply. Recent history is limited to 100 messages per view.

Markdown and source links are sanitized. Bundled Marked and DOMPurify files were copied from this repository's original vendor assets; their licenses and versions are retained under `static/vendor/`. No CDN or frontend build step is required.

Travel replies display a **Places found** box beneath the answer, with retrieved photos, names, ratings, review counts, addresses, prices, opening hours, coordinates and Google Maps links. Expand **Place details** for the full metadata. Unknown values remain unknown. Cards and source links are saved with each reply and restored when reopening the conversation. Photos load through an owner-authorized local proxy; a failed photo keeps its metadata visible.

Visual retrieval intersects the requested geography, explicit place identities and English/Vietnamese categories before vector ranking. Excluded categories and named places remain excluded. Exact catalog names and clearly named/quoted missing subjects do not fall back to other venues. Fresh place/photo metadata is checked again before distance ranking, RAG attachment and gallery display. Photo UUID, place ID and entity ID must agree; names, category and geography come from that same place record. Invalid photo candidates are discarded individually, with no unrelated replacements to fill the result limit. These checks establish indexed identity/category consistency; they do not independently verify what every photo depicts or establish an uploaded image's identity.

Dated itinerary requests also show a **Weather for your trip** box with Open-Meteo daily forecasts. Dates can come from the message or the active trip's memory. The generator receives this weather evidence before writing the itinerary. Forecast availability is limited to the provider's short-range window; missing dates, missing coordinates, out-of-range dates and provider failures are shown explicitly. Saved weather boxes retain their original fetch timestamp. Weather settings live in `config.yaml`.

The **Results** selector defaults to **20**, with choices of 5, 10, 15 and 20. This controls the retrieval budget per branch; actual matches may be fewer. Cards show up to 20 distinct places. The generation context retains its existing separate source budget. Visual travel requests use the image branch; factual questions can use guides alone. Direct memory chat bypasses retrieval, and explicit requests without photos retain text-only evidence.

Clear preference or trip-detail updates get a short acknowledgment rendered by
the application after interpretation, without an answer-generation, retrieval,
planning or weather call. The final acknowledgment is returned only after the
existing atomic memory save succeeds. Examples: “Saved your food preference.”
and “Updated this trip’s budget: 8,000,000 VND (total).” Durable preferences and
this chat's trip details remain distinct; a trip budget is not a saved travel style.
Explicit “remember my response language” commands save the quoted command even
when interpretation omits it. Current response-language instructions override
saved language preferences, with fully accented Vietnamese acknowledgments.
Explicit table/list layouts are preserved. Recall questions, additional requests,
pending planning replies and explicit retrieval/weather options retain their
normal paths; fallback model answers are instructed to keep update-only replies
brief. Ambiguous wording still depends on interpretation and conservative request
guards. Existing stored records are not rewritten by these changes.

Demo code, assets, and tests live in `frontend/`; all application dependencies are declared in the root `requirements.txt`. Retrieval defaults in `config.yaml` and `main.py` are now 20; text grouping supports a twenty-document budget without exceeding the explicit per-page grouping cap.

The developer API has separate tests under `api/tests/`; the browser regression suite runs with:

```powershell
./.venv/python.exe -B -m unittest discover -s frontend/tests -v
```

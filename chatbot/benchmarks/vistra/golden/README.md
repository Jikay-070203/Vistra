# VISTRA golden-set candidate v1

**300 distinct authored scenario families: 50 in each area.** Each has English and
Vietnamese-with-diacritics inputs, giving **600 language cases**. Translations are
not counted as additional scenario diversity. Multi-turn cases contain 716 total
user requests across both language variants.

Status: **authored expected results, structurally checked; independent semantic
adjudication pending**. This is a golden-set candidate, not a claim that VISTRA
passed 300 tests. No paid model calls, real bookings or production database writes
were used to create the set. A finite collection cannot cover every possible user
request; future real failures should add new families rather than replace failures
with easier examples.

## Contents

| Area | Families | English/VI cases | Main coverage |
| --- | ---: | ---: | --- |
| Routing | 50 | 100 | Direct versus retrieval, memory-only tasks, mixed intents, translation/quotation, origin versus destination, namesakes, aliases, country discovery, language overrides, missing live entry-rule evidence |
| Retrieval | 50 | 100 | City/country/category filters, exclusions, dietary/accessibility metadata, price/hours filters, exact identities, negative matches, short follow-ups, distance ranking, deduplication, branch loss and image limitations |
| Grounding | 50 | 100 | Numbers/units, unknown/null fields, cited tables, source relevance/entailment, hours, prices, room rules, directed routes, forecast limits, image identity, conflicting/poisoned sources, child rates and missing medical evidence |
| Memory | 50 | 100 | Durable versus temporary preferences, correction/deletion, exact quotes, user/session isolation, new-trip resets, budget/date/party changes, pending clarification, pronouns, truncated history and failed-edit preservation |
| Planning | 50 | 100 | Complete one/three-day plans, exact/per-person budgets, party/room scaling, dietary constraints, timing/diversity, weather, missing evidence, infeasible requests, children/family-room gaps, scoped/locked edits and capacity limits |
| Reliability | 50 | 100 | Provider outages/quotas, malformed/stale evidence, image failures, transaction/concurrency faults, streaming recovery, step/repair limits, invalid API requests, injection, error redaction and retry recovery |
| **Total** | **300** | **600** | |

Read the [case index](CASE_INDEX.md) for every scenario and its expected behavior.
Full bilingual prompts and gold checks are in the canonical
`private/<area>.jsonl` records described below.

## Machine-readable files

- `private/<area>.jsonl`: 50 full authoring records per area, including both language
  variants, per-turn expected handling, typed assertion parameters, fixture references
  and review status. These conform to [the authoring contract](../case.schema.json).
- `public/cases.jsonl`: 600 runner input records with no private expectations. Actor
  and session aliases are explicit. Never send this whole object to an LLM: only
  its current message, allowed conversation state and relevant tool evidence belong
  in agent input. Surface IDs, setup refs and request mutations are harness controls.
- `fixtures/environment.json`: a small, **fictional** source catalog and frozen
  facts. Actual travel prices, opening hours, forecasts, entry rules and health
  requirements cannot be inferred from these invented benchmark records.
- `fixtures/planning-environment.json`: fictional, priced candidates and a directed
  walking matrix. It is a fixture interchange format; an adapter still needs to
  map it to VISTRA's tool/notebook contracts. All candidates, not a selected gold
  plan, should be available to the planner.
- `fixtures/planning-witnesses.json`: private example feasible schedules with
  independently checked cost/occupancy/timing arithmetic. Alternative correct
  itineraries remain valid; never provide a witness as the answer to a creation task.
- `fixtures/contradictions.json`: simple certificates for impossible budget,
  occupancy, minimum-stay and time-capacity requests.
- `fixtures/public-prior-plan.json`: an explicitly allowed previous plan for an
  edit-only scenario, separate from private creation witnesses.
- `fixtures/qrels.json`: judged positive/negative **place-metadata** relevance for
  all 50 retrieval families. Unlisted candidates are unjudged. These are not
  image-pixel judgments or an exhaustive real-world document relevance collection.
- `fixtures/scenario-profiles.json`: operational condition descriptors and source
  overrides. A replay adapter must materialize each condition; do not feed profile
  names, faults, instructions or grader behavior into the model as hints.
- `manifest.json` and `fixtures/manifest.json`: counts, provenance and SHA-256 hashes.

No real photograph bytes are included. Image-availability/identity cases test honest
handling; visual relevance cannot be scored until suitable image assets are reviewed
and frozen. Guide search/index replay also needs an adapter or fixture index, not
only these JSON records. Do not describe metadata qrels as a validated SigLIP test.

## Gold semantics

Each case has concrete required behavior and typed expectations, rather than a
single exact response string. Direct answers can differ in wording; itineraries
can differ in valid venue selection. Judge claim support and constraints.

`complete`, `partial`, `clarify`, `reject`, `infeasible`, `unavailable` and `conflict`
are evaluator-normalized handling outcomes, not new API status values. `unavailable`
means a backend dependency cannot finish; `conflict` means competing session/request
state must not be overwritten. A properly explained unknown can pass a disclosure
check but cannot pass full factual verification. API status requirements appear
only in applicable cases; a streaming error is not automatically an HTTP 503.

Expected behavior is an intended product contract. Some cases deliberately expose
current limitations, such as preserving an explicit omitted meal or handling a
genuinely infeasible edit gracefully. Do not weaken gold to match an observed bug.
Provider failures, corrupt tool data and body/header mutations must be injected at
their actual boundary. Merely asking the model to pretend a provider failed is not
a valid execution of a fault case.

English and Vietnamese variants must remain semantically paired. A translation
task or explicit language override can legitimately request the opposite language;
the default-language assertion never overrides an explicit language request.
Vietnamese prose uses full diacritics, while source names and verbatim quotations
retain their original spelling.

## Splits and execution counts

Each area's authored blocks of five related scenarios share a leakage group:

| Split | Families | Language cases |
| --- | ---: | ---: |
| Development | 90 | 180 |
| Validation | 60 | 120 |
| Proposed held-out test | 150 | 300 |
| **Total** | **300** | **600** |

These are author-visible proposed splits, not a secret external test. An independent
review must also audit cross-area near-duplicates and adjust grouping before a
release freeze. Do not tune against the proposed test labels. Preserve all language
variants and repetitions of a family in one split; do not treat them as independent
statistical samples.

Three repetitions of all end-to-end language cases would be 1800 scenario executions
and 2148 user-turn requests, before additional diagnostics or retries. Planner-only
and seeded-edit diagnostics are separate settings and must have separate denominators.
No such benchmark executions have been run yet.

## Validation and regeneration

From the project root:

```powershell
.\.venv\python.exe -B -m benchmarks.scripts.validate_golden_set
```

This checks all 300 case records against the authoring contract's schema keywords,
IDs/turn refs, EN/VI pair structure, file hashes, fixture pointers, qrel entity IDs,
source-fact labels, public/private export separation and planning witness arithmetic.
It cannot establish that the bilingual prose is semantically equivalent, that every
natural-language gold decision is correct, or that VISTRA succeeds on these cases.

The manually authored sources are `benchmarks/scripts/golden_catalog.py`,
`golden_conversations.py` and `golden_planning_failures.py`. The deterministic builder
expands schema/export structure; it does not create 50 cases by changing destination
names or count translations as distinct families.

To regenerate draft outputs after editing the authoring sources:

```powershell
.\.venv\python.exe -B -m benchmarks.scripts.build_golden_set
.\.venv\python.exe -B -m benchmarks.scripts.validate_golden_set
```

Regeneration overwrites generated draft records, fixtures, manifests and the case
index. It refuses to overwrite reviewed/frozen private records. Use versioned
changes after adjudication. The private JSONL records are the canonical full cases;
the index provides a compact overview.

## Remaining release work

Two independent bilingual reviewers should adjudicate each family, especially
ambiguous task intent, translated negation, exact scope of edits, and evidence
completeness. Resolve fixture overrides into executable replay/fault adapters;
add real-domain snapshots and visual assets where appropriate. Implement independent
graders, then run the fixed cases without silently dropping failures or unsupported
features. Keep the proposed benchmark's results separate from official TravelPlanner.

Future additions should prioritize real failures and uncovered interaction types,
including richer child/elderly itineraries, pet rules, multilingual code switching,
holiday calendars, timezone-boundary arrivals, flight disruptions and user-selected
bookings. This release tests some missing-evidence boundaries, not every legal,
medical, booking or international-travel situation.

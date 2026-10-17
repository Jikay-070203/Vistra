# VISTRA benchmark description

[Bản tiếng Việt](BENCHMARK_DESCRIPTION_VI.md)

VISTRA's benchmark compares the travel-assistant system configured with
**GPT-5 nano, GPT-6 Luna and GPT-4.1 nano**. It evaluates routing, retrieval,
grounding diagnostics, memory, planning and reliability. Results describe the
saved development runs, not general model ability or production readiness.

The design is inspired by TravelPlanner's use of explicit constraints and
verifiable evidence, with additional conversational and retrieval scenarios for
VISTRA. These runs do not implement the official TravelPlanner evaluation or
establish an equivalent level of planning coverage.

## Presentation overview

![VISTRA benchmark overview](plot/benchmark_overview.png)

The overview is a **3840 × 2160 PNG in 16:9 format**, suitable for a presentation
slide. Green highlights GPT-6 Luna; dark and light gray identify the other models
in panels A–C. Panel A includes six reported metrics; panel B shows SDK-call
latency; panel C shows whole-catalog cost and token totals.

Panels D–F show final retrieval metrics once per cohort because all three model
configurations produced identical retrieval results. Their bar shades distinguish
metrics, not models. Retrieval uses the shared Voyage/BM25/SigLIP pipeline without
LLM generation. Scores on a 0–100 display scale are normalized values multiplied
by 100; this does not make ranking scores equivalent to answer accuracy.

## Dataset and execution coverage

The authored catalog contains **300 scenario families**, with 50 per area.
Each family has an English and an accented Vietnamese variant, giving
**600 language cases per model configuration**. Cases may contain multiple
ordered conversational turns; they are not uniformly one-prompt tests.

| Catalog area | Cases | Executable | Unsupported |
| --- | ---: | ---: | ---: |
| Routing | 100 | 100 | 0 |
| Retrieval | 100 | 0 | 100 |
| Grounding | 100 | 100 | 0 |
| Memory | 100 | 98 | 2 |
| Planning | 100 | 86 | 14 |
| Reliability | 100 | 24 | 76 |
| **Total** | **600** | **408** | **192** |

Execution coverage is **68%**, not a quality score. GPT-5 nano completed 404 of
408 executable attempts and had four external interruptions; the other two
configurations completed 408. A completed attempt can still contain turn errors
or failed checks. Unsupported cases remain unmeasured rather than counted as
successes or failures.

A separate **100-case actual-index retrieval supplement** contains 50 category,
30 exact-place and 20 guide-section queries. Each configuration completed all
100 with no case errors. These cases have different evidence and labels from
the catalog's fictional retrieval cases and do not replace its unsupported row.

## What the six overview metrics mean

| Metric | Calculation and scope |
| --- | --- |
| Routing | `100 × passed / (passed + failed)` implemented checks for response mode, action and scope. |
| Retrieval | Guide-context hit rate: requested guide section reaches generation context, `100 × 16/20 = 80`. This is one supplement metric, not a composite retrieval score. |
| Grounding | Completed grounding cases with at least one recognized `[S#]` citation, divided by completed grounding cases, multiplied by 100. Citation presence does not establish factual support. |
| Memory | Agreement rate over implemented literal state, write and preservation checks. It does not establish all preference semantics. |
| Planning | Agreement rate over implemented itinerary structure checks, such as dates, meal slots, source identities and protected edits. It does not establish complete route, budget or schedule feasibility. |
| Reliability | Agreement rate over 46 implemented API/input-rejection checks, covering only 24 catalog cases. It does not establish general resilience to outages or dependency faults. |

Behavioral rates exclude unscored checks. Conditional checks can have different
denominators across models. For the overview's behavioral comparison, the same
four externally interrupted case IDs are excluded from every configuration;
whole-run reports retain their original totals. Consequently, some overview
rates differ from calculations made directly from the full report's raw counts.

| Reported metric, 0–100 | GPT-6 Luna | GPT-5 nano | GPT-4.1 nano |
| --- | ---: | ---: | ---: |
| Routing | 96.4 | 90.5 | 64.0 |
| Retrieval: guide context | 80.0 | 80.0 | 80.0 |
| Grounding: citation presence | 84.0 | 78.0 | 0.0 |
| Memory | 94.7 | 87.4 | 69.4 |
| Planning: structural checks | 97.2 | 93.0 | 75.6 |
| Reliability: narrow checks | 100.0 | 100.0 | 100.0 |

GPT-4.1 nano returned nonempty answers for all 100 grounding cases, but none used
the recognized citation syntax. Its zero citation-presence score is not zero
factual accuracy. There is **no overall accuracy score or mean of these six
metrics**, because their scopes and denominators differ.

## Detailed retrieval metrics

Metrics are calculated per query over distinct returned results, then averaged
within each cohort. Let `R` be the labeled relevant set and `L` the returned list,
truncated to 20 results.

| Metric | Definition |
| --- | --- |
| Returned precision | Relevant results in `L` divided by the actual number returned; an empty list scores zero. |
| Precision@20 | Relevant results in `L` divided by 20, even when fewer results are returned. |
| Recall@20 | Relevant results in `L` divided by the size of `R`. |
| nDCG@10 | Binary relevance discounted by `log2(rank + 1)` in the first ten results, divided by the ideal discounted gain. |
| Hit@5 | One if at least one relevant result appears in the first five, otherwise zero. |
| MRR@20 | Reciprocal rank of the first relevant result within 20, averaged across queries; zero when none is retrieved for a positive query. |

| Final metric, 0–100 | Category, 50 cases | Exact place, 30 cases | Guide section, 20 cases |
| --- | ---: | ---: | ---: |
| Returned precision | 96.0 | 100.0 | 16.9 |
| Precision@20 | 68.2 | 5.0 | 13.5 |
| Recall@20 | 59.3 | 100.0 | 100.0 |
| nDCG@10 | 100.0 | 100.0 | 69.7 |
| Hit@5 | 100.0 | 100.0 | 100.0 |
| MRR@20 | 100.0 | 100.0 | 66.7 |

Two category queries have no relevant indexed places. They contribute zero to
precision; recall, nDCG, Hit and reciprocal rank are undefined and excluded from
those averages, leaving 48 eligible category queries for those metrics.
Correct-empty behavior is recorded separately. An exact-place query returning
one correct result has returned precision 100 but Precision@20 of 5 by definition.

Relevance labels derive from place metadata and guide-section labels, not human
judgments of photo pixels or every retrieved sentence. Final category/name
filters improve results beyond the raw embedding ranking. Category recall is
also capped when more than 20 relevant places exist. High final scores therefore
do not establish general visual understanding or strong raw embedding retrieval.

## Latency, tokens and cost

Panel B measures minimum, arithmetic mean and maximum latency across eligible
recorded SDK calls. Open circles mark Min, filled circles Mean and diamonds Max.
These are individual provider calls, not frontend response times, entire turns
or conversations. Calls differ in stage, prompt length and cache conditions.

| Model | Eligible calls | Min, seconds | Mean, seconds | Max, seconds | Whole-run input + output tokens | Known-usage cost, USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| GPT-6 Luna | 1,563 | 0.985 | 2.999 | 15.147 | 5,630,169 | 0.69613542 |
| GPT-5 nano | 1,424 | 1.225 | 4.718 | 48.086 | 5,515,255 | 0.47178779 |
| GPT-4.1 nano | 1,458 | 0.648 | 1.679 | 9.034 | 5,055,124 | 0.51321010 |

Panel C's bars use the whole catalog's recorded usage, independently of latency
extremes. Total tokens equal input plus output. Cached/cache-write tokens are
subsets of input, and reasoning tokens are included in output; these are not
added again. Costs use the saved Standard-rate pricing snapshot, including
available cache billing details, rather than current prices or verified invoices.

Two GPT-4.1 nano SDK events lack usage and are excluded from the eligible latency
subset. Interrupted GPT-5 nano attempts may have unreported calls. Unknown usage
is not assumed free. Preflight usage, Jev calls, local compute and unreported
SDK-internal retries are outside the plotted catalog cost estimates. Cache
conditions were not controlled across runs.

## Interpretation and next evaluation step

GPT-6 Luna has the highest observed routing, memory and structural planning
agreement in this pass. GPT-4.1 nano has the lowest mean SDK latency but more
failed behavioral checks and no recognized grounding citations. GPT-5 nano has
the lowest observed known-usage catalog cost. Retrieval results are shared and
do not rank the LLMs.

These are development diagnostics from one pass. Authored labels still require
independent review; many semantic assertions and fault adapters remain unscored
or unsupported. Model self-review is not an independent quality judgment. Full
itinerary feasibility, grounded claim correctness, user usefulness and overall
task success need separate evaluation before claiming real planning quality.

## Evidence and reproduction

- [Three-model report](runs/model-comparison/REPORT.md) and
  [aggregate source](runs/model-comparison/summary.json).
- [Catalog execution protocol](evaluation/README.md).
- [Retrieval protocol](retrieval/README.md) and
  [actual-index results](runs/gpt-5-nano/retrieval/REPORT.md).
- [Local dataset artifacts](vistra/) and
  [development regression workflow](measurement/README.md).
- [Overview generator](plot/overview.py) and
  [presentation PNG](plot/benchmark_overview.png).

From the project root, regenerate only the overview without provider calls:

```powershell
.\.venv\python.exe -B benchmarks/plot/overview.py
```

The generator uses the existing isolated Matplotlib installation in
`.cache/benchmark-plots`, validates saved result and usage hashes, and embeds
source provenance in the PNG metadata. It writes only the overview PNG, leaving
`plot/` restricted to PNG and Python files. Raw evidence and golden cases remain
local where excluded from the GitHub summary distribution.

"""Plot the saved VISTRA comparison without rerunning models or changing evidence."""

from collections import Counter
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RUNS = ROOT / 'benchmarks/runs'
MODELS = ('gpt-5-nano', 'gpt-6-luna', 'gpt-4.1-nano')
NAMES = {'gpt-5-nano': 'GPT-5 nano', 'gpt-6-luna': 'GPT-6 Luna', 'gpt-4.1-nano': 'GPT-4.1 nano'}
COLORS = {'gpt-5-nano': '#3475AD', 'gpt-6-luna': '#14816D', 'gpt-4.1-nano': '#C6782A'}
PRESENTATION_ORDER = ('gpt-6-luna', 'gpt-5-nano', 'gpt-4.1-nano')
PRESENTATION_COLORS = {'gpt-6-luna': '#70AD00', 'gpt-5-nano': '#6B6B6B', 'gpt-4.1-nano': '#BDBDBD'}
FAMILIES = ('routing', 'retrieval', 'grounding', 'memory', 'planning', 'reliability')
BAR_FAMILIES = ('routing', 'memory', 'planning', 'reliability')


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def records(path):
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]


def collect():
    source = RUNS / 'model-comparison/summary.json'
    comparison = read(source)
    fingerprints = {source.relative_to(ROOT).as_posix(): sha256(source.read_bytes()).hexdigest()}
    catalogs = {}
    excluded = set()
    for model in MODELS:
        item = comparison['models'][model]
        path = (RUNS / item['catalog_path']).resolve()
        if not path.is_relative_to(RUNS.resolve()):
            raise ValueError('Catalog path must remain inside benchmarks/runs.')
        seals = read(path / 'artifact_hashes.json')
        for name in ('results.jsonl', 'checks.jsonl', 'summary.json', 'run.json', 'cost.json'):
            actual = sha256((path / name).read_bytes()).hexdigest()
            if seals[name] != actual:
                raise ValueError(f'Artifact checksum mismatch: {path / name}')
            fingerprints[(path / name).relative_to(ROOT).as_posix()] = actual
        if read(path / 'summary.json') != item['summary'] or read(path / 'cost.json') != item['token_cost']:
            raise ValueError('Comparison snapshot differs from its catalog evidence.')
        results, checks = records(path / 'results.jsonl'), records(path / 'checks.jsonl')
        if len(results) != 600 or len({r['case_id'] for r in results}) != 600:
            raise ValueError('Expected 600 unique catalog records per model.')
        if dict(Counter(r['status'] for r in checks)) != item['summary']['check_counts']:
            raise ValueError('Raw checks disagree with the published totals.')
        excluded.update(r['case_id'] for r in results if r['outcome'] == 'interrupted')
        catalogs[model] = (results, checks)
    case_sets = [{r['case_id'] for r in catalogs[m][0]} for m in MODELS]
    if not all(ids == case_sets[0] for ids in case_sets):
        raise ValueError('Model case sets differ.')

    values = {}
    for model in MODELS:
        item = comparison['models'][model]
        results, checks = catalogs[model]
        families = {}
        for family in FAMILIES:
            counts = Counter(r['status'] for r in checks if r['track'] == family and r['case_id'] not in excluded)
            passed, failed = counts['pass'], counts['fail']
            family_cases = [r for r in results if r['track'] == family]
            families[family] = {'pass': passed, 'fail': failed, 'scored': passed + failed,
                'unscored': counts['unscored'],
                'agreement_percent': 100 * passed / (passed + failed) if passed + failed else None,
                'catalog_cases': len(family_cases),
                'unsupported_cases': sum(r['outcome'] == 'unsupported' for r in family_cases)}
        grounding_cases = [r for r in results if r['track'] == 'grounding' and r['outcome'] == 'completed']
        cited_cases = sum(any(re.search(r'\[S\d+\]', t.get('result', {}).get('answer') or '')
            for t in r.get('turns', [])) for r in grounding_cases)
        citation_checks = Counter(r['status'] for r in checks if r['track'] == 'grounding'
            and r['check'].endswith('.citation_ids') and r['case_id'] not in excluded)
        retrieval_path = RUNS / model / 'retrieval'
        retrieval_source = retrieval_path / 'summary.json'
        retrieval_digest = sha256(retrieval_source.read_bytes()).hexdigest()
        if read(retrieval_path / 'artifact_hashes.json')['summary.json'] != retrieval_digest:
            raise ValueError('Retrieval summary checksum mismatch.')
        retrieval = read(retrieval_source)
        if retrieval != item['retrieval'] or retrieval['llm_generation_used']:
            raise ValueError('Expected the saved LLM-independent retrieval supplement.')
        fingerprints[retrieval_source.relative_to(ROOT).as_posix()] = retrieval_digest
        cost = item['token_cost']
        values[model] = {'display_name': NAMES[model], 'color': COLORS[model], 'families': families,
            'grounding_diagnostics': {'completed_cases': len(grounding_cases),
                'cases_with_recognized_citations': cited_cases,
                'recognized_citation_presence_percent': 100 * cited_cases / len(grounding_cases) if grounding_cases else None,
                'citation_id_checks': dict(citation_checks),
                'claim_support_accuracy': None},
            'retrieval_supplement': retrieval,
            'worker_latency': item['summary']['worker_wall_timing'],
            'known_usage_cost_usd': cost['estimated_known_usage_subtotal_usd'],
            'cost_usage_incomplete': cost['estimated_total_usd'] is None,
            'cost_missing_usage_events': cost['unpriceable_or_missing_usage_events'],
            'pricing_sha256': cost['pricing_sha256'],
            'cost_interrupted_cases': cost['interrupted_cases_with_possible_unreported_calls'],
            'catalog_cases': item['summary']['catalog_cases'],
            'supported_cases': item['summary']['executed_cases'],
            'unsupported_cases': item['summary']['unsupported_cases'],
            'completed_cases': item['summary']['outcomes'].get('completed', 0)}
    if any(values[m]['retrieval_supplement'] != values[MODELS[0]]['retrieval_supplement'] for m in MODELS):
        raise ValueError('Retrieval metrics differ; a shared retrieval panel would be misleading.')
    return {'source': source.relative_to(ROOT).as_posix(), 'input_sha256': fingerprints,
        'excluded_from_behavioral_comparison': sorted(excluded), 'models': values,
        'behavioral_formula': '100 * pass / (pass + fail); unscored excluded; conditional denominators differ',
        'behavioral_scope': 'Same externally interrupted case IDs excluded from all models; routing/memory/planning/reliability subchecks',
        'grounding_scope': 'Recognized [S#] citation presence and conditional source-ID validity only; no factual-support score',
        'retrieval_scope': 'Separate 100-case actual-index supplement per configuration; identical metrics and no LLM generation',
        'latency_and_cost_scope': 'Published whole-run observations; not restricted to the behavioral paired subset',
        'not_measured': ['overall answer quality', 'independent full-itinerary feasibility', 'overall task success']}


def render(data):
    # Optional plot dependencies are isolated from VISTRA's application environment.
    cache = ROOT / '.cache/benchmark-plots'
    if cache.is_dir():
        sys.path.insert(0, str(cache))
    os.environ.setdefault('MPLCONFIGDIR', str(ROOT / '.cache/benchmark-plot-config'))
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        from matplotlib.lines import Line2D
        from matplotlib.patches import Patch
        from matplotlib.ticker import FuncFormatter
    except ImportError as exc:
        raise SystemExit('Install plot dependencies with the command in benchmarks/plot/README.md.') from exc

    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10.5,
        'axes.labelcolor': '#475569', 'xtick.color': '#64748B', 'ytick.color': '#25364A',
        'axes.edgecolor': '#CBD5E1', 'svg.fonttype': 'none', 'savefig.facecolor': '#FFFFFF'})
    fig = plt.figure(figsize=(17.5, 9.5), facecolor='white')
    grid = fig.add_gridspec(1, 3, left=.075, right=.973, bottom=.30, top=.735,
        width_ratios=(2.5, 1.5, 1.2), wspace=.56)
    a, b, c = [fig.add_subplot(grid[0, i]) for i in range(3)]
    fig.text(.075, .948, 'VISTRA | Three-model benchmark', fontsize=25, weight='bold', color='#172D40')
    fig.text(.075, .907, 'Scored behaviors, worker latency and observed API cost  |  One catalog pass per model',
        fontsize=12, color='#64748B')
    fig.legend(handles=[Patch(facecolor=COLORS[m], label=NAMES[m]) for m in MODELS],
        loc='upper left', bbox_to_anchor=(.071, .875), ncol=3, frameon=False,
        fontsize=11.5, handlelength=1.2, columnspacing=2.4)
    for ax in (a, b, c):
        ax.set_axisbelow(True)
        ax.grid(axis='x', color='#E5EBF0', linewidth=.8)
        for side in ('top', 'right', 'left'):
            ax.spines[side].set_visible(False)
        ax.tick_params(axis='both', length=0, pad=8)

    def panel_title(ax, title, subtitle):
        x = ax.get_position().x0
        fig.text(x, .794, title, fontsize=13, color='#172D40', weight='bold')
        fig.text(x, .765, subtitle, fontsize=10, color='#64748B')

    panel_title(a, 'A  Scored behavioral checks', 'Higher is better | Labels: rate and passed/scored checks')
    centers = [0, 1, 2, 3]
    for j, model in enumerate(MODELS):
        for center, family in zip(centers, BAR_FAMILIES):
            value = data['models'][model]['families'][family]
            score = value['agreement_percent']
            y = center + (j - 1) * .22
            a.barh(y, score, height=.18, color=COLORS[model], zorder=3)
            a.text(score - 1.8, y, f"{score:.1f}%  |  {value['pass']}/{value['scored']}",
                ha='right', va='center', color='white', weight='bold', fontsize=10)
    a.set_xlim(0, 100)
    a.set_xticks([0, 20, 40, 60, 80, 100])
    a.set_yticks(centers, [f.capitalize() for f in BAR_FAMILIES], fontsize=11, weight='normal')
    a.set_ylim(-.5, 3.5)
    a.invert_yaxis()
    a.set_xlabel('Scored-check agreement (%)', labelpad=12)

    panel_title(b, 'B  Worker latency', 'Lower is better | Whole-run median and p95')
    rows = [0, 1, 2]
    for y, model in zip(rows, MODELS):
        timing = data['models'][model]['worker_latency']
        median, p95 = timing['median_seconds'], timing['p95_seconds']
        b.plot([median, p95], [y, y], color=COLORS[model], linewidth=3, alpha=.55)
        b.scatter([median], [y], color=COLORS[model], s=65, zorder=4)
        b.scatter([p95], [y], facecolor='white', edgecolor=COLORS[model], marker='D', linewidth=1.8, s=60, zorder=4)
        for x in (median, p95):
            b.annotate(f'{x:.1f}', (x, y), xytext=(0, 13), textcoords='offset points',
                ha='center', color=COLORS[model], weight='bold', fontsize=10.5)
    b.set_yticks(rows, [NAMES[m] for m in MODELS], fontsize=10)
    b.set_ylim(-.6, 2.6)
    b.invert_yaxis()
    b.set_xlim(0, 60)
    b.set_xticks([0, 20, 40, 60])
    b.set_xlabel('Seconds', labelpad=12)
    b.legend(handles=[Line2D([], [], marker='o', color='#64748B', linestyle='none', label='Median'),
        Line2D([], [], marker='D', markerfacecolor='white', color='#64748B', linestyle='none', label='p95')],
        loc='upper center', bbox_to_anchor=(.5, -.16), ncol=2, frameon=False, fontsize=9.5,
        handletextpad=.3, columnspacing=1.1)

    panel_title(c, 'C  Observed API cost', 'Known-usage Standard-rate estimate')
    for y, model in zip(rows, MODELS):
        value = data['models'][model]
        cost = value['known_usage_cost_usd']
        c.barh(y, cost, height=.43, color=COLORS[model], zorder=3)
        suffix = '*' if value['cost_usage_incomplete'] else ''
        c.text(cost - .025, y, f'${cost:.3f}{suffix}', color='white', weight='bold',
            va='center', ha='right', fontsize=11)
    c.set_yticks(rows, [NAMES[m] for m in MODELS], fontsize=10)
    c.set_ylim(-.6, 2.6)
    c.invert_yaxis()
    c.set_xlim(0, .8)
    c.set_xticks([0, .2, .4, .6, .8])
    c.xaxis.set_major_formatter(FuncFormatter(lambda x, _: f'${x:.1f}'))
    c.set_xlabel('USD per catalog run', labelpad=12)

    fig.text(.075, .177, 'Coverage: 408/600 cases supported per model (68%); 192 unsupported. These are automated subchecks, not overall task-success scores.',
        fontsize=10.7, weight='normal', color='#25364A')
    notes = [
        'A: The same 4 interrupted cases and unscored checks are excluded. Denominators differ; reliability covers only 24/100 catalog cases.',
        'B-C: Published whole-run measurements. Worker timing includes startup and memory snapshots; cost and cache conditions are not controlled.',
        '* Usage is incomplete: 4 interrupted GPT-5 nano attempts and 2 GPT-4.1 nano calls without usage. Costs are known-usage subtotals, not invoices.',
        'Independent answer quality and complete itinerary feasibility remain unscored. Source: benchmarks/runs/model-comparison/summary.json',
    ]
    for i, note in enumerate(notes):
        fig.text(.075, .137 - i * .027, note, fontsize=9.8, color='#64748B')
    fig.savefig(HERE / 'model_comparison.png', dpi=190)
    fig.savefig(HERE / 'model_comparison.svg')
    plt.close(fig)
    render_families(data, plt, Patch)
    from latency_cost import render_latency_cost
    render_latency_cost(data, ROOT, HERE, plt, Line2D, PRESENTATION_ORDER, PRESENTATION_COLORS)
    from retrieval_metrics import render_retrieval_metrics
    render_retrieval_metrics(data, ROOT, HERE, plt, Patch, PRESENTATION_ORDER)
    data['plotting_library'] = {'name': 'matplotlib', 'version': matplotlib.__version__}


def render_families(data, plt, Patch):
    """Reference-style grouped bars; metric definitions live in README and JSON."""
    order = PRESENTATION_ORDER
    colors = PRESENTATION_COLORS
    grouped = {}
    for model in order:
        v = data['models'][model]
        r = v['retrieval_supplement']
        grouped[model] = [
            v['families']['routing']['agreement_percent'],
            100 * r['guide_context_section_hit_cases'] / r['guide_context_section_hit_denominator'],
            v['grounding_diagnostics']['recognized_citation_presence_percent'],
            v['families']['memory']['agreement_percent'],
            v['families']['planning']['agreement_percent'],
            v['families']['reliability']['agreement_percent'],
        ]
        if any(value is None or not 0 <= value <= 100 for value in grouped[model]):
            raise ValueError('Grouped chart needs six measured percentages per model.')
    data['grouped_figure'] = {
        'model_order': list(order), 'colors': colors, 'values_percent': grouped,
        'metric_order': ['routing_check_agreement', 'retrieval_guide_context_hit',
            'grounding_recognized_citation_presence', 'memory_check_agreement',
            'planning_structural_check_agreement', 'reliability_limited_check_agreement'],
        'retrieval_selection': 'Guide context hit is one retrieval metric, not a composite retrieval score.',
        'grounding_selection': 'Citation presence is not factual support; no overall grounding accuracy is available.',
        'overall_mean': None,
        'display_descriptions': False,
    }
    fig, ax = plt.subplots(figsize=(16.8, 7.7), facecolor='white')
    fig.subplots_adjust(left=.075, right=.975, bottom=.14, top=.79)
    fig.suptitle('VISTRA Benchmark — Three-Model Comparison', y=.955,
        fontsize=23, weight='bold', color='#252525')
    fig.legend(handles=[Patch(facecolor=colors[m], label=NAMES[m]) for m in order],
        loc='upper right', bbox_to_anchor=(.975, .91), frameon=True, edgecolor='#D5D5D5',
        fontsize=10.5, handlelength=1.7, borderpad=.7)
    width = .22
    for j, model in enumerate(order):
        positions = [i + (j - 1) * width for i in range(6)]
        bars = ax.bar(positions, grouped[model], width=width, color=colors[model],
            edgecolor='white', linewidth=.75, zorder=3)
        for bar, value in zip(bars, grouped[model]):
            x = bar.get_x() + bar.get_width() / 2
            ax.annotate(f'{value:.1f}', (x, value), xytext=(0, 5), textcoords='offset points',
                ha='center', va='bottom', fontsize=10.3, color='#303030', weight='bold')
            if value == 0:
                ax.plot([x - width / 2, x + width / 2], [0, 0], color=colors[model], linewidth=3, clip_on=False)
    ax.set_axisbelow(True)
    ax.grid(axis='y', linestyle='--', linewidth=.7, color='#DDDDDD', alpha=.8)
    for side in ('top', 'right'):
        ax.spines[side].set_visible(False)
    for side in ('left', 'bottom'):
        ax.spines[side].set_color('#D0D0D0')
    ax.set_ylim(0, 110)
    ax.set_yticks(range(0, 101, 20))
    ax.set_ylabel('Reported metric (%)', fontsize=12, weight='bold', color='#303030')
    ax.set_xlim(-.62, 5.62)
    ax.set_xticks(range(6), ['Routing', 'Retrieval', 'Grounding', 'Memory', 'Planning', 'Reliability'],
        fontsize=12, weight='bold', color='#303030')
    ax.tick_params(axis='x', length=0, pad=12)
    ax.tick_params(axis='y', colors='#626262', labelsize=10.5)
    fig.savefig(HERE / 'benchmark_families.png', dpi=190)
    fig.savefig(HERE / 'benchmark_families.svg')
    plt.close(fig)


def main():
    data = collect()
    render(data)
    (HERE / 'plot_data.json').write_text(json.dumps(data, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print('Saved benchmark, latency/cost and three retrieval-metric PNG/SVG figures plus plot_data.json.')


if __name__ == '__main__':
    main()

"""Per-cohort retrieval charts with model configurations on a shared 0-100 axis."""

from hashlib import sha256
import json
from math import isclose, isfinite
from statistics import fmean


METRICS = (
    ('precision_of_returned_at_20', 'Precision (returned)', '#70AD00'),
    ('precision_at_20', 'Precision@20', '#555555'),
    ('recall_at_20', 'Recall@20', '#777777'),
    ('ndcg_at_10', 'nDCG@10', '#999999'),
    ('hit_at_5', 'Hit@5', '#BBBBBB'),
    ('reciprocal_rank_at_20', 'MRR@20', '#DDDDDD'),
)
COHORTS = (
    ('category', 'retrieval_category', 'VISTRA Retrieval — Image Category Search'),
    ('known_place', 'retrieval_known_place', 'VISTRA Retrieval — Exact-Place Search'),
    ('guide_section', 'retrieval_guides', 'VISTRA Retrieval — Guide Section Search'),
)


def render_retrieval_metrics(data, root, here, plt, Patch, order):
    summaries = {}
    output = {'x_axis': 'LLM configuration used for the benchmark run',
        'y_axis': '0-100 shared display scale; final-pipeline per-query macro means multiplied by 100',
        'display_multiplier': 100, 'display_scale': [0, 100],
        'stage': 'final', 'llm_generation_used': False,
        'interpretation': 'Retrieval is shared; identical bars do not measure a difference between LLM abilities.',
        'metric_order': [key for key, _, _ in METRICS], 'models': {}}
    for model in order:
        path = root / 'benchmarks/runs' / model / 'retrieval'
        seals = json.loads((path / 'artifact_hashes.json').read_text(encoding='utf-8'))
        source = path / 'results.jsonl'
        digest = sha256(source.read_bytes()).hexdigest()
        if seals['results.jsonl'] != digest:
            raise ValueError('Retrieval results checksum mismatch: ' + model)
        data['input_sha256'][source.relative_to(root).as_posix()] = digest
        rows = [json.loads(line) for line in source.read_text(encoding='utf-8').splitlines() if line.strip()]
        if len(rows) != 100 or len({r['case_id'] for r in rows}) != 100 or any(r.get('error') for r in rows):
            raise ValueError('Expected 100 complete, error-free actual-index retrieval records.')
        summary = data['models'][model]['retrieval_supplement']
        summaries[model] = summary
        output['models'][model] = {}
        for cohort, _, _ in COHORTS:
            group = [r for r in rows if r['kind'] == cohort]
            result = {'case_count': len(group), 'metrics': {}, 'metric_denominators': {}}
            if len(group) != summary['by_kind'][cohort]['cases']:
                raise ValueError('Retrieval cohort case count differs from the summary.')
            for key, _, _ in METRICS:
                observations = [r['final'][key] for r in group if r['final'][key] is not None]
                value = fmean(observations) if observations else None
                published = summary['by_kind'][cohort]['final'][key]
                if value is None or not isfinite(value) or not 0 <= value <= 1 or not isclose(value, published, abs_tol=1e-12):
                    raise ValueError(f'Retrieval metric missing or inconsistent: {model}/{cohort}/{key}')
                result['metrics'][key] = value
                result['metric_denominators'][key] = len(observations)
            output['models'][model][cohort] = result
    output['identical_across_configurations'] = all(summaries[m] == summaries[order[0]] for m in order)
    data['retrieval_metric_figures'] = output

    for cohort, filename, title in COHORTS:
        fig, ax = plt.subplots(figsize=(16.8, 7.7), facecolor='white')
        fig.subplots_adjust(left=.075, right=.975, bottom=.14, top=.76)
        fig.suptitle(title, y=.955, fontsize=23, weight='bold', color='#252525')
        fig.legend(handles=[Patch(facecolor=color, label=name) for _, name, color in METRICS],
            loc='upper center', bbox_to_anchor=(.525, .915), ncol=3, frameon=True,
            edgecolor='#D5D5D5', fontsize=10.5, handlelength=1.5, borderpad=.8, columnspacing=2)
        width = .125
        for j, (key, _, color) in enumerate(METRICS):
            positions = [i + (j - 2.5) * width for i in range(len(order))]
            values = [100 * output['models'][model][cohort]['metrics'][key] for model in order]
            bars = ax.bar(positions, values, width=width, color=color, edgecolor='white', linewidth=.75, zorder=3)
            for bar, value in zip(bars, values):
                ax.annotate(f'{value:.1f}', (bar.get_x() + bar.get_width()/2, value),
                    xytext=(0, 5), textcoords='offset points', ha='center', va='bottom',
                    fontsize=10.5, weight='bold', color='#303030')
        ax.set_axisbelow(True)
        ax.grid(axis='y', linestyle='--', linewidth=.7, color='#DDDDDD', alpha=.8)
        for side in ('top', 'right'):
            ax.spines[side].set_visible(False)
        for side in ('left', 'bottom'):
            ax.spines[side].set_color('#D0D0D0')
        ax.set_ylim(0, 100)
        ax.set_yticks([0, 20, 40, 60, 80, 100])
        ax.set_ylabel('Retrieval metric (0–100)', fontsize=12, weight='bold', color='#303030')
        ax.set_xlim(-.62, len(order)-.38)
        ax.set_xticks(range(len(order)), [data['models'][m]['display_name'] for m in order],
            fontsize=12, weight='bold', color='#303030')
        ax.tick_params(axis='x', length=0, pad=12)
        ax.tick_params(axis='y', colors='#626262', labelsize=10.5)
        fig.savefig(here / (filename + '.png'), dpi=190)
        fig.savefig(here / (filename + '.svg'))
        plt.close(fig)

r"""Render one 16:9 presentation PNG from the sealed benchmark results.

Run: .\.venv\python.exe -B benchmarks/plot/overview.py
Retrieval is identical across configurations and is displayed once per cohort.
Family scores mix behavioral subchecks, citation presence and guide-context hit;
they are not an overall quality score. SDK latency and whole-run usage have
different scopes. Costs are known-usage estimates, with incomplete usage retained.
"""

import argparse
import json
import os
import sys

from plot_models import (
    HERE, ROOT, NAMES, PRESENTATION_ORDER as ORDER,
    PRESENTATION_COLORS as COLORS, collect,
)
from latency_cost import collect_latency_cost
from retrieval_metrics import METRICS


VI = {
    'VISTRA  |  Three-Model Benchmark': 'VISTRA  |  So sánh ba mô hình',
    'A  Reported benchmark metrics': 'A  Các chỉ số đánh giá',
    'Reported metric (0–100)': 'Chỉ số đánh giá (0–100)',
    'Routing': 'Định tuyến', 'Retrieval': 'Truy xuất',
    'Grounding\n(citations)': 'Trích dẫn\nnguồn', 'Memory': 'Bộ nhớ',
    'Planning': 'Lập kế hoạch', 'Reliability\n(checks)': 'Độ tin cậy\n(kiểm tra)',
    'B  SDK call latency': 'B  Độ trễ gọi SDK',
    'Seconds per SDK call': 'Giây / lần gọi SDK',
    'Min': 'Nhỏ nhất', 'Mean': 'Trung bình', 'Max': 'Lớn nhất',
    'C  Cost & tokens': 'C  Chi phí & token',
    'Known API cost · USD / run': 'Chi phí API đã ghi nhận · USD / lượt chạy',
    'Token usage · millions / run': 'Lượng token · triệu / lượt chạy',
    'Returned precision': 'Độ chính xác trả về',
    'Category': 'Danh mục', 'Exact place': 'Đúng địa điểm',
    'Guide section': 'Mục hướng dẫn',
    'Shared retrieval': 'Truy xuất chung',
    'Retrieval metric (0–100)': 'Chỉ số truy xuất (0–100)',
}


def main(language='en'):
    def tr(label):
        return VI.get(label, label) if language == 'vi' else label

    data = collect()
    latency = collect_latency_cost(data, ROOT)
    comparison = json.loads((ROOT / data['source']).read_text(encoding='utf-8'))
    sys.path.insert(0, str(ROOT / '.cache/benchmark-plots'))
    os.environ.setdefault('MPLCONFIGDIR', str(ROOT / '.cache/benchmark-plot-config'))
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    from matplotlib.patches import Patch

    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 13,
        'text.color': '#252525', 'axes.labelcolor': '#444444',
        'xtick.color': '#666666', 'ytick.color': '#444444'})
    fig = plt.figure(figsize=(24, 13.5), facecolor='white')
    fig.text(.045, .955, tr('VISTRA  |  Three-Model Benchmark'), fontsize=30, weight='bold')
    fig.legend(handles=[Patch(facecolor=COLORS[m], label=NAMES[m]) for m in ORDER],
        loc='upper right', bbox_to_anchor=(.965, .968), ncol=3,
        frameon=False, fontsize=15, handlelength=1.3, columnspacing=1.5)

    def title(x, y, label):
        fig.text(x, y, tr(label), fontsize=18, weight='bold')

    def style(ax, direction='y'):
        ax.set_axisbelow(True)
        ax.grid(axis=direction, color='#DEDEDE', linewidth=.8, linestyle='--', alpha=.8)
        for side in ('top', 'right'):
            ax.spines[side].set_visible(False)
        for side in ('left', 'bottom'):
            ax.spines[side].set_color('#D0D0D0')
        ax.tick_params(length=0, pad=8)

    title(.055, .875, 'A  Reported benchmark metrics')
    families = fig.add_axes([.055, .545, .48, .27])
    style(families)
    family_values = {}
    for j, model in enumerate(ORDER):
        v = data['models'][model]
        r = v['retrieval_supplement']
        values = [v['families']['routing']['agreement_percent'],
            100 * r['guide_context_section_hit_cases'] / r['guide_context_section_hit_denominator'],
            v['grounding_diagnostics']['recognized_citation_presence_percent'],
            *[v['families'][f]['agreement_percent'] for f in ('memory', 'planning', 'reliability')]]
        family_values[model] = values
        assert len(values) == 6 and all(0 <= x <= 100 for x in values)
        bars = families.bar([i + (j - 1) * .25 for i in range(6)], values,
            width=.245, color=COLORS[model], edgecolor='white', linewidth=.7, zorder=3)
        for bar, value in zip(bars, values):
            families.annotate(f'{value:.1f}'.rstrip('0').rstrip('.'), (bar.get_x() + bar.get_width()/2, value),
                xytext=(0, 6), textcoords='offset points', ha='center',
                fontsize=11, weight='bold')
    families.set_ylim(0, 100)
    families.set_yticks([0, 20, 40, 60, 80, 100])
    families.set_ylabel(tr('Reported metric (0–100)'), fontsize=13)
    families.set_xticks(range(6), [tr(label) for label in ['Routing', 'Retrieval', 'Grounding\n(citations)',
        'Memory', 'Planning', 'Reliability\n(checks)']], fontsize=13, weight='bold')
    families.tick_params(axis='x', pad=14)
    families.set_xlim(-.6, 5.6)

    title(.60, .875, 'B  SDK call latency')
    speed = fig.add_axes([.64, .555, .15, .255])
    style(speed, 'x')
    for y, model in enumerate(ORDER):
        points = latency['models'][model]['points']
        low, mean, high = [points[k]['latency_seconds'] for k in ('Min', 'Mean', 'Max')]
        color = COLORS[model]
        speed.plot([low, high], [y, y], color=color, alpha=.6, linewidth=4)
        speed.scatter([low], [y], s=65, facecolor='white', edgecolor=color, linewidth=2, zorder=3)
        speed.scatter([mean], [y], s=100, color=color, edgecolor='white', linewidth=.7, zorder=4)
        speed.scatter([high], [y], s=65, marker='D', facecolor='white', edgecolor=color, linewidth=2, zorder=3)
        for value, offset in ((low, -23), (mean, 20), (high, 20)):
            speed.annotate(f'{value:.1f}', (value, y), xytext=(0, offset),
                textcoords='offset points', ha='center', va='center', fontsize=13, weight='bold')
    speed.set_yticks(range(3), ['GPT-6 Luna', 'GPT-5 nano', 'GPT-4.1 nano'], fontsize=12)
    speed.set_ylim(2.55, -.55)
    speed.set_xlim(0, 55)
    speed.set_xticks([0, 20, 40])
    speed.set_xlabel(tr('Seconds per SDK call'), fontsize=12, labelpad=12)
    speed.spines['left'].set_visible(False)
    speed.legend(handles=[Line2D([], [], marker=marker, markerfacecolor=fill,
        color='#777777', linestyle='none', label=tr(name)) for name, marker, fill in
        [('Min', 'o', 'white'), ('Mean', 'o', '#777777'), ('Max', 'D', 'white')]],
        loc='upper center', bbox_to_anchor=(.5, -.25), ncol=3, frameon=False,
        fontsize=11, handletextpad=.2, columnspacing=.8)

    title(.835, .875, 'C  Cost & tokens')
    usage_totals = {}
    for bottom, money in ((.69, True), (.495, False)):
        ax = fig.add_axes([.84, bottom, .12, .105])
        style(ax, 'x')
        ax.set_title(tr('Known API cost · USD / run' if money else 'Token usage · millions / run'),
            loc='left', fontsize=10.5 if language == 'vi' else 12, weight='bold', pad=14)
        for y, model in enumerate(ORDER):
            tokens = sum(comparison['models'][model]['summary']['provider_usage'][k]
                for k in ('input_tokens', 'output_tokens'))
            usage_totals[model] = tokens
            value = data['models'][model]['known_usage_cost_usd'] if money else tokens / 1e6
            ax.barh(y, value, height=.58, color=COLORS[model], zorder=3)
            ax.text(value - (.025 if money else .17), y,
                f'${value:.3f}' if money else f'{value:.2f}M', va='center', ha='right',
                fontsize=12, weight='bold', color='#FFFFFF' if model != ORDER[-1] else '#333333')
        ax.set_ylim(2.6, -.6)
        ax.set_yticks([])
        ax.spines['left'].set_visible(False)
        ax.set_xlim(0, .82 if money else 6.5)
        ax.set_xticks([0, .4, .8] if money else [0, 3, 6])
        ax.tick_params(labelsize=11)

    retrieval = data['models'][ORDER[0]]['retrieval_supplement']
    labels = [tr(label) for label in ['Returned precision', 'Precision@20', 'Recall@20', 'nDCG@10', 'Hit@5', 'MRR@20']]
    for idx, (cohort, label) in enumerate((('category', 'Category'),
            ('known_place', 'Exact place'), ('guide_section', 'Guide section'))):
        x = .055 + idx * .32
        title(x, .385, f'{chr(68 + idx)}  {tr("Shared retrieval")} · {tr(label)}')
        ax = fig.add_axes([x + .077, .10, .205, .235])
        style(ax, 'x')
        values = [100 * retrieval['by_kind'][cohort]['final'][key] for key, _, _ in METRICS]
        assert all(0 <= x <= 100 for x in values)
        ax.barh(range(6), values, color=[color for _, _, color in METRICS], height=.66, zorder=3)
        for y, value in enumerate(values):
            # Keep labels inside the scale, including scores of exactly 100.
            ax.text(value - 2 if value >= 18 else value + 2, y, f'{value:.1f}',
                ha='right' if value >= 18 else 'left', va='center', fontsize=13, weight='bold',
                color='white' if y < 3 and value >= 18 else '#303030')
        ax.set_yticks(range(6), labels, fontsize=12)
        ax.set_ylim(5.55, -.55)
        ax.set_xlim(0, 100)
        ax.set_xticks([0, 20, 40, 60, 80, 100])
        ax.set_xlabel(tr('Retrieval metric (0–100)'), fontsize=12, labelpad=12)
        ax.spines['left'].set_visible(False)

    provenance = {'source': data['source'], 'input_sha256': data['input_sha256'],
        'family_values': family_values, 'tokens': usage_totals,
        'retrieval_shared_across_all_models': True,
        'grounding_is_citation_presence_not_factual_accuracy': True,
        'cost_is_known_usage_estimate': True, 'not_measured': data['not_measured'],
        'language': language}
    output = HERE / ('benchmark_overview_vi.png' if language == 'vi' else 'benchmark_overview.png')
    fig.savefig(output, dpi=160, facecolor='white', metadata={
        'Title': tr('VISTRA  |  Three-Model Benchmark'),
        'Description': json.dumps(provenance, allow_nan=False)})
    plt.close(fig)
    print(f'Saved {output} (3840 x 2160; 16:9).')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lang', choices=('en', 'vi'), default='en')
    main(parser.parse_args().lang)

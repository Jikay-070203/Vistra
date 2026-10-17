"""Paired SDK latency/usage points; no model calls, resampling or billing guesses."""

from collections import Counter, defaultdict
from hashlib import sha256
import json
from math import isfinite
from statistics import fmean
import sys


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def records(path):
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]


def signature(event):
    usage = event['usage']
    details = usage.get('input_tokens_details') or {}
    return (event['requested_model'], event.get('served_model'), usage['input_tokens'],
        usage['output_tokens'], details.get('cached_tokens', usage.get('cached_input_tokens')))


def collect_latency_cost(data, root):
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))
    from benchmarks.costs import PRICING_PATH, estimate
    rate_hash = sha256(PRICING_PATH.read_bytes()).hexdigest()
    data['input_sha256'][PRICING_PATH.relative_to(root).as_posix()] = rate_hash
    output = {'unit': 'one observed OpenAI SDK call with returned usage and a finite latency',
        'selection': 'Min/Max are the fastest/slowest eligible call and its own usage/cost. Mean is the paired arithmetic mean over eligible calls.',
        'tokens': 'Input + output; cached/cache-write subsets and reasoning tokens are not added again.',
        'money': 'Per-call known-usage Standard-rate estimate using the saved rate snapshot and service tier.',
        'interpretation': 'Ranges summarize heterogeneous SDK calls, not model-size scaling or controlled frontend response latency.',
        'models': {}}
    comparison = read(root / data['source'])
    for model, original in data['models'].items():
        if original['pricing_sha256'] != rate_hash:
            raise ValueError('Current rates differ from the saved benchmark cost calculation.')
        path = root / 'benchmarks/runs' / comparison['models'][model]['catalog_path']
        rows = records(path / 'results.jsonl')
        calls = [dict(event, case_id=row['case_id'], track=row['track'], call_index=index)
            for row in rows for index, event in enumerate(row.get('provider_calls', []))]
        eligible = [event for event in calls if event.get('usage') is not None
            and isinstance(event.get('elapsed_seconds'), (int, float))
            and isfinite(event['elapsed_seconds']) and event['elapsed_seconds'] >= 0]
        full = {}
        evidence = read(path / 'evidence_hashes.json') if (path / 'transport-usage').is_dir() else {}
        usage_files = {}
        for file in sorted((path / 'transport-usage').glob('*.jsonl')):
            relative = file.relative_to(path).as_posix()
            digest = sha256(file.read_bytes()).hexdigest()
            if evidence.get(relative) != digest:
                raise ValueError('Full usage evidence checksum mismatch: ' + str(file))
            usage_files[relative] = digest
            for event in records(file):
                identity = event.get('response_id')
                if not identity or (identity in full and full[identity] != event):
                    raise ValueError('Missing or conflicting provider response identity.')
                full[identity] = event
        matched = defaultdict(list)
        for event in full.values():
            matched[signature(event)].append(event)
        if full and Counter(signature(event) for event in eligible) != Counter(signature(event) for event in full.values()):
            raise ValueError('Full usage and SDK latency records cannot be matched exactly.')
        paired = []
        for event in eligible:
            if event['requested_model'] != model:
                raise ValueError('Wrong requested model in saved SDK event.')
            candidates = matched[signature(event)] if full else [event]
            estimates = [estimate(model, candidate['usage'], service_tier=candidate.get('service_tier'))
                for candidate in candidates]
            prices = {value['estimated_usd'] for value in estimates}
            if None in prices or len(prices) != 1:
                raise ValueError('Per-call billing is unavailable or ambiguous for this usage signature.')
            usage = event['usage']
            paired.append({'latency_seconds': event['elapsed_seconds'],
                'total_tokens': usage['input_tokens'] + usage['output_tokens'],
                'estimated_usd': prices.pop(), 'case_id': event['case_id'], 'track': event['track'],
                'call_index': event['call_index'], 'input_tokens': usage['input_tokens'],
                'output_tokens': usage['output_tokens'], 'cached_input_tokens': usage.get('cached_input_tokens'),
                'matching_response_ids': sorted(c['response_id'] for c in candidates if c.get('response_id'))})
        if not paired:
            raise ValueError('No usable paired observations for ' + model)
        if abs(sum(row['estimated_usd'] for row in paired) - original['known_usage_cost_usd']) > 1e-10:
            raise ValueError('Per-call costs disagree with the saved catalog subtotal.')
        first = min(paired, key=lambda row: row['latency_seconds'])
        last = max(paired, key=lambda row: row['latency_seconds'])
        average = {key: fmean(row[key] for row in paired)
            for key in ('latency_seconds', 'total_tokens', 'estimated_usd')}
        average['observation_count'] = len(paired)
        output['models'][model] = {'observed_calls': len(calls), 'eligible_calls': len(paired),
            'excluded_calls_without_usage_or_latency': len(calls) - len(paired),
            'unobserved_interrupted_case_ids': original['cost_interrupted_cases'],
            'usage_matching': 'Exact model/served-model/input/output/cached signature; duplicate signatures require identical prices'
                if full else 'Original SDK usage; no full transport audit exists for this legacy run',
            'full_usage_files': usage_files,
            'full_usage_file_count': len(usage_files), 'mean_point_is_an_average_not_a_single_call': True,
            'points': {'Min': first, 'Mean': average, 'Max': last}}
    return output


def render_latency_cost(data, root, here, plt, Line2D, order, colors):
    from matplotlib.patches import Patch
    from matplotlib.ticker import FuncFormatter
    stats = collect_latency_cost(data, root)
    data['latency_cost'] = stats
    comparison = read(root / data['source'])
    token_totals = {model: sum(comparison['models'][model]['summary']['provider_usage'][key]
        for key in ('input_tokens', 'output_tokens')) for model in order}
    stats['presentation'] = {'layout': 'one row, two columns',
        'left': 'Minimum, arithmetic mean and maximum eligible SDK-call latency, in seconds',
        'right_money': 'Whole-catalog known-usage Standard-rate cost estimate in USD',
        'right_tokens': 'Whole-catalog reported input + output tokens, displayed in millions',
        'reported_catalog_total_tokens': token_totals,
        'no_cross_axis_pairing': True}
    for filename, title, money in (
        ('latency_money', 'VISTRA Benchmark — Latency and API Cost', True),
        ('latency_tokens', 'VISTRA Benchmark — Latency and Token Usage', False),
    ):
        fig, (left, right) = plt.subplots(1, 2, figsize=(14.8, 7.2), facecolor='white')
        fig.subplots_adjust(left=.105, right=.97, bottom=.22, top=.76, wspace=.46)
        fig.suptitle(title, y=.955, fontsize=23, weight='bold', color='#252525')
        fig.legend(handles=[Patch(facecolor=colors[m], label=data['models'][m]['display_name']) for m in order],
            loc='upper center', bbox_to_anchor=(.54, .90), ncol=3, frameon=False,
            fontsize=11, handlelength=1.25, columnspacing=2.4)
        for ax in (left, right):
            ax.set_axisbelow(True)
            ax.grid(axis='x', color='#E6E6E6', linewidth=.8)
            for side in ('top', 'right', 'left'):
                ax.spines[side].set_visible(False)
            ax.spines['bottom'].set_color('#D0D0D0')
            ax.tick_params(axis='both', length=0, pad=9, labelsize=11, colors='#505050')
            ax.set_yticks(range(3), [data['models'][m]['display_name'] for m in order], fontsize=11.5)
            ax.set_ylim(2.65, -.65)
        left.set_title('A  SDK call latency', loc='left', fontsize=14, weight='bold', color='#252525', pad=24)
        right.set_title('B  Observed API cost' if money else 'B  Recorded token usage',
            loc='left', fontsize=14, weight='bold', color='#252525', pad=24)
        for y, model in enumerate(order):
            points = stats['models'][model]['points']
            low, average, high = [points[name]['latency_seconds'] for name in ('Min', 'Mean', 'Max')]
            color = colors[model]
            label_color = color if model != order[-1] else '#777777'
            left.plot([low, high], [y, y], color=color, alpha=.5, linewidth=3, zorder=2)
            left.scatter([low], [y], facecolor='white', edgecolor=color, marker='o', s=53, linewidth=1.8, zorder=3)
            left.scatter([average], [y], facecolor=color, edgecolor='white', marker='o', s=90, linewidth=.7, zorder=4)
            left.scatter([high], [y], facecolor='white', edgecolor=color, marker='D', s=62, linewidth=1.8, zorder=3)
            for name, x, offset in (('Min', low, -21), ('Mean', average, 16), ('Max', high, 16)):
                left.annotate(f'{x:.1f}', (x, y), xytext=(0, offset), textcoords='offset points',
                    ha='center', va='center', fontsize=11.5, color=label_color, weight='bold')
            value = data['models'][model]['known_usage_cost_usd'] if money else token_totals[model] / 1_000_000
            right.barh(y, value, height=.43, color=color, zorder=3)
            label = f'${value:.3f}' if money else f'{value:.2f}M'
            right.text(value - (.025 if money else .17), y, label, ha='right', va='center',
                color='white' if model != order[-1] else '#414141', weight='bold', fontsize=12)
        left.set_xlim(0, 55)
        left.set_xticks([0, 10, 20, 30, 40, 50])
        left.set_xlabel('Seconds per SDK call', fontsize=11.5, color='#414141', labelpad=13)
        left.legend(handles=[
            Line2D([], [], marker='o', markerfacecolor='white', color='#777777', linestyle='none', label='Min'),
            Line2D([], [], marker='o', color='#777777', linestyle='none', label='Mean'),
            Line2D([], [], marker='D', markerfacecolor='white', color='#777777', linestyle='none', label='Max')],
            loc='upper center', bbox_to_anchor=(.5, -.22), ncol=3, frameon=False, fontsize=10,
            handletextpad=.35, columnspacing=1.3)
        if money:
            right.set_xlim(0, .82)
            right.set_xticks([0, .2, .4, .6, .8])
            right.xaxis.set_major_formatter(FuncFormatter(lambda value, _: f'${value:.1f}'))
        else:
            right.set_xlim(0, 6.5)
            right.set_xticks([0, 2, 4, 6])
            right.xaxis.set_major_formatter(FuncFormatter(lambda value, _: f'{value:.0f}M'))
        right.set_xlabel('Known-usage USD per catalog run' if money else 'Input + output tokens per catalog run',
            fontsize=11.5, color='#414141', labelpad=13)
        fig.savefig(here / (filename + '.png'), dpi=190)
        fig.savefig(here / (filename + '.svg'))
        plt.close(fig)

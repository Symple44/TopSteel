#!/usr/bin/env python3
import os
import re
import json
from collections import defaultdict, Counter
from pathlib import Path

# Patterns to search for
PATTERNS = [
    (r': any\b', 'type_annotation'),
    (r'as any\b', 'type_assertion'),
    (r'<any>', 'generic_assertion'),
    (r'any\[\]', 'array_of_any'),
    (r'Record<[^,]+,\s*any>', 'record_with_any'),
    (r'Promise<any>', 'promise_any'),
    (r'Observable<any>', 'observable_any'),
    (r'\bany\s*\|', 'union_with_any'),
    (r'\|\s*any\b', 'union_with_any'),
]

def analyze_any_usage(root_dir):
    results = {
        'total_files_analyzed': 0,
        'files_with_any': 0,
        'total_occurrences': 0,
        'patterns': defaultdict(int),
        'modules': defaultdict(lambda: {
            'files': 0,
            'occurrences': 0,
            'patterns': defaultdict(int)
        }),
        'top_files': [],
        'file_details': {}
    }

    # Find all TypeScript files
    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and dist directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', '.git']]

        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, root_dir)

                results['total_files_analyzed'] += 1

                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()

                    file_occurrences = 0
                    file_patterns = defaultdict(int)

                    # Check each pattern
                    for pattern, pattern_name in PATTERNS:
                        matches = re.findall(pattern, content, re.MULTILINE)
                        count = len(matches)
                        if count > 0:
                            file_occurrences += count
                            file_patterns[pattern_name] += count
                            results['patterns'][pattern_name] += count

                    if file_occurrences > 0:
                        results['files_with_any'] += 1
                        results['total_occurrences'] += file_occurrences

                        # Determine module
                        module = 'unknown'
                        if 'apps/api/' in relative_path:
                            module = 'apps/api'
                        elif 'apps/web/' in relative_path:
                            module = 'apps/web'
                        elif 'apps/marketplace-api/' in relative_path:
                            module = 'apps/marketplace-api'
                        elif 'apps/marketplace-storefront/' in relative_path:
                            module = 'apps/marketplace-storefront'
                        elif 'packages/' in relative_path:
                            # More specific package analysis
                            package_match = re.match(r'packages/([^/]+)', relative_path)
                            if package_match:
                                module = f'packages/{package_match.group(1)}'
                            else:
                                module = 'packages'

                        results['modules'][module]['files'] += 1
                        results['modules'][module]['occurrences'] += file_occurrences

                        for pattern_name, count in file_patterns.items():
                            results['modules'][module]['patterns'][pattern_name] += count

                        results['file_details'][relative_path] = {
                            'occurrences': file_occurrences,
                            'patterns': dict(file_patterns),
                            'module': module
                        }

                        results['top_files'].append({
                            'path': relative_path,
                            'occurrences': file_occurrences,
                            'patterns': dict(file_patterns),
                            'module': module
                        })

                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

    # Sort top files by occurrence count
    results['top_files'].sort(key=lambda x: x['occurrences'], reverse=True)
    results['top_files'] = results['top_files'][:20]  # Top 20 files

    return results

def generate_report(results):
    report = []

    report.append("=" * 80)
    report.append("ANALYSE EXHAUSTIVE DES USAGES DE 'ANY' - PROJET TOPSTEEL")
    report.append("=" * 80)
    report.append("")

    # Summary
    report.append("RESUME GLOBAL")
    report.append("-" * 50)
    report.append(f"Fichiers analyses: {results['total_files_analyzed']}")
    report.append(f"Fichiers avec 'any': {results['files_with_any']}")
    report.append(f"Total occurrences: {results['total_occurrences']}")
    percentage = (results['files_with_any'] / results['total_files_analyzed']) * 100
    report.append(f"Pourcentage de fichiers affectes: {percentage:.1f}%")
    report.append("")

    # Patterns analysis
    report.append("REPARTITION PAR TYPE DE PATTERN")
    report.append("-" * 50)
    for pattern, count in sorted(results['patterns'].items(), key=lambda x: x[1], reverse=True):
        percentage = (count / results['total_occurrences']) * 100
        report.append(f"{pattern:20} | {count:3d} occurrences ({percentage:5.1f}%)")
    report.append("")

    # Module analysis
    report.append("REPARTITION PAR MODULE")
    report.append("-" * 50)
    for module, data in sorted(results['modules'].items(), key=lambda x: x[1]['occurrences'], reverse=True):
        percentage = (data['occurrences'] / results['total_occurrences']) * 100
        report.append(f"{module:30} | {data['files']:3d} fichiers | {data['occurrences']:3d} occurrences ({percentage:5.1f}%)")
    report.append("")

    # Top files
    report.append("TOP 10 FICHIERS LES PLUS AFFECTES")
    report.append("-" * 50)
    for i, file_info in enumerate(results['top_files'][:10], 1):
        report.append(f"{i:2d}. {file_info['path']}")
        report.append(f"    Module: {file_info['module']} | Occurrences: {file_info['occurrences']}")
        patterns_str = ', '.join([f"{k}:{v}" for k, v in file_info['patterns'].items()])
        report.append(f"    Patterns: {patterns_str}")
        report.append("")

    # Detailed module analysis
    report.append("ANALYSE DETAILLEE PAR MODULE")
    report.append("-" * 50)
    for module, data in sorted(results['modules'].items(), key=lambda x: x[1]['occurrences'], reverse=True):
        if data['occurrences'] > 0:
            report.append(f"\n{module.upper()}")
            report.append(f"  Fichiers affectés: {data['files']}")
            report.append(f"  Total occurrences: {data['occurrences']}")
            report.append("  Patterns:")
            for pattern, count in sorted(data['patterns'].items(), key=lambda x: x[1], reverse=True):
                report.append(f"    - {pattern}: {count}")

    return "\n".join(report)

def main():
    root_dir = r"D:\GitHub\TopSteel"
    print("Analyse des usages de 'any' en cours...")

    results = analyze_any_usage(root_dir)
    report = generate_report(results)

    # Save results
    with open(os.path.join(root_dir, 'any_usage_analysis.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    with open(os.path.join(root_dir, 'any_usage_report.txt'), 'w', encoding='utf-8') as f:
        f.write(report)

    print(report)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
TypeScript Error Analysis Script
Analyzes TypeScript compiler output and provides detailed statistics
"""

import re
from collections import defaultdict, Counter
import sys

def parse_typescript_errors(file_path):
    """Parse TypeScript errors from file and extract structured data"""
    errors = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match TypeScript error lines (with line numbers from cat -n)
    error_pattern = r'^\s*\d+→(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$'
    
    for line in content.split('\n'):
        match = re.match(error_pattern, line)
        if match:
            file_path, line_num, col_num, error_code, message = match.groups()
            errors.append({
                'file': file_path.strip(),
                'line': int(line_num),
                'column': int(col_num),
                'code': error_code,
                'message': message.strip()
            })
    
    return errors

def analyze_errors(errors):
    """Analyze errors and generate statistics"""
    
    # Count by error type
    error_types = Counter(error['code'] for error in errors)
    
    # Count by file
    file_counts = Counter(error['file'] for error in errors)
    
    # Group by error patterns
    message_patterns = defaultdict(list)
    for error in errors:
        # Extract key patterns from messages
        msg = error['message']
        if 'does not exist on type' in msg:
            pattern = 'Property does not exist on type'
        elif 'No overload matches this call' in msg:
            pattern = 'No overload matches this call'
        elif 'Cannot find module' in msg:
            pattern = 'Cannot find module'
        elif 'is declared but its value is never read' in msg:
            pattern = 'Variable declared but never read'
        elif 'does not satisfy the constraint' in msg:
            pattern = 'Type constraint violation'
        elif 'has no exported member' in msg:
            pattern = 'Module has no exported member'
        elif 'is not assignable to' in msg:
            pattern = 'Type not assignable'
        elif 'File' in msg and 'is not listed within the file list' in msg:
            pattern = 'File not in project file list'
        else:
            pattern = 'Other'
        
        message_patterns[pattern].append(error)
    
    return {
        'total_errors': len(errors),
        'error_types': error_types,
        'file_counts': file_counts,
        'message_patterns': message_patterns
    }

def print_analysis(analysis):
    """Print formatted analysis results"""
    print("=== TypeScript Error Analysis ===")
    print(f"Total Errors: {analysis['total_errors']}")
    print()
    
    print("=== Error Types (by TS code) ===")
    for code, count in analysis['error_types'].most_common(10):
        print(f"{code}: {count} errors")
    print()
    
    print("=== Top 10 Files with Most Errors ===")
    for file_path, count in analysis['file_counts'].most_common(10):
        print(f"{count:3d} errors: {file_path}")
    print()
    
    print("=== Error Patterns ===")
    for pattern, errors in sorted(analysis['message_patterns'].items(), 
                                 key=lambda x: len(x[1]), reverse=True):
        print(f"{pattern}: {len(errors)} errors")
        if len(errors) <= 5:
            for error in errors[:3]:
                print(f"  - {error['file']}:{error['line']} - {error['message'][:80]}...")
        print()

if __name__ == "__main__":
    errors = parse_typescript_errors('typescript-errors.txt')
    analysis = analyze_errors(errors)
    print_analysis(analysis)
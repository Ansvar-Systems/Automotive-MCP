#!/usr/bin/env python3
"""
Direct database inspection script
Queries the automotive.db database to verify contents
"""

import sqlite3
import json
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent / 'data' / 'automotive.db'

def print_section(title):
    print('\n' + '=' * 80)
    print(title)
    print('=' * 80)

def main():
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print_section("DATABASE INSPECTION")
    print(f"Database: {DB_PATH}")

    # List all tables
    print_section("TABLES")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]
    for table in tables:
        print(f"  - {table}")

    # Regulations
    print_section("REGULATIONS")
    cursor.execute("SELECT * FROM regulations")
    regs = cursor.fetchall()
    print(f"Count: {len(regs)}")
    for reg in regs:
        print(f"\n  ID: {reg['id']}")
        print(f"  Name: {reg['full_name']}")
        print(f"  Title: {reg['title']}")
        print(f"  Version: {reg['version']}")
        print(f"  Effective Date: {reg['effective_date']}")

    # Regulation Content
    print_section("REGULATION CONTENT")
    cursor.execute("SELECT regulation, COUNT(*) as count FROM regulation_content GROUP BY regulation")
    content_counts = cursor.fetchall()
    for row in content_counts:
        print(f"  {row['regulation']}: {row['count']} items")

    cursor.execute("SELECT * FROM regulation_content LIMIT 5")
    sample_content = cursor.fetchall()
    print("\nSample content (first 5):")
    for item in sample_content:
        print(f"\n  [{item['regulation']}] {item['reference']}")
        print(f"  Title: {item['title']}")
        print(f"  Text: {item['text'][:100]}...")

    # Standards
    print_section("STANDARDS")
    cursor.execute("SELECT * FROM standards")
    stds = cursor.fetchall()
    print(f"Count: {len(stds)}")
    for std in stds:
        print(f"\n  ID: {std['id']}")
        print(f"  Name: {std['full_name']}")
        print(f"  Title: {std['title']}")
        print(f"  Version: {std['version']}")
        print(f"  Note: {std['note']}")

    # Standard Clauses
    print_section("STANDARD CLAUSES")
    cursor.execute("SELECT standard, COUNT(*) as count FROM standard_clauses GROUP BY standard")
    clause_counts = cursor.fetchall()
    for row in clause_counts:
        print(f"  {row['standard']}: {row['count']} clauses")

    cursor.execute("SELECT * FROM standard_clauses LIMIT 5")
    sample_clauses = cursor.fetchall()
    print("\nSample clauses (first 5):")
    for item in sample_clauses:
        print(f"\n  [{item['standard']}] {item['clause_id']}")
        print(f"  Title: {item['title']}")
        print(f"  Guidance: {item['guidance'][:100]}...")
        if item['work_products']:
            print(f"  Work Products: {item['work_products']}")

    # Framework Mappings
    print_section("FRAMEWORK MAPPINGS")
    cursor.execute("SELECT COUNT(*) as count FROM framework_mappings")
    mapping_count = cursor.fetchone()
    print(f"Count: {mapping_count['count']}")

    if mapping_count['count'] > 0:
        cursor.execute("SELECT * FROM framework_mappings LIMIT 10")
        mappings = cursor.fetchall()
        for m in mappings:
            print(f"\n  {m['source_id']} {m['source_ref']} -> {m['target_id']} {m['target_ref']}")
            print(f"  Relationship: {m['relationship']}")
            if m['notes']:
                print(f"  Notes: {m['notes']}")

    # FTS5 Checks
    print_section("FTS5 SEARCH CAPABILITY")

    print("\nTest search: 'cyber attack'")
    cursor.execute("""
        SELECT regulation, reference, title,
               snippet(regulation_content_fts, -1, '**', '**', '...', 32) as snippet
        FROM regulation_content_fts
        WHERE regulation_content_fts MATCH 'cyber attack'
        LIMIT 5
    """)
    results = cursor.fetchall()
    print(f"Results: {len(results)}")
    for r in results:
        print(f"\n  [{r['regulation']}] {r['reference']} - {r['title']}")
        print(f"  Snippet: {r['snippet']}")

    print("\nTest search: 'vulnerability'")
    cursor.execute("""
        SELECT standard, clause_id, title,
               snippet(standard_clauses_fts, -1, '**', '**', '...', 32) as snippet
        FROM standard_clauses_fts
        WHERE standard_clauses_fts MATCH 'vulnerability'
        LIMIT 5
    """)
    results = cursor.fetchall()
    print(f"Results: {len(results)}")
    for r in results:
        print(f"\n  [{r['standard']}] {r['clause_id']} - {r['title']}")
        print(f"  Snippet: {r['snippet']}")

    print_section("INSPECTION COMPLETE")

    conn.close()

if __name__ == '__main__':
    main()

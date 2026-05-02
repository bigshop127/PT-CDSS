import json
import os

pipeline_path = r'C:\CC AI Agent\scripts\puhui_pipeline.js'
urls_path = r'C:\CC AI Agent\data\puhui_urls_paginated.json'

if not os.path.exists(urls_path):
    print(f"Error: {urls_path} not found")
    exit(1)

with open(urls_path, 'r', encoding='utf-8') as f:
    urls_data = json.load(f)

articles = []
for item in urls_data:
    pubDate = item.get('date', '2025-01-01')
    articles.append({
        'id': item['id'],
        'title': item['title'] or 'No Title',
        'pubDate': pubDate
    })

if not os.path.exists(pipeline_path):
    print(f"Error: {pipeline_path} not found")
    exit(1)

with open(pipeline_path, 'r', encoding='utf-8') as f:
    content = f.read()

# More robust replacement using regex to find the whole array
import re
pattern = r'const ARTICLES = \[[\s\S]*?\];'
replacement = 'const ARTICLES = ' + json.dumps(articles, indent=2, ensure_ascii=False) + ';'

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open(pipeline_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Successfully updated {pipeline_path} with {len(articles)} articles.')
else:
    print('Error: Could not find ARTICLES array using regex.')

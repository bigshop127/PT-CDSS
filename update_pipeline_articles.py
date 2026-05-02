import sys
import os
import json

pipeline_path = r'C:\CC AI Agent\scripts\puhui_pipeline.js'
urls_path = r'C:\CC AI Agent\data\puhui_urls_paginated.json'

with open(urls_path, 'r', encoding='utf-8') as f:
    urls_data = json.load(f)

# Convert pagination format to pipeline format
# Pagination: { id, title, date }
# Pipeline needs: { id, title, pubDate }
articles = []
for item in urls_data:
    # Use fallback date if missing
    pubDate = item.get('date', '2025-01-01') 
    # Clean relative dates
    if '' in pubDate: pubDate = '2025-06-01'
    if '撟游' in pubDate: pubDate = '2024-06-01'
    
    articles.append({
        'id': item['id'],
        'title': item['title'] or 'No Title',
        'pubDate': pubDate
    })

with open(pipeline_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the hardcoded ARTICLES array
import re
start_marker = 'const ARTICLES = ['
end_marker = '];'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_articles_json = json.dumps(articles, indent=2, ensure_ascii=False)
    new_content = content[:start_idx] + 'const ARTICLES = ' + new_articles_json + content[end_idx+1:]
    
    with open(pipeline_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Updated pipeline with {len(articles)} articles.')
else:
    print('Could not find ARTICLES array in pipeline script.')

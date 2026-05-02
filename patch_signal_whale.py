import sys
import os

file_path = r'C:\財經APP\signal.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace whale_ok placeholder with real logic
whale_logic = """
    # 1. Whale (三大法人/大戶): 3日累計買超 > 0
    whale_net_buy_3d = df["whale_net_buy"].rolling(3).sum()
    whale_ok = whale_net_buy_3d > 0
"""

content = content.replace('    # 1. Whale (三大法人/大戶): 需介接外部分析\n    whale_ok = True', whale_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated signal.py with real whale logic')

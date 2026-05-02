import sys
import os

file_path = r'C:\財經APP\signal.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Margin Logic
# margin_ok is True if margin balance is NOT exploding while price is weak.
# Simple version: 5-day change in margin balance should not be > 20% if price is below MA5.
margin_logic = """
    # 4. Funding (資金費率/融資): 避開散戶套牢 (融資增 & 股價弱)
    margin_change_5d = df["margin_balance"].pct_change(5)
    price_weak = close < df["ma5"]
    # If margin increase > 10% AND price is weak, then margin_ok = False
    margin_ok = ~((margin_change_5d > 0.10) & price_weak)
"""

content = content.replace('    # 4. Funding (資金費率/融資): 暫定 True\n    funding_ok = True', margin_logic)
content = content.replace('& funding_ok &', '& margin_ok &')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated signal.py with real Margin logic')

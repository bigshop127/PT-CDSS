import sys
import re

file_path = r'C:\財經APP\signal.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Modify volume from > 1.5 to >= 1.2
content = content.replace('volume_surge = df["volume"] > 1.5 * df["vol_ma20"]', 'volume_surge = df["volume"] >= 1.2 * df["vol_ma20"]')

# 2. Add bias condition before df["signal"] =
bias_code = '\n    # Bias: 乖離率過大不追 (Close / MA10 - 1 < 0.08)\n    bias_ok = (close / df["ma10"] - 1) < 0.08\n\n'
if 'bias_ok = ' not in content:
    content = content.replace('    df["signal"] = (', bias_code + '    df["signal"] = (')
    content = content.replace('trend & momentum & volume_surge & bp_condition\n', 'trend & momentum & volume_surge & bp_condition & bias_ok\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed signal.py')

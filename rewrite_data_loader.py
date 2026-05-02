
import os

input_path = r'C:\CC AI Agent\data_loader_raw.txt'
output_path = r'C:\財經APP\data_loader.py'

with open(input_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # 修正特定的縮進錯誤
    # 移除原本造成錯誤的過度縮進
    stripped = line.strip()
    if stripped == 'df_adj = df_adj.set_index("date").sort_index()':
        new_lines.append('        df_adj = df_adj.set_index("date").sort_index()\n')
    elif stripped == 'universe["0050"] = df_adj':
        new_lines.append('                universe["0050"] = df_adj\n') # 這行可能是在 if 內，所以縮進多一點
    elif stripped == 'logger.info("0050 fetched and added to universe.")':
        new_lines.append('                logger.info("0050 fetched and added to universe.")\n')
    else:
        new_lines.append(line)

# 全局清理：確保沒有混用的 Tab
final_lines = [l.replace('\t', '    ') for l in new_lines]

with open(output_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Full file rewrite complete.")

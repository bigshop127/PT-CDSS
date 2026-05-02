
import os

path = r'C:\財經APP\data_loader.py'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(path, 'w', encoding='utf-8') as f:
    for line in lines:
        # 去掉這行前面多餘的空格
        if 'df_adj = df_adj.set_index("date").sort_index()' in line:
            f.write('        df_adj = df_adj.set_index("date").sort_index()\n')
        else:
            f.write(line)
print("Fix applied.")

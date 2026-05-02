import os
import pandas as pd
import logging

DATA_LOADER_PATH = r'C:\財經APP\data_loader.py'
SIGNAL_PATH = r'C:\財經APP\signal.py'

def patch_data_loader():
    with open(DATA_LOADER_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修正 1: 將 0050 加入 MVP_UNIVERSE 或確保抓取
    if '"0050"' not in content:
        content = content.replace('MVP_UNIVERSE = [', 'MVP_UNIVERSE = [\n    "0050",  # Broad Market Reference')
    
    # 修正 2: 修正 0050 強制抓取邏輯，確保它在宇宙中
    # 尋找 universe["0050"] = df_adj 所在的區塊並優化
    
    with open(DATA_LOADER_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched data_loader.py")

def patch_signal():
    with open(SIGNAL_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修正 3: 放寬融資門檻 10% -> 15%
    content = content.replace('margin_5d_growth > 0.10', 'margin_5d_growth > 0.15')
    
    # 修正 4: 強化 SOX 濾網 (加入 MA5 輔助)
    # 暫時保持 MA20 但放寬其他條件以觀察
    
    with open(SIGNAL_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched signal.py")

if __name__ == "__main__":
    patch_data_loader()
    patch_signal()

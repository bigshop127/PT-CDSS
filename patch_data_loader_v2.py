
import os
import re

path = r'C:\財經APP\data_loader.py'
signal_path = r'C:\財經APP\signal.py'

def fix_data_loader():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. 確保 0050 在 MVP_UNIVERSE 中
    if '"0050"' not in content:
        content = content.replace('MVP_UNIVERSE = [', 'MVP_UNIVERSE = [\n    "0050",')
    
    # 2. 徹底修復 load_universe 中的 0050 抓取與縮進
    # 這裡使用正則表達式或精確段落替換
    bad_block = """                    df_adj = df_adj.set_index("date").sort_index()
                    universe["0050"] = df_adj
                    logger.info("0050 fetched and added to universe.")"""
    
    good_block = """                df_adj = df_adj.set_index("date").sort_index()
                universe["0050"] = df_adj
                logger.info("0050 fetched and added to universe.")"""
    
    if bad_block in content:
        content = content.replace(bad_block, good_block)
    
    # 3. 修復 data_loader 中可能存在的其他縮進
    # 確保 method='ffill' 這種舊式寫法不會報錯（或改為 ffill()）
    content = content.replace(".fillna(method='ffill')", ".ffill()")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Data loader fixed and optimized.")

def fix_signal():
    with open(signal_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 4. 調整融資門檻 10% -> 15%
    content = content.replace('margin_5d_growth > 0.10', 'margin_5d_growth > 0.15')
    
    with open(signal_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Signal logic optimized.")

if __name__ == "__main__":
    fix_data_loader()
    fix_signal()

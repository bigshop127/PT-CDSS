
import os

path = r'C:\財經APP\data_loader.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 在 import pandas as pd 之後補上 import yfinance as yf
if 'import yfinance as yf' not in content:
    content = content.replace('import pandas as pd', 'import pandas as pd\nimport yfinance as yf')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Import 'yfinance' added. System is now truly ready.")

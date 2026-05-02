import urllib.request
import os

urls = {
    "00-環境建置.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/00-%E7%92%B0%E5%A2%83%E5%BB%BA%E7%BD%AE.md",
    "02-連接-GitHub.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/02-%E9%80%A3%E6%8E%A5-GitHub.md",
    "03-建立第二大腦-Obsidian.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/03-%E5%BB%BA%E7%AB%8B%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%85%A6-Obsidian.md",
    "04-第二大腦設定指南.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/04-%E7%AC%AC%E4%BA%8C%E5%A4%A7%E8%85%A6%E8%A8%AD%E5%AE%9A%E6%8C%87%E5%8D%97.md",
    "04-連接-Supabase-資料庫.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/04-%E9%80%A3%E6%8E%A5-Supabase-%E8%B3%87%E6%96%99%E5%BA%AB.md",
    "04.5-連接-Firebase-資料庫.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/04.5-%E9%80%A3%E6%8E%A5-Firebase-%E8%B3%87%E6%96%99%E5%BA%AB.md",
    "05-安裝本地AI-Ollama.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/05-%E5%AE%89%E8%A3%9D%E6%9C%AC%E5%9C%B0AI-Ollama.md",
    "06-設定Gemini免費API.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/06-%E8%A8%AD%E5%AE%9AGemini%E5%85%8D%E8%B2%BBAPI.md",
    "07-初始化班級工具工作模式.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/07-%E5%88%9D%E5%A7%8B%E5%8C%96%E7%8F%AD%E7%B4%9A%E5%B7%A5%E5%85%B7%E5%B7%A5%E4%BD%9C%E6%A8%A1%E5%BC%8F.md",
    "08-安裝gpt-image-2生圖.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/08-%E5%AE%89%E8%A3%9D%E6%9C%AC%E5%9C%B0AI-Ollama.md", # Placeholder as requested to skip but keep
    "CLAUDE.md": "https://raw.githubusercontent.com/mathruffian-dot/claude-code-lazy-packs/master/CLAUDE.md"
}

output_dir = r"C:\CC AI Agent\notebooklm"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for filename, url in urls.items():
    try:
        print(f"Downloading {filename}...")
        with urllib.request.urlopen(url) as response:
            content = response.read().decode('utf-8')
            with open(os.path.join(output_dir, filename), 'w', encoding='utf-8') as f:
                f.write(content)
        print(f"Saved {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

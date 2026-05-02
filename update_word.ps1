$word = New-Object -ComObject Word.Application
$doc = $word.Documents.Open('C:\Users\bigsh\OneDrive\桌面\書單整理.docx')
$redColor = 255
$section10Title = '10_尚未加入的書籍'

$booksToMove = @{}
# 遺漏書籍資料
$booksToMove['《Cranial Osteopathy for Infants, Children and Adolescents》(Nicette Sergueef)'] = '用途： 【高清解剖與實戰手冊】。這本書雖針對小孩，但其「解剖圖示」與「手法照片」是同類書中品質最高的。它將複雜的頭骨縫隙轉化為極佳的視覺參考，成人臨床同樣極具參考價值。'
$booksToMove['《Wisdom in the Body - The Craniosacral Approach》(Michael Kern)'] = '用途： 【生物動力派 (BCST) 導引】。相對於 Upledger 的力學調整，這本書教妳如何進入「靜觀」的狀態。適合處理高度敏感、慢性疲勞或長期心理壓力累積的個案。'
$booksToMove['《Visceral Manipulation in Osteopathy》(Eric Hebgen)'] = '用途： 【臨床快查精華】。極度推薦！ 這本書將 Barral 艱澀的理論轉化為圖表。它按器官分類（如肝、胃、腎），清楚標示「症狀-解剖-手法」的關聯，是診間最實用的工具。'

# 1. 蒐集所有紅字書籍與現有第10區內容
$parasToDelete = New-Object System.Collections.Generic.List[Object]
$inSection10 = $false

for ($i = 1; $i -le $doc.Paragraphs.Count; $i++) {
    $para = $doc.Paragraphs.Item($i)
    $text = $para.Range.Text.Trim()
    
    if ($text -like "*$section10Title*") { $inSection10 = $true }
    
    # 蒐集紅字書籍 (標題與描述)
    if ($para.Range.Font.Color -eq $redColor -and $text -match '^《.*》') {
        $title = $text
        $desc = ''
        $nextPara = $doc.Paragraphs.Item($i + 1)
        if ($nextPara -ne $null -and $nextPara.Range.Text.Trim() -like '用途*') {
            $desc = $nextPara.Range.Text.Trim()
            $parasToDelete.Add($nextPara)
            $i++
        }
        if (-not $booksToMove.ContainsKey($title)) { $booksToMove[$title] = $desc }
        $parasToDelete.Add($para)
        continue
    }
    
    # 蒐集現有第10區的書籍 (不論顏色，為了重新整理)
    if ($inSection10 -and $text -match '^《.*》') {
        $title = $text
        $desc = ''
        $nextPara = $doc.Paragraphs.Item($i + 1)
        if ($nextPara -ne $null -and $nextPara.Range.Text.Trim() -like '用途*') {
            $desc = $nextPara.Range.Text.Trim()
            $parasToDelete.Add($nextPara)
            $i++
        }
        if (-not $booksToMove.ContainsKey($title)) { $booksToMove[$title] = $desc }
        $parasToDelete.Add($para)
    }
}

# 2. 刪除標記段落
# 反向刪除以避免索引偏移
for ($i = $parasToDelete.Count - 1; $i -ge 0; $i--) {
    $parasToDelete[$i].Range.Delete()
}

# 3. 確保第10區標題存在且獲取其範圍
$foundSection10 = $null
foreach ($para in $doc.Paragraphs) {
    if ($para.Range.Text -like "*$section10Title*") {
        $foundSection10 = $para
        break
    }
}

if ($null -eq $foundSection10) {
    $doc.Paragraphs.Last.Range.InsertAfter("

$section10Title
")
    $foundSection10 = $doc.Paragraphs.Last
}

# 4. 在第10區後插入所有蒐集到的書籍
$insertRange = $foundSection10.Range
$insertRange.Collapse(0) # wdCollapseEnd

foreach ($title in $booksToMove.Keys) {
    $insertRange.InsertAfter("$title
")
    # 設定新插入內容的顏色
    $newParaRange = $doc.Range($insertRange.Start, $insertRange.End)
    $newParaRange.Font.Color = $redColor
    $insertRange.Collapse(0)
    
    $desc = $booksToMove[$title]
    if ($desc -ne '') {
        $insertRange.InsertAfter("$desc
")
        $newDescRange = $doc.Range($insertRange.Start, $insertRange.End)
        $newDescRange.Font.Color = $redColor
        $insertRange.Collapse(0)
    }
}

$doc.Save()
$doc.Close()
$word.Quit()

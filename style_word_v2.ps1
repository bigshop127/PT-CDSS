$word = New-Object -ComObject Word.Application
$doc = $word.Documents.Open('C:\Users\bigsh\OneDrive\桌面\書單整理.docx')
$redColor = 255
$blackColor = 0
$section10Title = '10_尚未加入的書籍'
$inSection10 = $false

foreach ($para in $doc.Paragraphs) {
    $text = $para.Range.Text.Trim()
    if ($text -like "*$section10Title*") { 
        $inSection10 = $true 
        $para.Range.Font.Color = $blackColor
        continue
    }
    if ($inSection10 -and $text.Length -gt 0) {
        if ($text -match '^《.*》') {
            $para.Range.Font.Color = $redColor
        } else {
            $para.Range.Font.Color = $blackColor
        }
    }
}
$doc.Save()
$doc.Close()
$word.Quit()

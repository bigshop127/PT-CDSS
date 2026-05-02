 = New-Object -ComObject Word.Application
 = .Documents.Open('C:\Users\bigsh\OneDrive\桌面\書單整理.docx')
 = 255
 = 0 # Automatic/Black
 = '10_尚未加入的書籍'

 = False

foreach ( in .Paragraphs) {
     = .Range.Text.Trim()
    
    if ( -like "**") { 
         = True 
        .Range.Font.Color =  # 章節標題設為黑色
        continue
    }
    
    if ( -and .Length -gt 0) {
        if ( -match '^《.*》') {
            # 書籍標題保留紅字
            .Range.Font.Color = 
        } else {
            # 其他描述內容改為黑字
            .Range.Font.Color = 
        }
    }
}

.Save()
.Close()
.Quit()

$url = "https://psiog0-my.sharepoint.com/personal/abinayasundari_paramasivam_psiog_com/Documents/Effort%20Tracker%20-%20Simplicity.xlsx"
Write-Host "Opening SharePoint URL via Excel COM: $url"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Open($url)
    Write-Host "Workbook opened successfully!"
    Write-Host "Sheets count: $($wb.Sheets.Count)"
    $sheet = $wb.Sheets.Item("2.14.10.1")
    Write-Host "Active sheet '2.14.10.1' used rows: $($sheet.UsedRange.Rows.Count)"
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "SUCCESS"
} catch {
    Write-Error "Error: $_"
    if ($excel) {
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
}

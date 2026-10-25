param(
    [string]$JsonFile,
    [string]$TargetSheet = "2.14.10.1",
    [string]$SharePointUrl = "https://psiog0-my.sharepoint.com/personal/abinayasundari_paramasivam_psiog_com/Documents/Effort%20Tracker%20-%20Simplicity.xlsx"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $JsonFile)) {
    Write-Error "JSON file not found: $JsonFile"
    exit 1
}

$rawJson = Get-Content -Path $JsonFile -Raw -Encoding UTF8
$entries = $rawJson | ConvertFrom-Json

Write-Host "Opening SharePoint Excel via COM: $SharePointUrl"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Open($SharePointUrl)
    
    $sheet = $null
    try {
        $sheet = $wb.Sheets.Item($TargetSheet)
    } catch {
        Write-Host "Sheet $TargetSheet does not exist, creating new sprint sheet..."
        $sheet = $wb.Sheets.Add([System.Type]::Missing, $wb.Sheets.Item($wb.Sheets.Count))
        $sheet.Name = $TargetSheet
        
        $sheet.Cells.Item(1, 1).Value2 = "Date"
        $sheet.Cells.Item(1, 2).Value2 = "Name"
        $sheet.Cells.Item(1, 3).Value2 = "Ticket"
        $sheet.Cells.Item(1, 4).Value2 = "Category"
        $sheet.Cells.Item(1, 5).Value2 = "Time (in hrs)"
        $sheet.Cells.Item(1, 6).Value2 = "Description"
        
        $headerRange = $sheet.Range("A1:F1")
        $headerRange.Font.Bold = $true
        $headerRange.Font.Name = "Calibri"
        $headerRange.Font.Size = 12
        $headerRange.Font.Color = 0xFFFFFF
        $headerRange.Interior.Color = 0xC47244 # BGR for #4472C4
        
        for ($c = 1; $c -le 5; $c++) {
            $sheet.Columns.Item($c).ColumnWidth = 14
        }
        $sheet.Columns.Item(6).ColumnWidth = 76
    }
    
    # Find next empty row in Column A
    $r = 1
    while (-not [string]::IsNullOrWhiteSpace($sheet.Cells.Item($r, 1).Text)) {
        $r++
    }
    Write-Host ("Appending starting at row: " + $r)

    foreach ($entry in $entries) {
        # Format date as MM/dd/yyyy if possible
        $d = $entry.date
        if ($d -match '^\d{4}-\d{2}-\d{2}$') {
            $parts = $d.Split('-')
            $d = "$($parts[1])/$($parts[2])/$($parts[0])"
        }
        $sheet.Cells.Item($r, 1).NumberFormat = "m/d/yyyy"
        $sheet.Cells.Item($r, 1).Value2 = $d
        $sheet.Cells.Item($r, 2).Value2 = [string]$entry.name
        $sheet.Cells.Item($r, 3).Value2 = [string]$entry.ticket
        $sheet.Cells.Item($r, 4).Value2 = [string]$entry.category
        $sheet.Cells.Item($r, 5).Value2 = [double]$entry.timeInHrs
        $sheet.Cells.Item($r, 6).Value2 = [string]$entry.description
        $r++
    }

    Write-Host "Saving workbook to SharePoint Online..."
    $wb.Save()
    Write-Host "Workbook saved successfully to SharePoint!"

    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "SYNC_SUCCESS"
} catch {
    Write-Error ("COM Sync Failed: " + $_.Exception.Message)
    if ($excel) {
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
    exit 1
}

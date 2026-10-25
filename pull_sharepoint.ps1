param(
    [string]$SharePointUrl = "https://psiog0-my.sharepoint.com/personal/abinayasundari_paramasivam_psiog_com/Documents/Effort%20Tracker%20-%20Simplicity.xlsx",
    [string]$DestinationPath = "c:\Users\aravindhan.chandrase\Desktop\important notes\Spring Boot\Project\EodUpdater\Effort Tracker - Simplicity.xlsx"
)

$ErrorActionPreference = "Stop"
Write-Host "Syncing live workbook from SharePoint: $SharePointUrl"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Open($SharePointUrl)
    Write-Host "Workbook opened successfully from SharePoint."
    
    # Save a temporary copy first to avoid partial writes
    $tempPath = [System.IO.Path]::GetTempFileName() + ".xlsx"
    $wb.SaveCopyAs($tempPath)
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    $excel = $null

    # Replace destination file
    Copy-Item -Path $tempPath -Destination $DestinationPath -Force
    Remove-Item -Path $tempPath -Force
    Write-Host "LIVE_SHAREPOINT_PULL_SUCCESS"
} catch {
    Write-Error "Pull failed: $_"
    if ($excel) {
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
    exit 1
}

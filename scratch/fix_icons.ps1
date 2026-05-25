
$resPath = 'android/app/src/main/res'
$sourceIcon = 'resources/icon.png'

Get-ChildItem -Path $resPath -Filter 'ic_launcher*.png' -Recurse | ForEach-Object {
    Copy-Item $sourceIcon $_.FullName -Force
    Write-Host "Updated: $($_.FullName)"
}

param(
  [Parameter(Mandatory = $true)]
  [string]$Email,

  [string]$Note = "wechat-manual",

  [string]$ApiBase = "https://pixel-color-picker-pro.huangzero2004.workers.dev"
)

$adminKey = Read-Host "Enter ADMIN_KEY"

$body = @{
  email = $Email
  note = $Note
  adminKey = $adminKey
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "$ApiBase/api/license/manual" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

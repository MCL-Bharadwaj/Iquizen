# Script to get your Static Web App deployment token
# Run this to get the correct token for GitHub secrets

Write-Host "🔍 Finding your Static Web Apps..." -ForegroundColor Cyan
Write-Host ""

# List all Static Web Apps
$swaList = az staticwebapp list --query "[].{Name:name, ResourceGroup:resourceGroup, DefaultHostname:defaultHostname}" -o json | ConvertFrom-Json

if ($swaList.Count -eq 0) {
    Write-Host "❌ No Static Web Apps found in your subscription!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to create one first. Run:" -ForegroundColor Yellow
    Write-Host "az staticwebapp create --name swa-quizapp-prod --resource-group rg-quizapp-prod --location eastus --sku Free" -ForegroundColor White
    exit
}

Write-Host "Found $($swaList.Count) Static Web App(s):" -ForegroundColor Green
Write-Host ""

foreach ($swa in $swaList) {
    Write-Host "📦 Name: $($swa.Name)" -ForegroundColor Yellow
    Write-Host "   Resource Group: $($swa.ResourceGroup)"
    Write-Host "   URL: https://$($swa.DefaultHostname)"
    Write-Host ""
}

# If only one SWA, get its token automatically
if ($swaList.Count -eq 1) {
    $swa = $swaList[0]
    Write-Host "🔑 Getting deployment token for: $($swa.Name)..." -ForegroundColor Cyan
    Write-Host ""
    
    $token = az staticwebapp secrets list --name $swa.Name --resource-group $swa.ResourceGroup --query "properties.apiKey" -o tsv
    
    if ($token) {
        Write-Host "✅ SUCCESS! Copy this token to GitHub:" -ForegroundColor Green
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
        Write-Host $token -ForegroundColor White
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Token has been copied to clipboard!" -ForegroundColor Green
        $token | Set-Clipboard
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://github.com/MCL-Bharadwaj/Quizz-MCL/settings/secrets/actions" -ForegroundColor White
        Write-Host "2. Find: AZURE_STATIC_WEB_APPS_API_TOKEN_BLACK_BUSH_0D3FB621E" -ForegroundColor White
        Write-Host "3. Click 'Update' and paste the token (Ctrl+V)" -ForegroundColor White
        Write-Host "4. Click 'Update secret'" -ForegroundColor White
        Write-Host ""
        Write-Host "Your app URL: https://$($swa.DefaultHostname)" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to get token. Make sure you're logged in to Azure CLI" -ForegroundColor Red
    }
} else {
    # Multiple SWAs, let user choose
    Write-Host "Which Static Web App do you want to deploy to?" -ForegroundColor Yellow
    for ($i = 0; $i -lt $swaList.Count; $i++) {
        Write-Host "  [$($i + 1)] $($swaList[$i].Name) - https://$($swaList[$i].DefaultHostname)"
    }
    Write-Host ""
    $choice = Read-Host "Enter number (1-$($swaList.Count))"
    $selectedSwa = $swaList[[int]$choice - 1]
    
    Write-Host ""
    Write-Host "🔑 Getting deployment token for: $($selectedSwa.Name)..." -ForegroundColor Cyan
    
    $token = az staticwebapp secrets list --name $selectedSwa.Name --resource-group $selectedSwa.ResourceGroup --query "properties.apiKey" -o tsv
    
    if ($token) {
        Write-Host ""
        Write-Host "✅ SUCCESS! Copy this token to GitHub:" -ForegroundColor Green
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
        Write-Host $token -ForegroundColor White
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Token has been copied to clipboard!" -ForegroundColor Green
        $token | Set-Clipboard
    }
}

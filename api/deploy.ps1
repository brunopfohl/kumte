# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Green
docker compose build

# Create a deployment directory
Write-Host "Creating deployment package..." -ForegroundColor Green
New-Item -Path "deploy" -ItemType Directory -Force
Copy-Item ".env" -Destination "deploy\" -Force
Copy-Item "Dockerfile" -Destination "deploy\" -Force
Copy-Item "docker-compose.yml" -Destination "deploy\" -Force

# Create a ZIP archive for easy transfer
Write-Host "Creating deployment archive..." -ForegroundColor Green
Compress-Archive -Path "deploy" -DestinationPath "kumte-api-deploy.zip" -Force

Write-Host "Deployment package created: kumte-api-deploy.zip" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy:" -ForegroundColor Cyan
Write-Host "1. Transfer kumte-api-deploy.zip to your VPS" -ForegroundColor Cyan
Write-Host "2. Extract the ZIP file" -ForegroundColor Cyan
Write-Host "3. Navigate: cd deploy" -ForegroundColor Cyan
Write-Host "4. Start: docker compose up -d" -ForegroundColor Cyan 
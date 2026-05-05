# --- ENVIRONMENT VARIABLES FOR JAVA BACKENDS ---

# Replace these with your actual keys if you want AI to work
$env:GOOGLE_AI_API_KEY = "your-gemini-api-key-here"
$env:ANTHROPIC_API_KEY = "your-anthropic-api-key-here"

# Database & Auth Secrets (Must be the same across services)
$env:MONGODB_URI = "mongodb+srv://swayamgarg08_db_user:Financemanager123@cluster0.grwdeyq.mongodb.net/finsight?appName=Cluster0"
$env:JWT_SECRET = "this-is-a-very-secure-random-secret-key-that-is-32-chars-long"
$env:JWT_REFRESH_SECRET = "another-very-secure-random-secret-key-that-is-32-chars"
$env:MCP_SERVER_URL = "http://localhost:5100"

# --- STARTING SERVICES ---

Write-Host "Starting FinSight API (Port 4000)..."
Start-Process java -ArgumentList "-jar backend\finsight-api\target\finsight-api-1.0.0-SNAPSHOT-exec.jar" -WorkingDirectory "." -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "Starting FinSight MCP Server (Port 5100)..."
Start-Process java -ArgumentList "-jar backend\finsight-mcp\target\finsight-mcp-1.0.0-SNAPSHOT.jar" -WorkingDirectory "." -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "Starting FinSight Agentic AI (Port 5200)..."
Start-Process java -ArgumentList "-jar backend\finsight-agentic\target\finsight-agentic-1.0.0-SNAPSHOT.jar" -WorkingDirectory "." -WindowStyle Normal

Write-Host "Starting Next.js Frontend (Port 3000)..."
Start-Process cmd -ArgumentList "/c npm run dev" -WorkingDirectory "frontend" -WindowStyle Normal

Write-Host "All services started! You can close this window."

$ErrorActionPreference = 'Stop'

$targetPort = 9090

try {
    $connections = Get-NetTCPConnection -LocalPort $targetPort -ErrorAction SilentlyContinue
    if ($connections) {
        $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($processId in $processIds) {
            if ($processId -ne 0) {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Stopping process $($process.ProcessName) (PID: $processId) on port $targetPort..."
                    Stop-Process -Id $processId -Force
                }
            }
        }
    }

    Write-Host "Starting backend on port $targetPort..."
    .\mvnw.cmd spring-boot:run
}
catch {
    Write-Error "Failed to start backend: $($_.Exception.Message)"
    exit 1
}

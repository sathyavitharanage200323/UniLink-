#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const args = process.argv.slice(2)
const command = args[0]

// Cypress (Electron) fails to boot when this is set in the environment.
delete process.env.ELECTRON_RUN_AS_NODE

const projectRoot = path.resolve(__dirname, '..')

// Use project-local app data to avoid locked/permission-broken global Cypress browser profiles.
if (os.platform() === 'win32' && process.env.USE_SYSTEM_CYPRESS_APPDATA !== '1') {
  const isolatedAppData = path.join(projectRoot, '.cypress-appdata')
  fs.mkdirSync(isolatedAppData, { recursive: true })
  process.env.APPDATA = isolatedAppData
}

function safeRm(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true })
    }
  } catch (_) {
    // Ignore cleanup failures; Cypress can still run.
  }
}

function cleanupStaleBrowserProfiles() {
  if (os.platform() !== 'win32') return

  // Best-effort: close stale Cypress processes that may lock profile files.
  try {
    spawnSync('taskkill', ['/IM', 'Cypress.exe', '/F', '/T'], { stdio: 'ignore' })
  } catch (_) {
    // Ignore if no Cypress processes are running.
  }

  // Best-effort: close only Chrome processes launched by Cypress profiles.
  try {
    const psScript = [
      '$ErrorActionPreference = "SilentlyContinue"',
      '$targets = Get-CimInstance Win32_Process | Where-Object {',
      '  $_.Name -eq "chrome.exe" -and $_.CommandLine -like "*Cypress\\cy\\production\\browsers\\chrome-stable*"',
      '} | Select-Object -ExpandProperty ProcessId',
      'foreach ($pid in $targets) { taskkill /PID $pid /T /F | Out-Null }',
    ].join('; ')

    spawnSync('powershell.exe', ['-NoProfile', '-Command', psScript], { stdio: 'ignore' })
  } catch (_) {
    // Ignore if no matching Chrome processes are running.
  }

  const appData = process.env.APPDATA
  if (!appData) return

  const chromeStableDir = path.join(appData, 'Cypress', 'cy', 'production', 'browsers', 'chrome-stable')
  const interactiveDir = path.join(chromeStableDir, 'interactive')

  // Clear the interactive profile that commonly triggers EPERM on Secure Preferences.
  safeRm(interactiveDir)

  // Clear stale run-* profiles left by aborted/failed runs.
  try {
    if (!fs.existsSync(chromeStableDir)) return
    const entries = fs.readdirSync(chromeStableDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('run-')) {
        safeRm(path.join(chromeStableDir, entry.name))
      }
    }
  } catch (_) {
    // Ignore cleanup failures; Cypress can still run.
  }
}

if (command === 'open' || command === 'run') {
  cleanupStaleBrowserProfiles()
}

const cypressPackagePath = require.resolve('cypress/package.json')
const cypressBin = path.join(path.dirname(cypressPackagePath), 'bin', 'cypress')
const child = spawn(process.execPath, [cypressBin, ...args], {
  env: process.env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

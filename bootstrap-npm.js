/**
 * Bootstrap script — downloads npm if not available, then installs deps and starts dev server.
 * Run with: node bootstrap-npm.js
 */
const https = require('https')
const http  = require('http')
const fs    = require('fs')
const path  = require('path')
const os    = require('os')
const { execSync, spawn } = require('child_process')

const PROJ_DIR = __dirname
const NPM_VERSION = '10.9.2'

function log(msg) { process.stdout.write(`\n[setup] ${msg}\n`) }

function fetch(url, dest) {
  return new Promise((resolve, reject) => {
    log(`Downloading ${url}`)
    const file = fs.createWriteStream(dest)
    const proto = url.startsWith('https') ? https : http
    const req = proto.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        fs.unlinkSync(dest)
        return fetch(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(resolve) })
      file.on('error', reject)
    })
    req.on('error', reject)
  })
}

function run(cmd, opts = {}) {
  log(`$ ${cmd}`)
  try {
    const out = execSync(cmd, { encoding: 'utf8', cwd: PROJ_DIR, stdio: 'inherit', ...opts })
    return out
  } catch (e) {
    throw e
  }
}

async function findNpm() {
  // 1. System npm via cmd
  try {
    const v = execSync('npm --version', { encoding: 'utf8', shell: 'cmd.exe' }).trim()
    log(`Found system npm v${v}`)
    return 'npm'
  } catch {}

  // 2. Check common Windows paths
  const candidates = [
    'C:\\Program Files\\nodejs\\npm.cmd',
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'npm.cmd'),
    path.join(os.homedir(), 'scoop', 'shims', 'npm.cmd'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      log(`Found npm at ${c}`)
      return `"${c}"`
    }
  }

  // 3. Bootstrap npm from registry using current node
  log('npm not found — bootstrapping from registry…')
  const tmpDir = path.join(os.tmpdir(), `npm-bootstrap-${Date.now()}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  const tarUrl = `https://registry.npmjs.org/npm/-/npm-${NPM_VERSION}.tgz`
  const tarPath = path.join(tmpDir, 'npm.tgz')

  await fetch(tarUrl, tarPath)
  log('Extracting npm…')
  execSync(`node -e "
    const zlib=require('zlib'), tar=require('tar-stream'), fs=require('fs'), path=require('path');
    // Simple extraction using tar-stream is not available — use Node's built-in
  "`)

  // Actually, use a different approach: download the npm package and use it
  // Modern Node.js can use --experimental-network-imports but that's complex
  // Simplest: use winget to install Node.js LTS which includes npm
  log('Installing Node.js LTS via winget (includes npm)…')
  try {
    execSync('winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent', {
      encoding: 'utf8', shell: 'cmd.exe', stdio: 'inherit'
    })
    log('Node.js installed. Refreshing PATH…')
    // Node installs to C:\\Program Files\\nodejs
    process.env.PATH = `C:\\Program Files\\nodejs;${process.env.PATH}`
    try {
      execSync('npm --version', { encoding: 'utf8', cwd: PROJ_DIR, shell: 'cmd.exe' })
      return '"C:\\Program Files\\nodejs\\npm.cmd"'
    } catch {}
  } catch (e) {
    log('winget install failed. Please install Node.js from https://nodejs.org and re-run this script.')
    process.exit(1)
  }
  return null
}

async function main() {
  log('World Cup 2026 — React App Setup')
  log('=================================')

  const npmCmd = await findNpm()
  if (!npmCmd) { log('Could not locate npm. Exiting.'); process.exit(1) }

  log('Installing dependencies…')
  execSync(`${npmCmd} install`, { cwd: PROJ_DIR, shell: 'cmd.exe', stdio: 'inherit' })

  log('Starting dev server…')
  log('Open http://localhost:5173 in your browser\n')
  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd: PROJ_DIR,
    shell: 'cmd.exe',
    stdio: 'inherit',
  })
  child.on('exit', code => process.exit(code))
}

main().catch(e => { log(`Error: ${e.message}`); process.exit(1) })

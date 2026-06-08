const http  = require('http')
const https = require('https')
const fs    = require('fs')
const path  = require('path')
const url   = require('url')

const distDir = path.join(__dirname, 'dist')
const PORT    = 5174

// ── Load .env (if present) so FOOTBALL_DATA_KEY is available at runtime ──────
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.trim().split('=')
    if (k && !k.startsWith('#')) process.env[k] = rest.join('=').trim()
  })
}
const API_KEY = process.env.VITE_FOOTBALL_DATA_KEY || ''

// ── MIME map ──────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
}

// ── Proxy /api/football/* → https://api.football-data.org/v4/* ───────────────
function proxyFootball(req, res) {
  const parsed  = url.parse(req.url)
  const apiPath = parsed.path.replace(/^\/api\/football/, '')

  const options = {
    hostname: 'api.football-data.org',
    path:     `/v4${apiPath}`,
    method:   req.method,
    headers: {
      'X-Auth-Token': API_KEY || req.headers['x-auth-token'] || '',
      'Accept':       'application/json',
    },
  }

  const proxy = https.request(options, apiRes => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(apiRes.statusCode)
    apiRes.pipe(res)
  })

  proxy.on('error', err => {
    console.error('[proxy error]', err.message)
    res.writeHead(502)
    res.end(JSON.stringify({ error: 'proxy error', message: err.message }))
  })

  req.pipe(proxy)
}

// ── Static file server ────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.writeHead(204)
    res.end()
    return
  }

  // API proxy
  if (req.url.startsWith('/api/football')) {
    return proxyFootball(req, res)
  }

  // Static files
  let urlPath  = req.url.split('?')[0]
  let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath)

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html')
  }

  const ext         = path.extname(filePath).toLowerCase()
  const contentType = MIME[ext] || 'text/plain'

  res.setHeader('Content-Type', contentType)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-cache')

  const stream = fs.createReadStream(filePath)
  stream.on('error', () => { res.writeHead(404); res.end('Not found') })
  stream.pipe(res)
})

server.listen(PORT, '127.0.0.1', () => {
  const keyStatus = API_KEY ? '✓ API key loaded' : '✗ No API key (set VITE_FOOTBALL_DATA_KEY in .env)'
  process.stdout.write(`[serve] http://localhost:${PORT}  |  ${keyStatus}\n`)
})

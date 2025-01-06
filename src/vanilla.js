const fs = require('fs')
const cp = require('child_process')
const debug = process.env.CI ? console.debug : require('debug')('mcpc-server')
const https = require('https')

const JAVA_BIN = process.env.JAVA_BIN || 'java'

function get (url, outPath) {
  const file = fs.createWriteStream(outPath)
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 1000 * 20 }, response => {
      if (response.statusCode !== 200) return reject(new Error('Server returned code ' + response.statusCode))
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    })
  })
}

let manifest
async function getManifest () {
  if (manifest) return manifest
  const r = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')
  manifest = await r.json()
  return manifest
}

async function getVersionManifest (version) {
  const manifest = await getManifest()
  const found = manifest.versions.find(v => v.id === version)
  if (!found) {
    throw Error('Version not found: ' + version)
  }
  return fetch(found.url).then(r => r.json())
}

async function getLatestVersions (max = 20) {
  const manifest = await getManifest()
  return manifest.versions.slice(0, max)
}

let downloadLock = false

// Download + extract vanilla server and enter the directory
async function download (version, root, path) {
  const manifest = await getVersionManifest(version)
  if (downloadLock) {
    throw Error('Already downloading server')
  }
  downloadLock = true
  process.chdir(root)
  const dir = path || 'mc-' + version

  if (fs.existsSync(dir) && fs.readdirSync(dir).length > 1) {
    process.chdir(dir) // Enter server folder
    debug('Already downloaded', version)
    downloadLock = false
    return { version, path: process.cwd() }
  }
  try { fs.mkdirSync(dir) } catch { }

  process.chdir(dir) // Enter server folder
  const url = manifest.downloads.server.url
  console.info('🔻 Downloading', url)
  await get(url, 'server.jar')
  downloadLock = false
  return { version, path: process.cwd() }
}

function eraseServer (version, options) {
  downloadLock = false
  // Remove the server and try again
  const currentDir = process.cwd()
  process.chdir(options.root || '.')
  const path = options.path ? options.path : 'mc-' + version
  debug('Removing server', path)
  fs.rmSync(path, { recursive: true, force: true })
  process.chdir(currentDir)
}

const defaultOptions = {
  'level-generator': '2',
  'server-port': '19130',
  'online-mode': 'false'
}
const internalOptions = ['path', 'root']

// Setup the server
async function configure (options = {}) {
  const opts = { ...defaultOptions, ...options }
  if (!fs.existsSync('./server.properties')) {
    console.log('🔧 Configuring server')
    // delete the eula.txt file if it exists so server doesn't start this run
    fs.rmSync('./eula.txt', { force: true })
    // run the server once to generate the server.properties file and eula.txt
    runSync()
    // accept the eula
    fs.writeFileSync('./eula.txt', 'eula=true')
    console.log('✅ EULA accepted')
  }
  let config = fs.readFileSync('./server.properties', 'utf-8')
  config = config.split('## node options')[0].trim()
  config += '\n## node options'
  config += '\nallow-cheats=true'
  for (const o in opts) {
    if (internalOptions.includes(o)) continue
    config += `\n${o}=${opts[o]}`
  }
  fs.writeFileSync('./server.properties', config)
}

function runSync () {
  const args = ['-Xms512M', '-Xmx1024M', '-jar', 'server.jar']
  console.log(`$ ${JAVA_BIN} ${args.join(' ')}`)
  return cp.spawnSync(JAVA_BIN, args, { stdio: 'inherit' })
}

function run ({ timeout, preArgs = [], postArgs = [] }, inheritStdout = true) {
  const args = [
    '-Xms512M',
    '-Xmx1024M',
    ...preArgs,
    '-jar', 'server.jar',
    ...postArgs
  ]
  console.log(`$ ${JAVA_BIN} ${args.join(' ')}`)
  const p = cp.spawn(JAVA_BIN, args, inheritStdout ? { stdio: 'inherit' } : {})
  if (timeout) {
    setTimeout(() => {
      p.kill('SIGKILL')
    }, timeout)
  }
  return p
}

async function downloadServer (version, options) {
  const currentDir = process.cwd()
  try {
    const ret = await download(version, options.root || '.', options.path)
    return ret
  } finally {
    process.chdir(currentDir)
    downloadLock = false
  }
}

let lastHandle

// Run the server
async function startServer (version, onStart, options = {}) {
  const currentDir = process.cwd()
  // Take the options.path and determine if it's an absolute path or not
  const path = options.path
  const pathRoot = options.root || '.'

  let ver
  try {
    ver = await download(version, pathRoot, path) // and enter the directory
  } finally {
    downloadLock = false
  }
  debug('Configuring server', ver.version)
  configure(options)
  debug('Starting server', ver.version)
  if (options.dumpRegistries) {
    // DbundlerMainClass=net.minecraft.data.Main
    options.preArgs = ['-DbundlerMainClass=net.minecraft.data.Main']
    options.postArgs = ['--all', '--output', options.dumpRegistries]
  }
  const handle = lastHandle = run(options, !onStart)
  handle.on('error', (...a) => {
    console.warn('*** THE MINECRAFT PROCESS CRASHED ***', a)
    handle.kill('SIGKILL')
  })
  if (onStart) {
    let stdout = ''
    function processLine (data) {
      stdout += data
      if (stdout.includes(']: Done')) {
        onStart()
        handle.stdout.off('data', processLine)
      }
    }
    handle.stdout.on('data', processLine)
    handle.stdout.pipe(process.stdout)
    handle.stderr.pipe(process.stdout)
  }
  process.chdir(currentDir)
  return handle
}

// Start the server and wait for it to be ready, with a timeout
function startServerAndWait (version, withTimeout, options) {
  if (isNaN(withTimeout)) throw Error('timeout must be a number')
  let handle
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      handle?.kill()
      reject(new Error(`Server did not start on time (${withTimeout}ms, now ${Date.now()})`))
    }, withTimeout)

    startServer(version, function onReady () {
      clearTimeout(timeout)
      resolve(handle)
    }, options).then((h) => {
      handle = h
    }).catch(reject)
  })
}

// Start the server and wait for it to be ready, with a timeout, and retry once
async function startServerAndWait2 (version, withTimeout, options) {
  const currentDir = process.cwd()
  try {
    return await startServerAndWait(version, withTimeout, options)
  } catch (e) {
    console.log(e)
    console.log('^ Trying once more to start server in 10 seconds...')
    lastHandle?.kill()
    await new Promise(resolve => setTimeout(resolve, 10000))
    process.chdir(currentDir) // We can't call eraseServer being inside the server directory
    await eraseServer(version, options)
    return await startServerAndWait(version, withTimeout, options)
  }
}

module.exports = { getManifest, getLatestVersions, downloadServer, startServer, startServerAndWait, startServerAndWait2 }

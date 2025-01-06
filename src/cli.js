#!/usr/bin/env node
const lib = require('./index')
const { version } = require('../package.json')

const opt = require('basic-args')({
  name: 'mcpc-server',
  description: 'Minecraft Java Edition Server runner',
  version,
  options: {
    version: { type: String, description: 'Version to download (use "latest" for latest)', alias: 'v' },
    port: { type: Number, description: 'Port to listen on for IPv4', default: 25565 },
    online: { type: Boolean, description: 'Whether to run in online mode' },
    path: { type: String, description: 'Custom path to the server directory', default: null },

    versions: { type: Boolean, description: 'Passing --versions will list all versions' },
    dumpRegistries: { type: String, description: 'Run all data generators and output to the passed path', default: '' },
    download: { type: Boolean, description: 'Download (but not run) the server binary' }
  },
  examples: [
    'mcpc-server --version latest      Start a server on the latest version',
    'mcpc-server --versions            List all avaliable versions',
    'mcpc-server -v 1.20 --download    Download v1.20'
  ],
  preprocess (options) {
    if (options.versions) {
      options.version = '*'
    }
  }
})

async function main () {
  if (opt.versions) {
    const versions = await lib.getLatestVersions()
    console.log(versions.map(v => [v.id, v.type, v.time]))
  } else {
    let version = opt.version
    if (version === 'latest' || version === 'snapshot') {
      const versions = await lib.getManifest()
      version = versions.latest.release
      if (opt.version === 'snapshot') version = versions.latest.snapshot
    }
    if (opt.download) {
      await lib.downloadServer(version, { ...opt })
    } else {
      if (opt.dumpRegistries) {
        console.log('Registries dumping to', [opt.dumpRegistries])
      }
      const customOptions = opt._ || {}
      await lib.startServer(version, /* onStart callback */ null, {
        dumpRegistries: opt.dumpRegistries,
        timeout: opt.dumpRegistries ? 9000 : undefined,
        'server-port': opt.port,
        'online-mode': Boolean(opt.online),
        path: opt.path ? opt.path : undefined,
        ...customOptions
      })
    }
  }
}

main()

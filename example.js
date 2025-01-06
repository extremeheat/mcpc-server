const bs = require('mcpc-server')
const [, version, port, onlineMode] = process.argv
const options = version
  ? {
      'server-port': port || 25565,
      'online-mode': onlineMode || false
    }
  : undefined
bs.startServer(version || '1.17', null, options)

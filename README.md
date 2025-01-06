# mcpc-server
[![NPM version](https://img.shields.io/npm/v/mcpc-server.svg)](http://npmjs.com/package/mcpc-server)
[![Build Status](https://github.com/extremeheat/mcpc-server/workflows/CI/badge.svg)](https://github.com/extremeheat/mcpc-server/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/extremeheat/mcpc-server)


Command line program (CLI) and API for starting and working with Minecraft Java Edition servers.

## Running & Installation

Start a server through the command line:

```
npx mcpc-server -v 1.18.0
```

Or with npm to use programmatically:

```
npm install mcpc-server
```

## Usage

### via command line

```
npx mcpc-server --help
```

```
npx mcpc-server --version 1.18 --online --path ./my1.18server
```

any extraneous -- options will be placed inside the `server.properties` file, e.g. `--level-name coolWorld`.

### via code

see index.d.ts

```js
const mcpcServer = require('mcpc-server')

const onStart = () => console.log('Server started!')

mcpcServer.startServer('1.18.0', onStart, { 'server-port': 25565, 'online-mode': true, path: './bds' })
```

#### Get latest server data
From minecraft.net downloads
```js
mcpcServer.getLatestVersions().then(console.log)
```
to get
```coffee
[
  [ '1.21.4', 'release', '2024-12-03T10:24:48+00:00' ],
  [ '1.21.4-pre1', 'snapshot', '2024-12-03T10:00:03+00:00' ],
  [ '24w46a', 'snapshot', '2024-12-03T10:00:03+00:00' ],
  ...
  [ '1.21.2', 'release', '2024-12-03T06:33:45+00:00' ],
  [ '24w40a', 'snapshot', '2024-12-03T06:33:45+00:00' ]
]
```

### Help screen

```
mcpc-server - v1.2.0
Minecraft Java Server runner
Options:
  --version, -v Version to download (use "latest" for latest)  
  --port        Port to listen on for IPv4  (default: 25565)
  --port6       Port to listen on for IPv6  (default: 19133)
  --online      Whether to run in online mode  
  --path        Custom path to the server directory  
  --versions    Passing --versions will list all versions  
  --download    Download (but not run) the server binary for this platfrom (default: linux)  
Usage:
  mcpc-server --version latest      Start a server on the latest version
  mcpc-server --versions            List all avaliable versions
  mcpc-server -v 1.20.0 --download  Download (but not run) v1.20
```

## API

See the exported [TypeScript defs for method docs](src/index.d.ts).

## Testing
`npm test`

## History

See [history](HISTORY.md)
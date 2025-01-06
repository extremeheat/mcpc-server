/* eslint-env mocha */
const mcs = require('mcpc-server')
const fs = require('fs')
const assert = require('assert')
const { join } = require('path')
const versions = ['1.16', '1.18']

for (const version of versions) {
  describe(`${version}`, function () {
    this.timeout(90000)
    it('should start a minecraft server', async () => {
      const path = join(__dirname, '/mc-' + version)
      try { fs.rmSync(path, { recursive: true }) } catch (e) {}
      const [v4, v6] = [25565 + ((Math.random() * 1000) | 0), 19133 + ((Math.random() * 1000) | 0)]
      const handle = await mcs.startServerAndWait(version, 80000, { path, 'server-port': v4, 'server-portv6': v6, 'level-type': 'FLAT' })
      const ok = fs.existsSync(path)
      assert(ok, 'server did not start')
      handle.kill()
    })
  })
}

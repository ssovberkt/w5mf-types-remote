const tar = require('tar');
const download = require('download');

module.exports = class W5MFTypesRemotePlugin {
  constructor(options) {
    this.options = options; // installDir, archiveFile, remotes
  }

  apply(compiler) {
    const INSTALL_DIR = this.options?.installDir || 'node_modules';
    const ARCHIVE_FILE = this.options?.archiveFile || '@types.tar';
    const REMOTES = this.options?.remotes || {};

    compiler.hooks.beforeCompile.tap("W5MFTypesRemote", async (compilation) => {
      const remotes = Object.values(REMOTES);
      for (let i in remotes) {
        const remote = remotes[i].split('@')[1].split('/');
        const url = remote.slice(0, remote.length - 1).join('/');
        await download(`${url}/${ARCHIVE_FILE}`, INSTALL_DIR);
        await tar.extract({ file: `${INSTALL_DIR}/${ARCHIVE_FILE}` });
      }
    });
  }
};

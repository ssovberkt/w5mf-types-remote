const fs = require('fs');
const tar = require('tar');
const axios = require('axios');
const https = require('https');

const parseRemoteUrl = (remoteUrl) => {
  const parse = remoteUrl.split('@');
  const remote = parse[1].split('/');
  const url = remote.slice(0, remote.length - 1).join('/');
  return { name: parse[0], url }
}

module.exports = class W5MFTypesRemotePlugin {
  constructor(options) {
    this.options = options; // installDir, archiveFile, remotes
  }

  apply(compiler) {
    const INSTALL_DIR = this.options?.installDir || '.';
    const ARCHIVE_FILE = this.options?.archiveFile || 'w5mf-types.tar';
    const REMOTES = this.options?.remotes || {};
    const INSTALL_FILE = `${INSTALL_DIR}/${ARCHIVE_FILE}`;

    compiler.hooks.afterEnvironment.tap("W5MFTypesRemote", async (compilation) => {
      const remotes = Object.values(REMOTES);
      for (let i in remotes) {
        const app = parseRemoteUrl(remotes[i]);
        try {
          const response = await axios.get(`${app.url}/${ARCHIVE_FILE}`, {
            responseType: 'blob',
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          });
          fs.writeFileSync(INSTALL_FILE, response.data);
          await tar.extract({ file: INSTALL_FILE });
        } catch (error) {
          console.log('[W5MF-TYPES-REMOTE][ERROR]', error);
        }
      }
    });
  }
};

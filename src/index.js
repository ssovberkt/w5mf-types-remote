const argv = require('yargs/yargs')(process.argv.slice(2)).argv;
require('dotenv').config();

if (!argv?.NODE_ENV) {
  throw new Error('Set NODE_ENV params (development or production)');
}

if (!['development', 'production'].includes(argv.NODE_ENV)) {
  throw new Error(`Set NODE_ENV params (development or production). Current: ${argv.NODE_ENV}`);
}

process.env.NODE_ENV = argv.NODE_ENV

const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');
const tar = require('tar');
const axios = require('axios');
const https = require('https');

const ROOT_DIR = process.cwd();

const config = require(path.resolve(ROOT_DIR, 'src/config'));

const INSTALL_DIR = path.resolve(ROOT_DIR, '@types');
const TYPES_FILE = 'w5mf-types.tar';
const UPLOAD_TYPES_FILE = path.resolve(ROOT_DIR, `${INSTALL_DIR}/${TYPES_FILE}`);
const INSTALL_FILE = path.resolve(ROOT_DIR, TYPES_FILE);
const REMOTES = config.remotes || {};

const parseRemoteUrl = (remoteUrl) => {
  const parse = remoteUrl.split('@');
  const remote = parse[1].split('/');
  const url = remote.slice(0, remote.length - 1).join('/');
  return { name: parse[0], url }
}

const run = async (remote) => {
  const module = parseRemoteUrl(remote);

  try {
    const response = await axios.get(`${module.url}/${TYPES_FILE}?v=${Math.floor(Date.now())}`, {
      responseType: 'blob',
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    fs.writeFile(UPLOAD_TYPES_FILE, response.data, (error) => {
      if (error) {
        console.log(error);
        throw new Error(`[REMOTE_TYPES] Write file error`);
      }

      tar.extract({ file: UPLOAD_TYPES_FILE, cwd: INSTALL_DIR }, () => {
        rimraf(UPLOAD_TYPES_FILE, () => console.log(`[REMOTE_TYPES] Remove '${INSTALL_FILE}' for '${module.url}'`));
      });
    });

  } catch (error) {
    console.log('[REMOTE_TYPES]', error);
    throw error;
  }
}

(() => {
  rimraf(INSTALL_DIR, async (error) => {
    if (error) {
      console.log(`[REMOTE_TYPES] Remove '${INSTALL_DIR}'`, error);
    }

    fs.mkdir(INSTALL_DIR, async (error) => {
      if (error) {
        console.log(error);
        throw new Error(`[REMOTE_TYPES] Mkdir '${INSTALL_DIR}' error`);
      }

      const remotes = Object.values(REMOTES);
      for (let i in remotes) {
        await run(remotes[i]);
      }
    });
  });

})();

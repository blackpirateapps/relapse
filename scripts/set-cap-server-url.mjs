import fs from 'node:fs';

const configPath = new URL('../capacitor.config.json', import.meta.url);
const content = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(content);
const serverUrl = process.env.CAP_SERVER_URL?.trim();

if (serverUrl) {
  config.server = {
    ...(config.server || {}),
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://')
  };
  process.stdout.write(`Using CAP_SERVER_URL=${serverUrl}\n`);
} else {
  if (config.server && config.server.url) {
    delete config.server.url;
  }
  if (config.server && Object.prototype.hasOwnProperty.call(config.server, 'cleartext')) {
    delete config.server.cleartext;
  }
  process.stdout.write('CAP_SERVER_URL not provided. Android app will use bundled web assets.\n');
}

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

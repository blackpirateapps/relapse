import fs from 'node:fs';

const DEFAULT_SERVER_URL = 'https://phoenix.blackpiratex.com';
const configPath = new URL('../capacitor.config.json', import.meta.url);
const content = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(content);
const serverUrl = process.env.CAP_SERVER_URL?.trim() || DEFAULT_SERVER_URL;

config.server = {
  ...(config.server || {}),
  url: serverUrl,
  cleartext: serverUrl.startsWith('http://')
};

process.stdout.write(`Using mobile server URL: ${serverUrl}\n`);

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

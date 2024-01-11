const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
const version = packageJson.version;

const VERSION = `/v${version}`;
const ASSET_BASE_PATH = '###ASSET_BASE_PATH###';

const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');

fs.readFile(viteConfigPath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const result = data.replace(new RegExp(VERSION, 'g'), ASSET_BASE_PATH);
  fs.writeFile(viteConfigPath, result, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
});

fs.readFile(indexHtmlPath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const result = data.replace(new RegExp(VERSION, 'g'), ASSET_BASE_PATH);
  fs.writeFile(indexHtmlPath, result, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
});

const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
const version = packageJson.version;

const isSaasBuild = process.env.VITE_IS_SAAS_BUILD === 'true';
const assetBasePath = isSaasBuild ? `/v${version}` : '';

const viteConfigPath = path.join(__dirname,'..' ,'vite.config.ts');
const indexHtmlPath = path.join(__dirname,'..' ,'index.html');

fs.readFile(viteConfigPath, 'utf8', (err, data) => {
  if (err) throw err;
  const updatedData = data.replace(/###ASSET_BASE_PATH###/g, isSaasBuild ? assetBasePath : '/');
  fs.writeFile(viteConfigPath, updatedData, 'utf8', (err) => {
    if (err) throw err;
  });
});

fs.readFile(indexHtmlPath, 'utf8', (err, data) => {
  if (err) throw err;
  const updatedData = data.replace(/###ASSET_BASE_PATH###/g, assetBasePath);
  fs.writeFile(indexHtmlPath, updatedData, 'utf8', (err) => {
    if (err) throw err;
  });
});

#! /bin/sh

if [ "$VITE_IS_SAAS_BUILD" = "true" ]; then
  sed -i "s/###ASSET_BASE_PATH###/\/v$(jq -r '.version' package.json)/g" vite.config.ts
  sed -i "s/###ASSET_BASE_PATH###/\/v$(jq -r '.version' package.json)/g" index.html
else
  sed -i "s/###ASSET_BASE_PATH###/\//g" vite.config.ts
  sed -i "s/###ASSET_BASE_PATH###//g" index.html
fi

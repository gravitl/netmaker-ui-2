#! /bin/sh

VERSION=/v$(jq -r '.version' package.json)

sed -i "s/$VERSION/###ASSET_BASE_PATH###/g" vite.config.ts
sed -i "s/$VERSION/###ASSET_BASE_PATH###/g" index.html

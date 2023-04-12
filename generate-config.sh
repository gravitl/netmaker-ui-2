#!/bin/sh -eu

# AMUI_URL is the URL of the Account Managenent UI.
# If not set, it will default to https://account.netmaker.io

if [ -z "${AMUI_URL:-}" ]; then
  AMUI_URL='https://account.netmaker.io'
fi

echo "window.NMUI_AMUI_URL='$AMUI_URL';" > /usr/share/nginx/html/nmui-config.js
echo ">>>> NMUI_AMUI_URL set to: $AMUI_URL <<<<<"

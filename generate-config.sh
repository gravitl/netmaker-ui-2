#!/bin/sh -eu

# AMUI_URL is the URL of the Account Managenent UI.
# If not set, it will default to https://account.netmaker.io
if [ -z "${AMUI_URL:-}" ]; then
  AMUI_URL='https://account.staging.netmaker.io'
fi

# this is used for dynamic API url injection in standalone builds
if [ -z "${BACKEND_URL:-}" ]; then
  BACKEND_URL="http://localhost:8081"
fi

cat >/usr/share/nginx/html/nmui-config.js <<EOF
window.NMUI_AMUI_URL='$AMUI_URL';
window.NMUI_BACKEND_URL='$BACKEND_URL';
EOF

echo ">>>> NMUI_AMUI_URL set to: $AMUI_URL <<<<<"
echo ">>>> NMUI_BACKEND_URL set to: $BACKEND_URL <<<<<"

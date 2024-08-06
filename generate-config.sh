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

# ensure it is empty string if not set
if [ -z "${INTERCOM_APP_ID:-}" ]; then
  INTERCOM_APP_ID=""
fi

# ensure it is empty string if not set
if [ -z "${PUBLIC_POSTHOG_HOST:-}" ]; then
  PUBLIC_POSTHOG_HOST=""
fi

# ensure it is empty string if not set
if [ -z "${PUBLIC_POSTHOG_KEY:-}" ]; then
  PUBLIC_POSTHOG_KEY=""
fi

cat >/usr/share/nginx/html/nmui-config.js <<EOF
window.NMUI_AMUI_URL='$AMUI_URL';
window.NMUI_BACKEND_URL='$BACKEND_URL';
window.NMUI_INTERCOM_APP_ID='$INTERCOM_APP_ID';
window.NMUI_PUBLIC_POSTHOG_HOST='$PUBLIC_POSTHOG_HOST';
window.NMUI_PUBLIC_POSTHOG_KEY='$PUBLIC_POSTHOG_KEY';
EOF

echo ">>>> NMUI_AMUI_URL set to: $AMUI_URL <<<<<"
echo ">>>> NMUI_BACKEND_URL set to: $BACKEND_URL <<<<<"
echo ">>>> NMUI_INTERCOM_APP_ID set to: $INTERCOM_APP_ID <<<<<"
echo ">>>> NMUI_PUBLIC_POSTHOG_HOST set to: $PUBLIC_POSTHOG_HOST <<<<<"
echo ">>>> NMUI_PUBLIC_POSTHOG_KEY set to: ***** <<<<<"

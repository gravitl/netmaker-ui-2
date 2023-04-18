#!/bin/sh -eu

./generate-config.sh

nginx -g "daemon off;"

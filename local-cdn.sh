#!/bin/sh

script_dir="$(dirname "$0")"
cd "$script_dir"
npx http-server "$script_dir/build" -p 8082

#!/usr/bin/env bash
# يبني استوديو الرسم: js/studio.js و css/studio.css (يشتغل بعد npm install داخل studio-src)
set -euo pipefail
cd "$(dirname "$0")"
npx esbuild src/entry.tsx --bundle --minify --format=iife --target=es2020 --jsx=automatic --define:process.env.NODE_ENV='"production"' --tsconfig=tsconfig.json --legal-comments=none --outfile=../js/studio.js
npx @tailwindcss/cli -i studio.css -o .studio.tmp.css --minify
node scope-css.mjs .studio.tmp.css ../css/studio.css
rm -f .studio.tmp.css
ls -la ../js/studio.js ../css/studio.css

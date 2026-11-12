#!/bin/zsh
# Give sw.js a new cache name whenever the app's files change, so the phone swaps in the new copy on its next open.
cd ${0:A:h}/..
v=$(cat index.html style.css logic.js app.js manifest.webmanifest icon-192.png icon-512.png apple-touch-icon.png | shasum | cut -c1-10)
sed -i '' "s/^const CACHE = .*/const CACHE = 'lift-$v';/" sw.js
echo "sw.js cache lift-$v"

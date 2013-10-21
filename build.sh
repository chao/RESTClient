#!/bin/sh

XPI="restclient.xpi"
rm -rf XPI
# Copy base structure to a temporary build directory and change to it
echo "Creating working directory ..."
rm -rf build
mkdir build
cp -r \
  install.rdf content LICENSE\
      modules icon.png chrome.manifest \
  build/
cd build

echo "Cleaning up unwanted files ..."
find . -depth -name '*~' -exec rm -rf "{}" \;
find . -depth -name '#*' -exec rm -rf "{}" \;
find . -depth -name '*.psd' -exec rm -rf "{}" \;
find . -depth -name 'test*' -exec rm -rf "{}" \;
find . -depth -name '.DS_Store' -exec rm -rf "{}" \;
find . -depth -name '*.test.js' -exec rm -rf "{}" \;

echo "Creating $XPI ..."
zip -qr9DX "../$XPI" *

echo "Cleaning up temporary files ..."
cd ..
rm -rf build
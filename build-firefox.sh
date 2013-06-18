#!/bin/bash

echo Building firefox extension...

rm -rf ./build/firefox

mkdir -p ./build/firefox
mkdir -p ./build/firefox/skin
cp ./images/* ./build/firefox/skin
cp -R ./firefox/* ./build/firefox
cp ./content-script-home.js ./build/firefox/data
cp ./unanet.js ./build/firefox/data
cp ./libs/* ./build/firefox/data

cd ./build/firefox
rm unanet-firefox-extension.xpi
rm ../../firefox/unanet-firefox-extension.xpi
cfx xpi \
  --update-link https://github.com/nearinfinity/unanet-browser-extension/blob/master/firefox/unanet-firefox-extension.xpi?raw=true \
  --update-url https://github.com/nearinfinity/unanet-browser-extension/blob/master/firefox/unanet-firefox-extension.update.rdf?raw=true
cp unanet-firefox-extension.xpi ../../firefox
cp unanet-firefox-extension.update.rdf ../../firefox
cd ../..

echo Done building firefox extension.
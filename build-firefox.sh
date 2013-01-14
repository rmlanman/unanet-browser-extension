#!/bin/bash

echo Building firefox extension...

rm -rf ./build/firefox

mkdir -p ./build/firefox
mkdir -p ./build/firefox/skin
cp ./images/* ./build/firefox/skin
cp -R ./firefox/* ./build/firefox
mkdir ./build/firefox/data
cp ./chrome/content-script-home.js ./build/firefox/data
cp ./unanet.js ./build/firefox/data
cp ./libs/* ./build/firefox/data

cd ./build/firefox
rm unanet-firefox-extension.xpi
rm ../../firefox/unanet-firefox-extension.xpi
cfx xpi
cp unanet-firefox-extension.xpi ../../firefox
cd ../..

echo Done building firefox extension.
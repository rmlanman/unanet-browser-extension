#!/bin/bash

echo Building firefox extension...

rm -rf ./build/firefox

mkdir -p ./build/firefox
cp -R ./firefox/* ./build/firefox
mkdir ./build/firefox/data
cp ./unanet.js ./build/firefox/data
cp ./libs/* ./build/firefox/data

cd ./build/firefox
cfx xpi
cp unanet-firefox-extension.xpi ../../firefox
cd ../..

echo Done building firefox extension.
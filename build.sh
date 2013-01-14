#!/bin/bash

rm -rf ./build
mkdir ./build

# chrome
mkdir ./build/chrome
cp ./unanet.js ./build/chrome
cp ./chrome/* ./build/chrome
cp ./images/* ./build/chrome
cp ./libs/* ./build/chrome

# firefox
mkdir ./build/firefox
cp -R ./firefox/* ./build/firefox
mkdir ./build/firefox/data
cp ./unanet.js ./build/firefox/data
cp ./libs/* ./build/firefox/data

cd ./build/firefox
zip unanet-firefox-extension.xpi *
cp unanet-firefox-extension.xpi ../../firefox
cd ../..

# safari
mkdir ./build/safari
cp -R ./safari/* ./build/safari
cp ./unanet.js ./build/safari/unanet.safariextension
cp ./libs/* ./build/safari/unanet.safariextension
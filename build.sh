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


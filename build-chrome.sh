#!/bin/bash

echo Building chrome extension...

rm -rf ./build/chrome

mkdir -p ./build/chrome
cp ./unanet.js ./build/chrome
cp ./chrome/* ./build/chrome
cp ./images/* ./build/chrome
cp ./libs/* ./build/chrome

echo Done building chrome extension.
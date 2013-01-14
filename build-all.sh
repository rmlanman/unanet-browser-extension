#!/bin/bash

rm -rf ./build
mkdir ./build

./build-chrome.sh
./build-firefox.sh
./build-safari.sh

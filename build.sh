#!/bin/bash

rm -rf ./build
mkdir ./build

# chrome
mkdir ./build/chrome
cp ./chrome/* ./build/chrome
cp ./images/* ./build/chrome
cp ./libs/* ./build/chrome


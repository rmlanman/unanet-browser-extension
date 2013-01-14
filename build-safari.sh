#!/bin/bash

echo Building safari extension...

rm -rf ./build/safari

mkdir -p ./build/safari
cp -R ./safari/* ./build/safari
cp ./unanet.js ./build/safari/unanet.safariextension
cp ./libs/* ./build/safari/unanet.safariextension

echo Done building safari extension.
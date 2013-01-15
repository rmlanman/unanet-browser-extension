#!/bin/bash

echo Building safari extension...

rm -rf ./build/safari

mkdir -p ./build/safari
cp -R ./safari/unanet.safariextension ./build/safari
cp ./unanet.js ./build/safari/unanet.safariextension
cp ./libs/* ./build/safari/unanet.safariextension

PlistBuddy=/usr/libexec/PlistBuddy

SHORT=`$PlistBuddy -c "Print :CFBundleShortVersionString" ./safari/unanet.safariextension/Info.plist`
VERSION=`$PlistBuddy -c "Print :CFBundleVersion" ./safari/unanet.safariextension/Info.plist`

$PlistBuddy -c "Set :Extension\ Updates:0:CFBundleVersion $VERSION" ./safari/manifest.plist
$PlistBuddy -c "Set :Extension\ Updates:0:CFBundleShortVersionString $SHORT" ./safari/manifest.plist

echo Done building safari extension.

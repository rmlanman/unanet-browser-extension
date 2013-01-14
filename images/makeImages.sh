#!/bin/bash

convert unanet.ico unanet48.png
mv unanet48-0.png unanet16.png
mv unanet48-1.png unanet24.png
mv unanet48-2.png unanet32.png
mv unanet48-3.png unanet48.png
convert unanet24.png -resize 18x18 unanet18.png
convert unanet48.png -resize 64x64 unanet64.png
convert unanet48.png -resize 128x128 unanet128.png
convert unanet128.png -background 'rgb(255,0,0)' -flatten unanetError128.png

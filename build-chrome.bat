rmdir /s /q build
mkdir build

REM chrome
mkdir build\chrome
xcopy content-script-home.js build\chrome
xcopy unanet.js build\chrome
xcopy chrome\* build\chrome
xcopy images\* build\chrome
xcopy libs\* build\chrome


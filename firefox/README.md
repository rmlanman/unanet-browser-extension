# Unanet Firefox Add-on

Adds credit card charges, training, and book budgets to the home page.

## Install

* Save and open the [Unanet Firefox Add-On](https://github.com/nearinfinity/unanet-browser-extension/blob/master/firefox/unanet-firefox-extension.xpi?raw=true).
* If updates are disabled, you may need to go into the Add-ons Manager to receive updates. Otherwise the Unanet Firefox Add-on updates automatically. 

## Developers

1. Clone this repository
1. Download and extract the Firefox [Add-on SDK version 1.5](https://ftp.mozilla.org/pub/mozilla.org/labs/jetpack/addon-sdk-1.5.tar.gz)
1. From the Add-on SDK's root directory, follow the README instructions to temporarily activate the SDK or add the SDK to your path
1. `./build-firefox.sh`
1. To easily test changes in a fresh profile without installing the extension XPI file, run `cfx run` from `build/firefox`

For more on the Add-on SDK, from the Add-on SDK's root directory run 'cfx docs' or view the latest documention online [here](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/dev-guide/index.html).

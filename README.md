# Mooscript - Multi tabber

This is a script for mobstar.cc. It can be downloaded here: https://chrome.google.com/webstore/detail/mooscript-multi-tabber/jbpimmpmjcllclmhgmjebmphiopcfahn


# Features

* Lets you run an account on a specific tab, without the tabs interfering with each other
* Auto-logs you back in when your session expires
* Works when you login using a database

## How to build & run (for devs)

Make sure you have node and npm/yarn installed. 

Run `yarn install` or `npm install` in the root folder

Run `yarn start` to build a dev version.

Go to `chrome://extensions/` in Chrome. Enable developer mode and click on the button `load unpacked`. Point to the `dist` folder.

If you want to build a release version, use `yarn build`. Load the extension by pointing to the `build` folder instead.

Please note that there is an issue with the front-end building. When you make a change to the front-end, you should re-run `yarn start`.

# Mooscript

This is a script for mobstar.cc. It can be downloaded here: https://chrome.google.com/webstore/detail/mooscript/djhglpcnfbhphmbepgopggdnldpfdieb

The goal is to have a free, powerful and open-source script that anyone can use.

# Features

Some of the big features are:

* Lead scripting
* Automatic drug run finding
* Can run many (50-100) accounts at the same time
* See a list of all your accounts and its stats, like rank, money, lead, honor/credits
* Works on any platform that supports Chrome (Windows, Mac, Linux, ChromeOS)
* Auto updates to get the latest features

The rest of the features:

* Small crimes
* GTA 
* Selling all cars (except vans)
* Buying weapon/protection/plane/lead factory
* Collecting your will
* Drug running
* Jail busting until you're 100%
* Works with free & paid accounts

The script is still new so there may be bugs. Updates to the game can also break the script. Please be patient if anything breaks. It will automatically update soon.

If you have any questions, ideas, bugs or other anything else, you can make an issue or email me at cow(AT)mooscript.com

## FAQ

Q: Hoes does it automatically find the drug run?

A: Somewhere in the night it will check which countries have the most people. Those will be the DR countries. This works most of the time. You should occasionally check if the DR is correct and use the 'reset drug run' button if it's wrong.

Q: How do I know if the script is safe?

A: The source code of the script is available for free (bottom of the page). Feel free to read through it or ask a programmer friend to do so. Your data never leaves your PC, except to communicate with mobstar.cc. Chrome extensions can also not access files on your PC.

Q: Will the script keep running if I close Chrome?

A: No. You must keep Chrome open if you want your scripts to run.

Q: I want my friends to pause/start my scripts. How do I do that?

A: There is no built-in support for this. You'll have to use something like TeamViewer to give them access to your PC. 

Q: Why is it called Mooscript?

A: Because cows are cool. And because it looks like Mobscript

## Technical info

### Data storage
We use Google extenion's local storage: https://developer.chrome.com/docs/extensions/reference/storage/
We don't use the synced local storage (that syncs across all logged in instances of Chrome) because you can only store limited amount of data on there.
This data storage contains all the accounts you entered, along with some info about the accounts (like the char name) and any configurations you set.

None of this data is shared with anyone or anywhere, except mobstar.cc itself. 

### Sessions

We look at all mobstar.cc http requests and identify which ones originate from the extension. Any Set-Cookie response headers are stripped out, as they would interfere with other tabs. When the script tries to log your account in, it receives a mob auth cookie. It looks for this cookie in each response header for API calls made by the extension and stores this cookie in (non persistent) memory. It reuses this cookie for each action it performs on your behalf.

When you use the "login" button on the extension, it retrieves this in-memory cookie and sets it for your entire browser. This way you're the script is sharing its login cookie with the user, so that they don't interfere with each other and create new sessions (that log each other out). However, when an account has no script running and you try to log it in, then there is no in-memory cookie to retrieve so it will log you in the normal way.

### General flow of the script

Every 30 seconds, it goes through every account you have where the script is running. It will perform each action (small crime, GTA etc) one by one. Each action has a cooldown, so if a cooldown hasn't passed, it doesn't perform the action to save unnecessary API calls. For example small crimes are only performed every 2 minutes. If something weird happened during these actions, it will check if the account is logged out, in jail, dead or the server is down. If it's none of those, it's considered an unexpected error and it gets logged locally.

If it took less than 30 seconds to complete the actions, it will wait until the full 30 seconds have passed before doing everything again. If it took more than 30 seconds (for example if you have 50+ accounts on script), it will immediately go through the list again.

## How to build & run

Make sure you have node and npm/yarn installed. 

Run `yarn install` or `npm install` in the root folder

Run `yarn start` to build a dev version.

Go to `chrome://extensions/` in Chrome. Enable developer mode and click on the button `load unpacked`. Point to the `dist` folder.

If you want to build a release version, use `yarn build`. Load the extension by pointing to the `build` folder instead.

Please note that there is an issue with the front-end building. When you make a change to the front-end, you should re-run `yarn start`.

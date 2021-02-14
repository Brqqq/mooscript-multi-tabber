import "./lib/moment.js";
import "./lib/moment-timezone.js";

import { doSmallCrime } from "./actions/smallcrime.js"
import { removeAccount, updateAccount, addAccount, getFromStorage, setInStorage, initStorage, getAccounts } from "./storage.js";
import { doGta } from "./actions/carstealing.js";
import { sellCars } from "./actions/carseller.js";
import { findDrugRun } from "./actions/drugrunfinder.js";
import { doDrugDeal } from "./actions/drugdealing.js";
import { createLead } from "./actions/leadcreation.js";
import { collectWill } from "./actions/willcollector.js";
import { isDead, getDoc, isLoggedOut, isInJail, postForm, sleep } from "./actions/utils.js";
import { Routes } from "./actions/routes.js";
import { savePlayerInfo } from "./actions/saveplayerinfo.js";

let mobAuths = {};

window.currentCookie = "";


// All of this header magic is to distinguish extension HTTP requests vs non-extension HTTP requests
// Otherwise this script would constantly interfere with the user playing the game
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        /* Identify somehow that it's a request initiated by you */

        // This means the the request came from somewhere other than our script
        if (details.initiator == null || !details.initiator.includes("chrome-extension://")) {
            return { requestHeaders: details.requestHeaders };
        }

        for (var i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name === 'Cookie') {
                details.requestHeaders[i].value = window.currentCookie;
                break;
            }
        }

        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "requestHeaders", "extraHeaders"]
);


chrome.webRequest.onHeadersReceived.addListener((details) => {
    if (details.initiator == null || !details.initiator.includes("chrome-extension://")) {
        return { responseHeaders: details.responseHeaders };
    }

    const authCookies = details.responseHeaders.filter(header => header.name === "Set-Cookie" && header.value.includes("MOBSTAR_AUTH"));
    if (authCookies.length === 0) {
        return { responseHeaders: details.responseHeaders };
    }

    const authCookie = authCookies.find(cookie => !cookie.value.includes("deleted"))
    // 
    if (authCookie == null) {
        return { responseHeaders: details.responseHeaders };
    }
    const authCookieParts = authCookie.value.split(";");
    window.currentCookie = authCookieParts[0];

    // Strip set-cookie headers so they don't get saved and affect the tabs
    // We manually set the cookie so it doesn't affect us
    details.responseHeaders = details.responseHeaders.filter(header => header.name !== "Set-Cookie");;

    return { responseHeaders: details.responseHeaders };
},
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "responseHeaders", "extraHeaders"]);

var fetchMobAuth = async (email, password) => {
    // We rely on the side effect in onHeadersReceived to get the cookie
    // const fetchResult = await fetch("https://www.mobstar.cc/main/login.php", {
    //     body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    //     headers: {
    //         "Content-Type": "application/x-www-form-urlencoded"
    //     },
    //     method: "POST"
    // });

    const fetchResult = await postForm(Routes.Login, `email=${email}&password=${password}`);

    if (isLoggedOut(fetchResult.result)) {
        return false;
    }

    // window.currentCookie is set as a side effect from making the API call (check the header magic above)
    // Ugly problems require ugly solutions ¯\_(ツ)_/¯
    return window.currentCookie;
}
window.fetchMobAuth = fetchMobAuth;

const useAuthToken = (email) => {
    const token = mobAuths[email];
    return new Promise((resolve, reject) => {
        if (token == null) {
            reject("Not logged in");
            return;
        }
        try {
            chrome.cookies.set({
                url: "https://www.mobstar.cc",
                domain: ".mobstar.cc",
                name: "MOBSTAR_AUTH",
                value: token.split("=")[1]
            }, (cookie) => {
                resolve();
            });
        } catch (e) {
            reject(e);
        }
    });
}
window.useAuthToken = useAuthToken;

window.addAccount = addAccount;

window.removeAccount = removeAccount;

window.updateAccount = updateAccount;

const gameLoop = async (action, ticksInSeconds) => {
    let lastLoopTime = new Date();

    while (true) {
        await action();

        const timeLeftToWait = (ticksInSeconds * 1000) - (new Date().valueOf() - lastLoopTime.valueOf())

        if (timeLeftToWait > 0) {
            await new Promise(resolve => setTimeout(resolve, timeLeftToWait));
        } else {
            console.log("Loop took a little longer than expected...");
        }
        lastLoopTime = new Date();
    }

}

const performAction = (action, cooldown, lastActionInMs) => {
    if (lastActionInMs + cooldown < new Date().valueOf()) {
        return action();
    }
    return false;
}

const start = async () => {
    await initStorage();

    const getDefaultConfig = () => ({
        lastSmallCrime: 0,
        smallCrimeCooldown: 0,

        lastGta: 0,
        gtaCooldown: 0,

        lastCarSelling: 0,
        carSellingCooldown: 0,

        lastLeadCreation: 0,
        leadCreationCooldown: 0,

        lastDrugDeal: 0,
        drugDealingCooldown: 0,

        lastDrugFind: 0,
        drugFindCooldown: 0,

        lastJailBust: 0,
        jailBustCooldown: 0,

        lastPlayerSaved: 0,
        playerSaveCooldown: 0,

        hasCheckedWill: false
    })
    const configs = {};

    const loop = async () => {
        const accounts = getAccounts();
        for (let email of Object.keys(accounts)) {
            const account = accounts[email];
            if(!account.active) {
                continue;
            }
            
            let config = configs[email];

            if (config == null) {
                config = getDefaultConfig();
                configs[email] = config;
            }

            let auth = mobAuths[email];

            try {
                if (auth == null) {
                    auth = await fetchMobAuth(email, account.password);
                    if (auth) {
                        mobAuths[email] = auth;
                    } else {
                        await updateAccount(email, {
                            invalidPassword: true,
                            active: false
                        });
                        continue;
                    }
                }
                window.currentCookie = auth;

                if (!config.hasCheckedWill) {
                    await collectWill();
                    config.hasCheckedWill = true;
                }

                const smallCrimeResult = await performAction(doSmallCrime, config.smallCrimeCooldown, config.lastSmallCrime);
                if (smallCrimeResult) {
                    config.smallCrimeCooldown = smallCrimeResult;
                    config.lastSmallCrime = new Date().valueOf();
                }

                const gtaResult = await performAction(doGta, config.gtaCooldown, config.lastGta);
                if (gtaResult) {
                    config.gtaCooldown = gtaResult;
                    config.lastGta = new Date().valueOf();
                }

                const carSellingResult = await performAction(sellCars, config.carSellingCooldown, config.lastCarSelling);
                if (carSellingResult) {
                    config.carSellingCooldown = carSellingResult;
                    config.lastCarSelling = new Date().valueOf();
                }

                const leadCreationResult = await performAction(createLead, config.leadCreationCooldown, config.lastLeadCreation);
                if (leadCreationResult) {
                    config.leadCreationCooldown = leadCreationResult;
                    config.lastLeadCreation = new Date().valueOf();
                }

                const drugDealResult = await performAction(doDrugDeal, config.drugDealingCooldown, config.lastDrugDeal);
                if (drugDealResult) {
                    config.drugDealingCooldown = drugDealResult;
                    config.lastDrugDeal = new Date().valueOf();
                }

                const drugFindResult = await performAction(findDrugRun, config.drugFindCooldown, config.lastDrugFind);
                if (drugFindResult) {
                    config.drugFindCooldown = drugFindResult;
                    config.lastDrugFind = new Date().valueOf();
                }

                const savePlayerResult = await performAction(savePlayerInfo, config.playerSaveCooldown, config.lastPlayerSaved);
                if(savePlayerResult) {
                    config.playerSaveCooldown = savePlayerResult;
                    config.lastPlayerSaved = new Date().valueOf();
                }

                await sleep(1000);
            } catch (e) {
                const fetchRes = await getDoc(Routes.TestPage);
                if (isDead(fetchRes.document)) {
                    await updateAccount(email, {
                        isDead: true,
                        active: false
                    });
                }
                else if (isLoggedOut(fetchRes.result)) {
                    auth = await fetchMobAuth(email, account.password);
                    if (auth) {
                        mobAuths[email] = auth;
                    } else {
                        await updateAccount(email, {
                            invalidPassword: true,
                            active: false
                        });
                    }
                    // login
                } else if (isInJail(fetchRes.result)) {
                    // Do nothing
                }
                else {
                    console.error("Unknown error with user: " + email);
                    console.error(e);
                    console.error(fetchRes);
                }
            }
        }
    };

    gameLoop(loop, 30)
}

start();

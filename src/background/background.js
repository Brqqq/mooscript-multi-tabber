import "./lib/moment.js";
import "./lib/moment-timezone.js";

import { doSmallCrime } from "./actions/smallcrime.js"
import { removeAccount, updateAccount, addAccount, updateEveryAccount, resetDrugRun, getFromStorage, setInStorage, initStorage, getAccounts, getConfig, updateConfig, addAccountsToUpdateList } from "./storage.js";
import { doGta } from "./actions/carstealing.js";
import { sellCars } from "./actions/carseller.js";
import { findDrugRun } from "./actions/drugrunfinder.js";
import { doDrugDeal } from "./actions/drugdealing.js";
import { createLead } from "./actions/leadcreation.js";
import { collectWill } from "./actions/willcollector.js";
import { isDead, getDoc, isLoggedOut, isInJail, postForm, sleep } from "./actions/utils.js";
import { Routes } from "./actions/routes.js";
import { savePlayerInfo } from "./actions/saveplayerinfo.js";
import { buyItems } from "./actions/buyitems.js";
import { doJailbust } from "./actions/jailbuster.js";

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({ url: "index.html" });
});

let mobAuths = {};

window.currentCookie = "";


let manualLoginRequestId = "";

// All of this header magic is to distinguish extension HTTP requests vs non-extension HTTP requests
// Otherwise this script would constantly interfere with the user playing the game
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        /* Identify somehow that it's a request initiated by you */

        if (details.url.includes("mooscript=true")) {
            manualLoginRequestId = details.requestId;
        }

        // This means the the request came from somewhere other than our script
        if (manualLoginRequestId === details.requestId || details.url.includes("mooscript=true") || details.initiator == null || !details.initiator.includes("chrome-extension://")) {
            return { requestHeaders: details.requestHeaders };
        }

        for (var i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name === "Cookie") {
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
    if (details.url.includes("mooscript=true") || details.initiator == null || !details.initiator.includes("chrome-extension://")) {
        return { responseHeaders: details.responseHeaders };
    }

    const authCookies = details.responseHeaders.filter(header => header.name === "Set-Cookie" && header.value.includes("MOBSTAR_AUTH"));
    if (authCookies.length === 0) {
        return { responseHeaders: details.responseHeaders };
    }

    //const authCookie = authCookies[0];
    const authCookie = authCookies.find(cookie => !cookie.value.includes("deleted"))

    if (authCookie) {
        const authCookieParts = authCookie.value.split(";");
        window.currentCookie = authCookieParts[0];


    } else {
        // Don't save the "deleted" cookie. It causes some weird infinite redirect issues
        window.currentCookie = "";
    }
    // Strip set-cookie headers so they don't get saved and affect the tabs
    // We manually set the cookie so it doesn't affect us
    details.responseHeaders = details.responseHeaders.filter(header => header.name !== "Set-Cookie");;
    return { responseHeaders: details.responseHeaders };
},
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "responseHeaders", "extraHeaders"]);

var fetchMobAuth = async (email, password) => {
    const fetchResult = await postForm(Routes.Login, `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, { disableSanitize: true });

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

window.updateEveryAccount = updateEveryAccount;

window.setInStorage = setInStorage;

window.resetDrugRun = resetDrugRun;

window.addAccountsToUpdateList = addAccountsToUpdateList;

const gameLoop = async (action, ticksInSeconds) => {
    let lastLoopTime = new Date();

    while (true) {
        await action();

        const timeLeftToWait = (ticksInSeconds * 1000) - (new Date().valueOf() - lastLoopTime.valueOf())

        if (timeLeftToWait > 0) {
            await new Promise(resolve => setTimeout(resolve, timeLeftToWait));
        }

        lastLoopTime = new Date();
    }

}

const performAction = (action, account, cooldown, lastActionInMs) => {
    if (lastActionInMs + cooldown < new Date().valueOf()) {
        return action(account);
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

        lastItemsBought: 0,
        itemBuyingCooldown: 0,

        willCheckingCooldown: 0,
        lastWillChecked: 0
    })
    const cooldownConfigs = {};

    const loop = async () => {
        const accounts = getAccounts();

        for (let email of Object.keys(accounts)) {
            const config = getConfig();
            if (config.updateAccounts.length > 0) {
                break;
            }

            const account = accounts[email];
            if (!account.active) {
                continue;
            }

            let cooldownConfig = cooldownConfigs[email];

            if (cooldownConfig == null) {
                cooldownConfig = getDefaultConfig();
                cooldownConfigs[email] = cooldownConfig;
            }

            let auth = mobAuths[email];

            try {
                if (auth == null) {
                    auth = await tryLogin(email, account, mobAuths);
                    if (!auth) continue;
                }
                window.currentCookie = auth;

                const willCollectionResult = await performAction(collectWill, account, cooldownConfig.willCheckingCooldown, cooldownConfig.lastWillChecked);
                if (willCollectionResult) {
                    cooldownConfig.willCheckingCooldown = willCollectionResult;
                    cooldownConfig.lastWillChecked = new Date().valueOf();
                }

                if (account.enableSmallCrime) {
                    const smallCrimeResult = await performAction(doSmallCrime, account, cooldownConfig.smallCrimeCooldown, cooldownConfig.lastSmallCrime);
                    if (smallCrimeResult) {
                        cooldownConfig.smallCrimeCooldown = smallCrimeResult;
                        cooldownConfig.lastSmallCrime = new Date().valueOf();
                    }
                }

                if (account.enableGta) {
                    const gtaResult = await performAction(doGta, account, cooldownConfig.gtaCooldown, cooldownConfig.lastGta);
                    if (gtaResult) {
                        cooldownConfig.gtaCooldown = gtaResult;
                        cooldownConfig.lastGta = new Date().valueOf();
                    }
                }

                if (account.enableCarSelling) {
                    const carSellingResult = await performAction(sellCars, account, cooldownConfig.carSellingCooldown, cooldownConfig.lastCarSelling);
                    if (carSellingResult) {
                        cooldownConfig.carSellingCooldown = carSellingResult;
                        cooldownConfig.lastCarSelling = new Date().valueOf();
                    }
                }

                if (account.enableItemBuying) {
                    const itemBuyingResult = await performAction(buyItems, account, cooldownConfig.itemBuyingCooldown, cooldownConfig.lastItemsBought);
                    if (itemBuyingResult) {
                        cooldownConfig.itemBuyingCooldown = itemBuyingResult;
                        cooldownConfig.lastItemsBought = new Date().valueOf();
                    }
                }


                const leadCreationResult = await performAction(createLead, account, cooldownConfig.leadCreationCooldown, cooldownConfig.lastLeadCreation);
                if (leadCreationResult) {
                    cooldownConfig.leadCreationCooldown = leadCreationResult;
                    cooldownConfig.lastLeadCreation = new Date().valueOf();
                }

                if (account.enableDrugRunning) {
                    const drugDealResult = await performAction(doDrugDeal, account, cooldownConfig.drugDealingCooldown, cooldownConfig.lastDrugDeal);
                    if (drugDealResult) {
                        cooldownConfig.drugDealingCooldown = drugDealResult;
                        cooldownConfig.lastDrugDeal = new Date().valueOf();
                    }
                }

                if (account.enableDrugRunning) {
                    const drugFindResult = await performAction(findDrugRun, account, cooldownConfig.drugFindCooldown, cooldownConfig.lastDrugFind);
                    if (drugFindResult) {
                        cooldownConfig.drugFindCooldown = drugFindResult;
                        cooldownConfig.lastDrugFind = new Date().valueOf();
                    }
                }

                const savePlayerResult = await performAction(savePlayerInfo, account, cooldownConfig.playerSaveCooldown, cooldownConfig.lastPlayerSaved);
                if (savePlayerResult) {
                    cooldownConfig.playerSaveCooldown = savePlayerResult;
                    cooldownConfig.lastPlayerSaved = new Date().valueOf();
                }

                if (account.enableJailbusting) {
                    const jailBustResult = await performAction(doJailbust, account, cooldownConfig.jailBustCooldown, cooldownConfig.lastJailBust);
                    if (jailBustResult) {
                        cooldownConfig.jailBustCooldown = jailBustResult;
                        cooldownConfig.lastJailBust = new Date().valueOf();
                    }
                }

                await sleep(1000);
            } catch (e) {
                let fetchRes;
                try {
                    fetchRes = await getDoc(Routes.TestPage);
                } catch (innerEx) {
                    console.log("Error with connecting to mobstar");
                    console.log("Initial error")
                    console.error(e);
                    console.log("Mobstar connection exception")
                    console.error(innerEx);
                    await sleep(5000);
                    continue;
                }

                if (isDead(fetchRes.document)) {
                    await updateAccount(email, {
                        dead: true,
                        active: false
                    });
                }
                else if (isLoggedOut(fetchRes.result)) {
                    await tryLogin(email, account, mobAuths);
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

        const config = getConfig();
        if (config.updateAccounts.length > 0) {

            const accountsToUpdate = config.updateAccounts.reduce((acc, email) => {
                return {
                    ...acc,
                    [email]: accounts[email]
                }
            }, {});

            for (let email of Object.keys(accountsToUpdate)) {
                let attempt = 0;
                const maxAttempts = 3;

                do {
                    attempt++;
                    const account = accounts[email];
                    let auth = mobAuths[email];

                    try {
                        if (auth == null) {
                            auth = await tryLogin(email, account, mobAuths);
                            if (!auth) continue;
                        }
                        window.currentCookie = auth;

                        await performAction(savePlayerInfo, account, 0, 0);
                        attempt = maxAttempts;

                    } catch (e) {
                        let fetchRes;
                        try {
                            fetchRes = await getDoc(Routes.TestPage);
                        } catch (innerEx) {
                            console.log("Error with connecting to mobstar");
                            console.log("Initial error")
                            console.error(e);
                            console.log("Mobstar connection exception")
                            console.error(innerEx);
                            await sleep(5000);
                            continue;
                        }

                        if (isDead(fetchRes.document)) {
                            await updateAccount(email, {
                                dead: true,
                                active: false
                            });
                        }
                        else if (isLoggedOut(fetchRes.result)) {
                            await tryLogin(email, account, mobAuths);
                        } else if (isInJail(fetchRes.result)) {
                            // Do nothing
                        }
                        else {
                            console.error("Unknown error with user: " + email);
                            console.error(e);
                            console.error(fetchRes);
                        }
                    }
                } while (attempt < maxAttempts)
            }

            updateConfig({ updateAccounts: [] });
        }
    };

    gameLoop(loop, 30)
}

const tryLogin = async (email, account, mobAuths) => {
    let attempt = 0;
    const maxAttempts = 3;
    do {
        const auth = await fetchMobAuth(email, account.password);
        if (auth) {
            mobAuths[email] = auth;
            if (account.invalidPassword) {
                await updateAccount(email, {
                    invalidPassword: false
                });
            }

            return auth;
        }
        await sleep(1000 * (attempt + 1));
        attempt++;
    } while (attempt < maxAttempts);

    await updateAccount(email, {
        invalidPassword: true,
        active: false
    });

    return false;
}

start();

import "./lib/moment.js";
import "./lib/moment-timezone.js";

import { doSmallCrime } from "./actions/smallcrime.js"
import { addNewDetectiveSearch, addNewDetectiveFind, removeAccount, updateAccount, updateAccounts, addAccount, updateEveryAccount, resetDrugRun, getFromStorage, setInStorage, initStorage, getAccounts, getConfig, updateConfig, addAccountsToUpdateList, getDetective, removeDetectiveSearch, removeDetectiveResult } from "./storage.js";
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

import { searchAccount } from "./detective/search.js";
import { findResult } from "./detective/findresult.js";

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({ url: "index.html" });
});

let mobAuths = {};
let tabSessions = {};
let requests = {};

let manualLoginRequestId = "";

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabSessions[tabId]) {
        delete tabSessions[tabId];
    }
});

// When a new popup is created
chrome.webNavigation.onCreatedNavigationTarget.addListener(details => {
    if (details.sourceTabId && tabSessions[details.sourceTabId] != null) {
        tabSessions[details.tabId] = tabSessions[details.sourceTabId];
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabSessions[tabId] != null && changeInfo.status === 'complete') {
        const accounts = getAccounts();
        const account = accounts[tabSessions[tabId]];
        if (account != null) {
            chrome.tabs.executeScript(tabId, {
                code: `document.title = "${account.name}";`
            });
        }
    }
});

// All of this header magic is to distinguish extension HTTP requests vs non-extension HTTP requests
// Otherwise this script would constantly interfere with the user playing the game
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        /* Identify somehow that it's a request initiated by you */

        if (details.url.includes("mooscript=true")) {
            manualLoginRequestId = details.requestId;
        }

        if (tabSessions[details.tabId] != null) {
            for (var i = 0; i < details.requestHeaders.length; i++) {
                if (details.requestHeaders[i].name === "Cookie") {
                    const email = tabSessions[details.tabId];
                    const cookie = mobAuths[email];
                    details.requestHeaders[i].value = cookie;
                    break;
                }
            }
            return { requestHeaders: details.requestHeaders };
        }

        // This means the the request came from somewhere other than our script
        if (manualLoginRequestId === details.requestId || details.url.includes("mooscript=true") || details.initiator == null || !details.initiator.includes("chrome-extension://")) {
            return { requestHeaders: details.requestHeaders };
        }
        const email = details.requestHeaders.find(header => header.name === "MooScript");
        if(!email) {
            console.error("Couldn't find email header in a request!");
            console.error("Headers: ", details.requestHeaders);

            return { requestHeaders: details.requestHeaders };
        }

        requests[details.requestId] = {
            email: email.value,
            date: new Date().valueOf()
        };

        const cookie = mobAuths[email.value];

        for (var i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name === "Cookie") {
                details.requestHeaders[i].value = cookie;
                break;
            }
        }

        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "requestHeaders", "extraHeaders"]
);


chrome.webRequest.onHeadersReceived.addListener((details) => {
    if (tabSessions[details.tabId] != null && details.url.includes("https://www.mobstar.cc/main/message.php?msgid=1")) {
        const email = tabSessions[details.tabId];
        const account = getAccounts()[email];

        if (account) {
            tryLogin(email, account)
                .catch(e => console.error);
        }

        return { responseHeaders: details.responseHeaders };
    }

    if (details.url.includes("mooscript=true") || details.initiator == null || !details.initiator.includes("chrome-extension://")) {
        return { responseHeaders: details.responseHeaders };
    }

    const authCookies = details.responseHeaders.filter(header => header.name === "Set-Cookie" && header.value.includes("MOBSTAR_AUTH"));
    if (authCookies.length === 0) {
        return { responseHeaders: details.responseHeaders };
    }

    const { email } = requests[details.requestId];
    if(!email) {
        console.error("Couldn't map response to a matching request!");
        console.error("Headers: ", details.requestHeaders);

        return { responseHeaders: details.responseHeaders };
    }
    delete requests[details.requestId];

    const authCookie = authCookies.find(cookie => !cookie.value.includes("deleted"))

    if (authCookie) {
        const authCookieParts = authCookie.value.split(";");
        //window.currentCookie = authCookieParts[0];
        mobAuths[email] = authCookieParts[0];

    } else {
        // Don't save the "deleted" cookie. It causes some weird infinite redirect issues
        mobAuths[email] = "";
    }
    // Strip set-cookie headers so they don't get saved and affect the tabs
    // We manually set the cookie so it doesn't affect us
    details.responseHeaders = details.responseHeaders.filter(header => header.name !== "Set-Cookie");
    return { responseHeaders: details.responseHeaders };
},
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "responseHeaders", "extraHeaders"]);

var fetchMobAuth = async (email, password) => {
    const fetchResult = await postForm(Routes.Login, `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, email, { disableSanitize: true });

    if (isLoggedOut(fetchResult.result)) {
        return false;
    }

    return mobAuths[email];
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
                resolve(cookie);
            });
        } catch (e) {
            reject(e);
        }
    });
}
window.useAuthToken = useAuthToken;

window.addAccount = addAccount;

window.removeAccount = removeAccount;

window.updateAccounts = updateAccounts;

window.updateAccount = updateAccount;

window.updateEveryAccount = updateEveryAccount;

window.setInStorage = setInStorage;

window.resetDrugRun = resetDrugRun;

window.addAccountsToUpdateList = addAccountsToUpdateList;

window.removeDetectiveSearch = removeDetectiveSearch;
window.removeDetectiveResult = removeDetectiveResult;

window.startDetectiveSearch = async (searcher, target, countries, clearPastSearches) => {
    let attempts = 0;
    const maxAttempts = 3;
    const account = getAccounts()[searcher];
    if (!account) {
        return "The account you selected isn't in MooScript anymore...";
    }

    do {
        attempts++;
        try {
            let auth = mobAuths[searcher];

            if (auth == null) {
                auth = await tryLogin(searcher, account);
                if (!auth) return "Error with logging in your account. Incorrect password?";
            }

            const result = await searchAccount(target, countries, clearPastSearches, searcher);
            if(result !== true) {
                return "There was an error: " + result;
            }
            await addNewDetectiveSearch(searcher, target, countries)

            return true;

        } catch (e) {
            let fetchRes;
            try {
                fetchRes = await getDoc(Routes.TestPage, searcher);
            } catch (innerEx) {
                console.log("Error with connecting to mobstar");
                console.log("Initial error")
                console.error(e);
                console.log("Mobstar connection exception")
                console.error(innerEx);
                await sleep(2000);
            }

            try {
                if (isDead(fetchRes.document)) {
                    return "Your account is dead!";
                }
                else if (isLoggedOut(fetchRes.result)) {
                    await tryLogin(searcher, account);
                } else if (isInJail(fetchRes.result)) {
                    return "Your account is in jail. Try again in a bit.";
                }
                else {
                    console.error("Unknown error with user: " + searcher);
                    console.error(e);
                    console.error(fetchRes);
                    await sleep(2000);
                }
            } catch (innerEx) {
                console.error("Error while handling error with user: " + searcher);
                console.error(innerEx);
                console.error(fetchRes);
                await sleep(2000);
            }
        }


    } while (attempts < maxAttempts);

    return "Something went wrong with logging in your account... try again?";
}

window.login = async (email) => {
    const account = getAccounts()[email];

    let authToken = mobAuths[email];

    try {
        if (authToken == null) {
            authToken = await tryLogin(email, account);
        }

        if (!authToken) {
            return false;
        }
    } catch (e) {
        console.log("ERROR WITH LOGIN", e);
        return false;
    }
    chrome.tabs.create({
        url: "https://www.mobstar.cc"
    }, (tab) => {
        tab.title = account.name;
        tabSessions[tab.id] = email;
    });

    return true;
}

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

        // The requests map needs to be cleaned every once in a while
        if(Math.floor(Math.random() * 5) == 2) {
            const currDate = new Date().valueOf();
            const keys = Object.keys(requests);

            const timeBeforeCleanup = 1000 * 60 * 2;
            for(const key of keys) {
                const dateDifference = currDate - requests[key].date;

                if(dateDifference > timeBeforeCleanup) {
                    delete requests[key];
                }
            }
        }

        for (let email of Object.keys(accounts)) {
            const config = getConfig();
            if (config.updateAccounts.length > 0) {
                break;
            }

            const account = { ...accounts[email], email };
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
                    auth = await tryLogin(email, account);
                    if (!auth) continue;
                }

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
                    fetchRes = await getDoc(Routes.TestPage, account.email);
                } catch (innerEx) {
                    console.log("Error with connecting to mobstar");
                    console.log("Initial error")
                    console.error(e);
                    console.log("Mobstar connection exception")
                    console.error(innerEx);
                    await sleep(5000);
                    continue;
                }

                try {

                    if (isDead(fetchRes.document)) {
                        await updateAccount(email, {
                            dead: true,
                            active: false
                        });
                    }
                    else if (isLoggedOut(fetchRes.result)) {
                        await tryLogin(email, account);
                    } else if (isInJail(fetchRes.result)) {
                        // Do nothing
                    }
                    else {
                        console.error("Unknown error with user: " + email);
                        console.error(e);
                        console.error(fetchRes);
                    }
                } catch (innerEx) {
                    console.error("Error while handling error with user: " + email);
                    console.error(innerEx);
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
                            auth = await tryLogin(email, account);
                            if (!auth) continue;
                        }

                        await performAction(savePlayerInfo, account, 0, 0);
                        attempt = maxAttempts;

                    } catch (e) {
                        let fetchRes;
                        try {
                            fetchRes = await getDoc(Routes.TestPage, email);
                        } catch (innerEx) {
                            console.log("Error with connecting to mobstar");
                            console.log("Initial error")
                            console.error(e);
                            console.log("Mobstar connection exception")
                            console.error(innerEx);
                            await sleep(5000);
                            continue;
                        }

                        try {

                            if (isDead(fetchRes.document)) {
                                await updateAccount(email, {
                                    dead: true,
                                    active: false
                                });
                            }
                            else if (isLoggedOut(fetchRes.result)) {
                                await tryLogin(email, account);
                            } else if (isInJail(fetchRes.result)) {
                                // Do nothing
                            }
                            else {
                                console.error("Unknown error with user: " + email);
                                console.error(e);
                                console.error(fetchRes);
                            }
                        } catch (innerEx) {
                            console.error("Error while handling error with user: " + email);
                            console.error(innerEx);
                            console.error(fetchRes);
                        }
                    }
                } while (attempt < maxAttempts)
            }

            updateConfig({ updateAccounts: [] });
        }

        const detective = getDetective();
        const searching = Object.keys(detective.searching);
        if (searching.length > 0) {
            const foundResults = [];
            for (const searchKey of searching) {
                const search = detective.searching[searchKey];

                const account = accounts[search.searcher];
                if (!account) {
                    await removeDetectiveSearch(searchKey);
                    continue;
                }

                let attempt = 0;
                const maxAttempts = 3;

                do {
                    attempt++;
                    let auth = mobAuths[search.searcher];

                    try {
                        if (auth == null) {
                            auth = await tryLogin(search.searcher, account);
                            if (!auth) continue;
                        }

                        //await performAction(savePlayerInfo, account, 0, 0);
                        const result = await findResult(search.target, search.searcher);
                        if (result) {
                            foundResults.push({ id: searchKey, foundInCountry: result });
                        }
                        attempt = maxAttempts;

                    } catch (e) {
                        let fetchRes;
                        try {
                            fetchRes = await getDoc(Routes.TestPage, search.searcher);
                        } catch (innerEx) {
                            console.log("Error with connecting to mobstar");
                            console.log("Initial error")
                            console.error(e);
                            console.log("Mobstar connection exception")
                            console.error(innerEx);
                            await sleep(5000);
                            continue;
                        }

                        try {

                            if (isDead(fetchRes.document)) {
                                await removeDetectiveSearch(searchKey);
                                attempt = maxAttempts;
                            }
                            else if (isLoggedOut(fetchRes.result)) {
                                await tryLogin(search.searcher, account);
                            } else if (isInJail(fetchRes.result)) {
                                continue;
                            }
                            else {
                                console.error("Unknown error with user: " + search.searcher);
                                console.error(e);
                                console.error(fetchRes);
                            }
                        } catch (innerEx) {
                            console.error("Error while handling error with user: " + search.searcher);
                            console.error(innerEx);
                            console.error(fetchRes);
                        }
                    }
                } while (attempt < maxAttempts)
            }

            if (foundResults.length > 0) {
                await addNewDetectiveFind(foundResults);
            }
        }
    };

    gameLoop(loop, 30)
}

const tryLogin = async (email, account) => {
    let attempt = 0;
    const maxAttempts = 3;
    do {
        const auth = await fetchMobAuth(email, account.password);
        if (auth) {
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

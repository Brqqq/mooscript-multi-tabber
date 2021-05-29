import { postForm, sleep, isLoggedOut, getDoc } from "./actions/utils.js";

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({ url: "index.html" });
});

let accounts = {};
let mobAuths = {};
let tabSessions = {};

// This is a map to know which requestId belongs to which email
// onHeadersReceived doesn't know which email triggered which request. 
// So a few steps before that, we save the requestid and what email triggered it, so onHeadersReceived will also know
let requests = {};


// When a tab is closed, stop tracking it
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabSessions[tabId]) {
        delete tabSessions[tabId];
    }
});

// When a tab creates a new tab/popup, we want to preserve the credentials
// E.g. the domination popup is opened, it still needs the cookies of the session that opened the popup
chrome.webNavigation.onCreatedNavigationTarget.addListener(details => {
    if (details.sourceTabId && tabSessions[details.sourceTabId] != null) {
        tabSessions[details.tabId] = tabSessions[details.sourceTabId];
    }
});

// When a page is loaded of a mobstar tab that's being tracked, set the title of the tab to the player name (if available)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabSessions[tabId] != null && changeInfo.status === 'complete') {
        const account = accounts[tabSessions[tabId]];
        if (account != null && account.name != null) {
            chrome.tabs.executeScript(tabId, {
                code: `document.title = "${account.name}";`
            });
        }
    }
});

// Catch login requests and store the credentials that were passed along.
// We use this for reauthenticating in the future
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (details.url.includes("main/login.php") && details.method === "POST") {
            const hasEmailAndPassword = details.requestBody?.formData?.email != null && details.requestBody?.formData?.password != null;
            if (!hasEmailAndPassword) return;

            const { email, password } = details.requestBody.formData;

            // Store credentials in memory so it can be used to reauthenticate when session expires
            accounts[email] = { password: password[0] };

            tabSessions[details.tabId] = email[0];
            requests[details.requestId] = {
                email: email,
                date: new Date().valueOf()
            };
        }
    },
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "requestBody", "extraHeaders"]
)

// This bit replaces the cookie header that's being sent to the server
// It knows which account triggered the request by either looking for a magic MooScript header or seeing what tab it came from
// It also stores the requestId so onHeadersReceived knows which email is linked to this requestId
// If an auth cookie is linked to an email, that cookie is inserted here
// It is called right before a request is sent
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        const isLoginRequest = details.url.includes("main/login.php") && details.method === "POST";

        const mooscriptHeader = details.requestHeaders.find(header => header.name === "MooScript")

        if (!mooscriptHeader && (isLoginRequest || tabSessions[details.tabId] == null)) {
            return { requestHeaders: details.requestHeaders };
        }

        // If it contains a mooscript header, it means it was an XHR by our script (auto-relogging etc)
        const email = mooscriptHeader ? mooscriptHeader.value : tabSessions[details.tabId];

        requests[details.requestId] = {
            email,
            date: new Date().valueOf()
        };

        const authToken = mobAuths[email];

        if (authToken) {
            for (var i = 0; i < details.requestHeaders.length; i++) {
                if (details.requestHeaders[i].name === "Cookie") {
                    details.requestHeaders[i].value = authToken;
                    break;
                }
            }
        }
        return { requestHeaders: details.requestHeaders };

    },
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "requestHeaders", "extraHeaders"]
);


// This does multiple things
// First it checks if this response belongs to a request that was previously marked as 'to be tracked'
// If it sees you're logged out while being tracked, it auto-logs you back in
// If a Set-Cookie header is given including mob_auth data, it stores that and fetches the account name 
// It also strips the Set-Cookie response header to prevent it from setting cookies at browser level
chrome.webRequest.onHeadersReceived.addListener((details) => {
    if (tabSessions[details.tabId] == null && requests[details.requestId] == null) {
        return { responseHeaders: details.responseHeaders };
    }

    const { email } = requests[details.requestId];

    // Auto-relog
    if (details.url.includes("main/message.php?msgid=1") || details.url.endsWith("mobstar.cc/main/")) {
        const { password } = accounts[email];

        if (password) {
            tryLogin(email, password)
                .catch(console.error);
        }

        delete requests[details.requestId];
        return { responseHeaders: details.responseHeaders };
    }

    const authCookies = details.responseHeaders.filter(header => header.name === "Set-Cookie" && header.value.includes("MOBSTAR_AUTH"));
    if (authCookies.length === 0) {
        delete requests[details.requestId];
        return { responseHeaders: details.responseHeaders };
    }

    if (!email) {
        console.error("Couldn't map response to a matching request!");
        console.error("Headers: ", details.requestHeaders);

        delete requests[details.requestId];
        return { responseHeaders: details.responseHeaders };
    }

    const authCookie = authCookies.find(cookie => !cookie.value.includes("deleted"))

    if (authCookie) {
        const authCookieParts = authCookie.value.split(";");
        //window.currentCookie = authCookieParts[0];
        mobAuths[email] = authCookieParts[0];

    } else {
        // Don't save the "deleted" cookie. It causes some weird infinite redirect issues
        mobAuths[email] = "";
    }

    getDoc("https://www.mobstar.cc/mobstar/main.php", email)
        .then(({ document }) => {
            const h3 = document.querySelector("h3");
            if(h3?.textContent) {
                const user = accounts[email];
                const name = h3.textContent.split("Welcome to Mobstar, ")[1];
                accounts[email] = {
                    ...user,
                    name
                }
            }
        })
    // Strip set-cookie headers so they don't get saved and affect the tabs
    // We manually set the cookie so it doesn't affect us
    details.responseHeaders = details.responseHeaders.filter(header => header.name !== "Set-Cookie");

    delete requests[details.requestId];
    return { responseHeaders: details.responseHeaders };
},
    { urls: ["https://www.mobstar.cc/*"] },
    ["blocking", "responseHeaders", "extraHeaders"]);

var fetchMobAuth = async (email, password) => {
    const fetchResult = await postForm("https://www.mobstar.cc/main/login.php", `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, email, { disableSanitize: true });

    if (isLoggedOut(fetchResult.result)) {
        return false;
    }

    return mobAuths[email];
}

const tryLogin = async (email, password) => {
    let attempt = 0;
    const maxAttempts = 3;
    do {
        const auth = await fetchMobAuth(email, password);
        if (auth) {
            return auth;
        }
        await sleep(1000 * (attempt + 1));
        attempt++;
    } while (attempt < maxAttempts);

    return false;
}

setInterval(() => {
    const currDate = new Date().valueOf();
    const keys = Object.keys(requests);

    const timeBeforeCleanup = 1000 * 60 * 2;
    for (const key of keys) {
        const dateDifference = currDate - requests[key].date;

        if (dateDifference > timeBeforeCleanup) {
            delete requests[key];
        }
    }
}, 1000 * 60 * 10);
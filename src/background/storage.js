let accounts = {};
let drugs = {};
let config = {};
let detective = {};
let sync = {};

export const getFromStorage = (keysToGet) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keysToGet, (result) => {
            if (chrome.runtime.lastError) {
                reject(Error(chrome.runtime.lastError.message));
            } else {
                resolve(result);
            }
        });
    });
}

export const setInStorage = (newValue) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(newValue, () => {
            if (chrome.runtime.lastError) {
                reject(Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        })
    });
}


export const addAccount = async (email, password) => {
    const { accounts } = await getFromStorage("accounts");
    if (accounts != null && accounts[email] != null) {
        return undefined;
    }

    const newAccounts = {
        ...accounts,
        [email]: {
            password,
            active: true,
            dead: false,
            invalidPassword: false,
            enableJailbusting: true,
            enableSmallCrime: true,
            enableGta: true,
            enableCarSelling: true,
            enableItemBuying: true,
            enableDrugRunning: true,
            enableBuyingPbf: false,
            cash: 0,
            rank: "",
            crew: "",
            bullets: 0,
            honor: 0,
            credits: 0,
            payingDays: 0,
            country: "",
            name: "",
            lead: "",
            type: "⭕",
            plane: "",
            previousCrew: "",
            startDate: ""
        }
    };

    return setInStorage({ accounts: newAccounts });
}

export const removeAccount = async (email) => {
    const { accounts } = await getFromStorage("accounts");
    const { [email]: omit, ...rest } = accounts;
    return setInStorage({ accounts: rest });
}

export const updateAccount = async (email, updatedValues) => {
    const { accounts } = await getFromStorage("accounts");
    if (accounts[email] == null) {
        return undefined;
    };

    const updatedAccount = {
        ...accounts[email],
        ...updatedValues
    };

    const newAccounts = {
        ...accounts,
        [email]: updatedAccount
    };

    return setInStorage({ accounts: newAccounts });
}

export const updateAccounts = async (emails, updatedValues) => {
    const { accounts } = await getFromStorage("accounts");

    for (const email of emails) {
        accounts[email] = {
            ...accounts[email],
            ...updatedValues
        }
    }

    return setInStorage({ accounts });
}

export const updateConfig = async (props) => {
    const { config } = await getFromStorage("config");

    const updatedConfig = {
        ...config,
        ...props
    };

    return setInStorage({ config: updatedConfig });
}

export const addAccountsToUpdateList = async (emails) => {
    const newList = [...new Set([...getConfig().updateAccounts, ...emails])];

    return updateConfig({ updateAccounts: newList });
}

export const updateEveryAccount = async (updatedValues) => {
    const { accounts } = await getFromStorage("accounts");
    const arrayOfAccounts = Object.keys(accounts).map(email => ({
        email,
        account: accounts[email]
    }));

    const updatedAccounts = arrayOfAccounts.reduce((acc, curr) => ({
        ...acc,
        [curr.email]: {
            ...curr.account,
            ...updatedValues
        }
    }), {});

    setInStorage({ accounts: updatedAccounts });
}

export const initStorage = async () => {
    const result = await getFromStorage(["accounts", "drugs", "config", "detective", "sync"]);

    accounts = result.accounts || {};
    drugs = result.drugs || {
        run1: {
            country: "",
            date: "",
            prices: {
                Weed: 0,
                XTC: 0,
                LSD: 0,
                Speed: 0,
                Shrooms: 0,
                Heroin: 0,
                Cocaine: 0,
                Fireworks: 0
            }
        },
        run2: {
            country: "",
            date: "",
            prices: {
                Weed: 0,
                XTC: 0,
                LSD: 0,
                Speed: 0,
                Shrooms: 0,
                Heroin: 0,
                Cocaine: 0,
                Fireworks: 0
            }
        }
    };

    config = {
        updateAccounts: [],
        dontSellCars: [],
        drugrunUrl: "http://extension.mooscript.com/api/drug-run",
        drugrunType: "stats", // "stats" | "api"
        drugrunApiError: "",
        ...result.config
    };

    detective = {
        searching: {},
        found: {}
    };

    sync = result.sync || {
        url: "",
        username: "",
        password: "",
        serverName: ""
    };

    await setInStorage({ detective, config });

    chrome.storage.local.onChanged.addListener((changes) => {
        if (changes.accounts != null) {
            accounts = changes.accounts.newValue;
        }
        if (changes.drugs != null) {
            drugs = changes.drugs.newValue;
        }
        if (changes.config != null) {
            config = changes.config.newValue;
        }
        if (changes.detective != null) {
            detective = changes.detective.newValue;
        }
        if(changes.sync != null) {
            sync = changes.sync.newValue;
        }
    });
}
function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

export const removeDetectiveSearch = async (id) => {
    const { detective } = await getFromStorage("detective");

    delete detective.searching[id];

    return setInStorage({ detective });
}

export const removeDetectiveResult = async (id) => {
    const { detective } = await getFromStorage("detective");

    delete detective.found[id];

    return setInStorage({ detective });
}

export const addNewDetectiveSearch = async (searcher, target, countries) => {
    const { detective } = await getFromStorage("detective");
    const id = createUUID();

    detective.searching[id] = {
        searcher,
        target,
        countries,
        isoDate: new Date().toISOString()
    };

    return setInStorage({ detective });
}

export const addNewDetectiveFind = async (results) => {
    const { detective } = await getFromStorage("detective");

    for (const result of results) {
        const { id, foundInCountry } = result;

        const search = detective.searching[id];
        delete detective.searching[id];

        detective.found[id] = {
            searcher: search.searcher,
            target: search.target,
            foundOn: new Date().toISOString(),
            foundIn: foundInCountry
        };
    }

    return setInStorage({ detective });
}

export const updateDrugRunPrices = (country1, drugPrices1, country2, drugPrices2) => {
    const currentDrugInfo = JSON.parse(JSON.stringify(getDrugsInfo()));
    [{ country: country1, prices: drugPrices1 }, { country: country2, prices: drugPrices2 }]
        .forEach(e => {
            if (currentDrugInfo.run1.country === e.country) {
                currentDrugInfo.run1.prices = e.prices;
            } else if (currentDrugInfo.run2.country === e.country) {
                currentDrugInfo.run2.prices = e.prices;
            }
        });

    return setInStorage({ drugs: currentDrugInfo });
}

export const updateRun = (runNr, data) => {
    const drugInfo = JSON.parse(JSON.stringify(getDrugsInfo()));
    drugInfo["run" + runNr] = data;

    return setInStorage({ drugs: drugInfo });
}

export const resetDrugRun = async () => {
    const { drugs } = await getFromStorage("drugs");
    drugs.run1.country = "";
    drugs.run1.date = "";
    drugs.run2.country = "";
    drugs.run2.date = "";

    await setInStorage({ drugs });
}

export const setSync = async (url, username, password, serverName) => {
    await setInStorage({
        sync: {
            url,
            username,
            password,
            serverName
        }
    })
}

export const setDrugrunType = async (drugrunType, drugrunUrl) => {
    const { config } = await getFromStorage("config");
    await setInStorage({
        config: {
            ...config,
            drugrunUrl,
            drugrunType
        }
    })
}

export const setDrugrunError = async (message) => {
    const { config } = await getFromStorage("config");
    await setInStorage({
        config: {
            ...config,
            drugrunApiError: message
        }
    })
}

export const getAccounts = () => accounts;
export const getDrugsInfo = () => drugs;
export const getConfig = () => config;
export const getDetective = () => detective;
export const getSync = () => sync;
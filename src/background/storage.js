let accounts = {};
let drugs = {};

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
            enableDrugRunFinding: true
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
    const result = await getFromStorage(["accounts", "drugs"]);

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

    chrome.storage.local.onChanged.addListener((changes) => {
        if (changes.accounts != null) {
            accounts = changes.accounts.newValue;
        }
        if (changes.drugs != null) {
            drugs = changes.drugs.newValue;
        }
    });
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



export const getAccounts = () => accounts;
export const getDrugsInfo = () => drugs;
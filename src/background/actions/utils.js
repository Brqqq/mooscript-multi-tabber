import { Routes } from "./routes.js";

const sanitize = (textContent) => encodeURIComponent(textContent)
    .replace(/%20/g, "+")
    .replace(/%26/g, "&")
    .replace(/%3D/g, "=")
    .replace(/%5B/g, "[")
    .replace(/%5D/g, "]")

export const getDoc = async (url) => {
    const fetchCall = await fetch(url);
    const fetchedText = await fetchCall.text();

    const domParser = new DOMParser();
    const doc = domParser.parseFromString(fetchedText, 'text/html');

    doc.actualUrl = fetchCall.url;

    return {
        document: doc,
        result: fetchCall
    };
}

export const postForm = async (url, postBody, options = {}) => {
    const fetchCall = await fetch(url, {
        method: "post",
        body: options.disableSanitize ? postBody : sanitize(postBody),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    const fetchedText = await fetchCall.text();

    const domParser = new DOMParser();
    const doc = domParser.parseFromString(fetchedText, 'text/html');

    doc.actualUrl = fetchCall.url;

    return {
        document: doc,
        result: fetchCall
    };
}

export const getTopTextNode = (el) => {
    let firstText = "";
    for (var i = 0; i < el.childNodes.length; i++) {
        const curNode = el.childNodes[i];
        if (curNode.nodeName === "#text") {
            firstText += curNode.nodeValue;
        }
    }

    return firstText.trim();
}

export const getCurrentCountry = (doc) => {
    return doc.querySelector("#currcoun").innerText;
}

export const parseManageCarsList = (doc) => {
    // {
    //     id: ""
    //     currentCountry: "",
    //     originalCountry: "",
    //     damage: "",
    //     value: "",
    //     vehicleName: ""
    // }

    const carsTable = doc.querySelectorAll("#cars tbody")[1];
    const carRowsArray = Array.from(carsTable.children).slice(2);

    const cars = carRowsArray.map(row => {
        const vehicleName = getTopTextNode(row.children[0]).trim();
        const details = row.querySelector("tbody");
        const boldedText = details.querySelectorAll("b");
        const damage = +(boldedText[0].innerText.replace("%", ""));
        const originalCountry = boldedText[1].innerText;
        let value = 0;
        let currentCountry;
        let specialCar = false;
        if (boldedText[3] != null) {
            value = +boldedText[2].innerText.replace("€", "").replace(",", "").trim();
            currentCountry = boldedText[3].innerText;
        }
        else { // Happens if the 'value' field is missing, like with mission cars.
            currentCountry = boldedText[2].innerText;
            specialCar = true;
        }

        const select = row.querySelector("select");
        const id = select != null ? +select.name.replace(/\D/g, "") : undefined;

        return {
            id,
            currentCountry,
            originalCountry,
            damage,
            value,
            vehicleName,
            specialCar
        };
    });

    return cars;
}

/**
     *  filteroptions: none | shipping | painted | country_** | car_*
        sortoptions: default | location | car | damage | value | painted
        sortdir: desc | asc
        setfilter: Set filter/sort type
     */
export const getGarageFilterBody = (filterOptions, sortOptions, sortDir) => {
    const setfilter = "Set filter/sort type";
    return `filteroptions=${filterOptions}&sortoptions=${sortOptions}&sortdir=${sortDir}&setfilter=${setfilter}`;
}

export const garageFromCountry = (garageRoute, country) => {
    const countryMap = {
        "China": "country_8",
        "Colombia": "country_1",
        "Cuba": "country_16",
        "Great Britain": "country_12",
        "Italy": "country_5",
        "Japan": "country_6",
        "Netherlands": "country_4",
        "Russia": "country_7",
        "United States": "country_3"
    };

    const mappedCountry = countryMap[country];
    if (mappedCountry == null) throw new Error("Invalid country");

    const postBody = getGarageFilterBody(mappedCountry, "default", "asc");

    return postForm(garageRoute, postBody);
}

export const getDrugTypes = () => ({
    Weed: "Nederwiet",
    XTC: "XTC",
    LSD: "LSD",
    Speed: "Speed",
    Shrooms: "Paddos",
    Heroin: "Opium",

    // Yeah I know this looks wrong, but that's just how they coded it...
    Cocaine: "Fireworks",
    Fireworks: "OptDrug1"
});

export const parseDrugsWindow = (drugsDoc) => {
    const tableBody = drugsDoc.querySelector("form tbody");

    let children = Array.from(tableBody.children);
    children = children.slice(1, children.length - 1);

    return children.map((drugRow) => ({
        name: drugRow.children[0].innerText,
        price: +drugRow.children[2].innerText.match(/\d+/)[0],
        carrying: +drugRow.children[3].innerText
    }));
}

/**
 * statsTableBody is the <tbody> element with all the stats
 */
export const parseStatsPage = (statsTableBody) => {
    let statRows = Array.from(statsTableBody.children).slice(2);
    return statRows.map(statRow => ({
        country: statRow.children[0].innerText,
        percentage: +statRow.children[2].innerText.match(/\d+/)
    }));
}

/**
* 
* buyOrSell: "Buy" : "Sell"
* drugs: Object like { "XTC": 2, "Fireworks": 3}
*/
export const buildDrugSaleBody = (buyOrSell, drugs) => {
    const drugTypes = getDrugTypes();
    const action = buyOrSell === "Buy" ? "buy=Buy" : "sell=Sell";

    const drugsBody = Object.keys(drugs).map(drugName => `${drugTypes[drugName]}=${drugs[drugName]}`).join("&");

    return drugsBody + "&" + action;
}

/**
 * Document must contain info like rank, weapon etc
 */
export const getCash = (docWithStats) => {
    return +docWithStats.querySelectorAll("body > script:nth-child(7)")[0].innerText.match(/&euro;&nbsp;.*/)[0].replace(/\D/g, "");
}

export const getPlayerInfo = async () => {
    const { document: pointShopDoc } = await getDoc(Routes.PointsShop);
    const { document: accountsDoc } = await postForm(Routes.PersonalAjax, "page=1&_");
    const { document: leadDoc } = await getDoc(Routes.LeadFactory);

    // You might think: why don't you get the cash/rank/bullets/etc from that table on the top of most pages? Or just eval the JS that contains the data? Instead of the convoluted BS
    // Well, my dear imaginary asker, that table gets added dynamically with JS. We don't render the page, only get the raw HTML. So that table will be empty.
    // Chrome extensions aren't allowed to call `eval` unless we hash-check the code. For good reason. Considering the data is dynamic, we cannot have a predetermined hash.
    // So instead we have to parse the JS on the page as text like a pleb

    const lead = leadDoc.querySelectorAll("form > b")[0];
    const crew = pointShopDoc.querySelectorAll("body > script:nth-child(7)")[0].innerText.match(/label:"Crew", value:"(.*?)"/)[1].trim();
    // When there is a crew, it's wrapped inside anchor tags. And yes I use regex to extract the name. Deal with it.
    const crewName = crew === "None" ? crew : crew.match(/>(.*?)</)[1];
    const isPaying = accountsDoc.querySelectorAll(".userprof > tbody > tr > td")[8].innerText.trim() === "Yes";

    return {
        cash: getCash(pointShopDoc),
        rank: pointShopDoc.querySelectorAll("body > script:nth-child(7)")[0].innerText.match(/label:"Rank", value:"(.*?)"/)[1],
        bullets: +pointShopDoc.querySelectorAll("body > script:nth-child(7)")[0].innerText.match(/&nbsp;\((\d+)/)[1],
        crew: crewName,

        honor: +pointShopDoc.querySelectorAll("#text_container > table.userprof > tbody > tr > td.footer")[0].innerText.replace(/,/g, "").match(/\d+/)[0],
        credits: +pointShopDoc.querySelectorAll("#text_container > table.userprof > tbody > tr > td.footer")[2].innerText.replace(/,/g, "").match(/\d+/)[0],
        payingDays: isPaying ? accountsDoc.querySelectorAll(".userprof > tbody > tr > td")[10].innerText.match(/\d+/)[0] : 0,
        country: getCurrentCountry(pointShopDoc),
        email: accountsDoc.querySelectorAll(".userprof > tbody > tr > td")[2].innerText,
        name: accountsDoc.querySelectorAll(".userprof > tbody > tr > td")[4].innerText,
        lead: lead ? +lead.innerText : "No lead factory"
    }
}

export const buildDrugPriceMap = (drugsPage) => {
    const drugsData = parseDrugsWindow(drugsPage);
    return drugsData.reduce((acc, drugInfo) => {
        return { ...acc, [drugInfo.name]: drugInfo.price }
    }, {});
}

export const getBestDrug = (nextCountryPrices, currentPrices) => {
    return Object.keys(nextCountryPrices).map(drugName => ({
        drugName,
        profit: nextCountryPrices[drugName] - currentPrices[drugName]
    }))
        .reduce((bestDrug, currDrug) => {
            if (currDrug.profit > bestDrug.profit) {
                return currDrug;
            }
            return bestDrug;
        }, { drugName: "", profit: 0 })
        .drugName
}


export const getMessages = async (inboxUrl) => {
    const { document: inboxDoc } = await getDoc(inboxUrl);

    const messageTables = Array.from(inboxDoc.querySelectorAll(".message"));
    const messages = messageTables.map(el => {
        const tdEls = el.querySelectorAll("td");

        return {
            from: tdEls[0].innerText,
            message: tdEls[1].innerHTML
        };
    })

    return messages;
}


export const isDead = (document) => {
    return document.title === "Dead";
}

export const isLoggedOut = (fetchResult) => {
    return fetchResult.url.includes(".cc/main/")
}

export const isInJail = (fetchResult) => {
    return fetchResult.url === Routes.InJail;
}

export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
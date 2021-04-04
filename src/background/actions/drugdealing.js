import { Routes } from "./routes.js"
import { getDrugsInfo, updateDrugRunPrices } from "../storage.js"
import { getDoc, getCurrentCountry, parseDrugsWindow, getBestDrug, postForm, getCash, buildDrugSaleBody, buildDrugPriceMap } from "./utils.js";

const extraTime = 10000
const successfulCooldown = (45 * 60 * 1000) + extraTime;

const rebuyCooldown = (2 * 60 * 1000) + 5000;

const unknownIssueCooldown = 15 * 60 * 1000;

const noMoneyCooldown = 15 * 60 * 1000;

export const doDrugDeal = async (account) => {
    const drugsInfo = getDrugsInfo();

    const today = moment().tz("Europe/Amsterdam").format("YYYY-MM-DD");

    const { run1, run2 } = drugsInfo;

    if (run1.date !== today || run2.date !== today) {
        return unknownIssueCooldown;
    }

    const { document: flightsPage } = await getDoc(Routes.Flights, account.email);
    if (flightsPage.documentElement.innerText.includes("No flights are leaving at the moment")) {
        return unknownIssueCooldown;
    }

    const { document: drugsPage } = await getDoc(Routes.Drugs, account.email);
    const currentCountry = getCurrentCountry(drugsPage);

    // Determine the next run country
    let nextRun;
    if (currentCountry !== run1.country) {
        nextRun = run1;
    } else {
        nextRun = run2;
    }

    // First make a note of our inventory
    const maxCarry = +drugsPage.querySelector("i").innerText.match(/\d+/);
    const drugsList = parseDrugsWindow(drugsPage);
    const currentDrugPrices = drugsList.reduce((acc, drugInfo) => {
        return { ...acc, [drugInfo.name]: drugInfo.price }
    }, {});

    const bestDrugToBuy = getBestDrug(nextRun.prices, currentDrugPrices);

    // If we are currently carrying any other drug, we must sell that first
    // However, this causes a 2 min cooldown on buying drugs so we must abort after
    const drugSellMap = drugsList.reduce((acc, drugInfo) => {
        if (drugInfo.carrying === 0 || drugInfo.name === bestDrugToBuy) return acc;

        return { ...acc, [drugInfo.name]: drugInfo.carrying }
    }, {});

    if (Object.keys(drugSellMap).length > 0) {
        const sellBody = buildDrugSaleBody("Sell", drugSellMap);
        await postForm(Routes.Drugs, sellBody, account.email);
        return rebuyCooldown;
    }

    // Now we are sure we are either carrying either nothing or only the best drug
    // So we can buy the drug we actually want
    const bestDrugData = drugsList.find(d => d.name === bestDrugToBuy);
    const quantityOfCarryingBestDrug = bestDrugData.carrying;
    const bestDrugPrice = bestDrugData.price;
    const cash = getCash(drugsPage);

    // We buy how many we need, but if we don't have enough money, we buy as much as we can
    const howManyToBuy = Math.min(maxCarry - quantityOfCarryingBestDrug, Math.floor(cash / bestDrugPrice));
    const howManyWeShouldHave = howManyToBuy + quantityOfCarryingBestDrug;

    // We have no money to buy any drugs at all
    if (howManyWeShouldHave === 0) {
        return noMoneyCooldown;
    }

    if (howManyToBuy > 0) {
        const buyMap = { [bestDrugToBuy]: howManyToBuy };
        const buyBody = buildDrugSaleBody("Buy", buyMap);
        const { document: result } = await postForm(Routes.Drugs, buyBody, account.email);
        const newCarryingDrugs = parseDrugsWindow(result);
        if (newCarryingDrugs.find(d => d.name === bestDrugToBuy).carrying !== howManyWeShouldHave) {
            return rebuyCooldown;
        }
    }

    // Fly to the next country
    // It's possible we don't have enough money for a flight. 
    const flightBody = "flyto=" + nextRun.country;
    const { document: flightResult } = await postForm(Routes.Flights, flightBody, account.email);
    if (flightResult.documentElement.innerText.includes("You don't have enough cash")) {
        return noMoneyCooldown;
    }

    // Sell the drugs
    const sellBestDrugMap = { [bestDrugToBuy]: maxCarry };
    const sellBestDrugBody = buildDrugSaleBody("Sell", sellBestDrugMap);
    const { document: newDrugPage } = await postForm(Routes.Drugs, sellBestDrugBody, account.email);

    await updateDrugRunPrices(currentCountry, buildDrugPriceMap(drugsPage), nextRun.country, buildDrugPriceMap(newDrugPage));

    const airportCooldownLine = flightsPage.documentElement.innerHTML.match(/id: 'airport'.*/);
    if(airportCooldownLine) {
        const cooldown = airportCooldownLine[0].match(/(\d+)(?!.*\d)/); // Get last number in the line
        if(cooldown) {
            return (1000 * +cooldown[0]) + 5000
        }
    }
    return successfulCooldown;
}
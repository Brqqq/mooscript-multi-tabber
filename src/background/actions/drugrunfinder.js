import { Routes } from "./routes.js"
import { getDrugsInfo, updateRun } from "../storage.js"
import { getDoc, getCurrentCountry, postForm, getCash, buildDrugPriceMap, parseStatsPage } from "./utils.js";

const noFlightCooldown = 5 * 60 * 1000;
const drugRunUncertainCooldown = 15 * 60 * 1000;
const untilNextFlightCooldown = (45 * 60 * 1000) + 15000;
const noCashCooldown = 15 * 60 * 1000;
const extraTime = 10000
const successfulCooldown = (45 * 60 * 1000) + extraTime;

export const findDrugRun = async (account) => {
    const drugsData = getDrugsInfo();
    const today = moment().tz("Europe/Amsterdam").format("YYYY-MM-DD");

    // No need to do anything if all drug info is uptodate

    const updateRun1 = drugsData.run1.date !== today;
    const updateRun2 = drugsData.run2.date !== today;

    const msUntilNextDay = moment().tz("Europe/Amsterdam").add(1, "day").startOf("day").valueOf() - moment().valueOf() + 5000;

    if (!updateRun1 && !updateRun2) {
        return msUntilNextDay;
    }

    const run1Country = updateRun1 ? "Unknown" : drugsData.run1.country;
    const run2Country = updateRun2 ? "Unknown" : drugsData.run2.country;

    const drugRunFindAfterTime = moment().tz("Europe/Amsterdam").startOf("day").add(1, "hour");


    if (moment().isBefore(drugRunFindAfterTime)) {
        return drugRunFindAfterTime.valueOf() - moment().valueOf() + 10000;
    }

    const { document: statsDoc } = await getDoc(Routes.Stats, account.email);
    const statsTableBody = statsDoc.querySelectorAll("table.userprof tbody")[6];
    const stats = parseStatsPage(statsTableBody);

    const twoHighestPopulatedStatRows = stats.sort((a, b) => b.percentage - a.percentage).slice(0, 2);
    const combinedPercentage = twoHighestPopulatedStatRows[0].percentage + twoHighestPopulatedStatRows[1].percentage;

    if (combinedPercentage < 60) {
        return drugRunUncertainCooldown;
    }

    const { document: flightsPage } = await getDoc(Routes.Flights, account.email);
    const cash = getCash(flightsPage);
    if (cash < 2000) {
        return noCashCooldown;
    }
    let countryToFlyTo;

    // We make assumptions here:
    // - It's never possible for run2 to be set but run1 isn't
    // - If run1 is set, it must be correct.
    // If run1 isn't known, it means run2 is also not known. Therefore it doesn't matter which of the 2 most populated countries we choose
    if (run1Country === "Unknown") countryToFlyTo = twoHighestPopulatedStatRows[0].country;

    // If run1 is the most populated country atm, then run2 should be the 2nd most populated
    else if (run1Country === twoHighestPopulatedStatRows[0].country) countryToFlyTo = twoHighestPopulatedStatRows[1].country;

    // If run1 isn't the most populated country, it means it's the 2nd most populated country. So run2 should be the most populated country
    else countryToFlyTo = twoHighestPopulatedStatRows[0].country;

    const currentCountry = getCurrentCountry(flightsPage);

    if (countryToFlyTo !== currentCountry) {
        if (flightsPage.documentElement.innerText.includes("No flights are leaving at the moment")) {
            return noFlightCooldown;
        }

        const flightBody = "flyto=" + countryToFlyTo;

        await postForm(Routes.Flights, flightBody, account.email)
    }

    const { document: drugsPage } = await getDoc(Routes.Drugs, account.email);
    const drugPriceMap = buildDrugPriceMap(drugsPage);

    if (updateRun1) {
        updateRun(1, {
            country: countryToFlyTo,
            date: today,
            prices: drugPriceMap
        });
    } else if (updateRun2) {
        updateRun(2, {
            country: countryToFlyTo,
            date: today,
            prices: drugPriceMap
        });
    }


    return successfulCooldown
}
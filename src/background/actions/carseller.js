import { getDoc, postForm, parseManageCarsList, getCurrentCountry, garageFromCountry } from "./utils.js";
import { Routes } from "./routes.js";

// 2 hrs cooldown
const cooldownInMs = 120 * 60 * 1000;

export const sellCars = async (account) => {
    //TODO: dontsellcarslist from config
    const dontSellCarsList = ["Armored Van", "Chrysler ME412"];
    const { document: garagePage } = await getDoc(Routes.ManageCars, account.email);
    const currentCountry = getCurrentCountry(garagePage);

    const { document: garageDoc } = await garageFromCountry(Routes.ManageCars, currentCountry, account.email);
    let noCarsLeftToSell = false;
    let currentPage = garageDoc;

    const maxIterations = 20;
    let iteration = 0;

    do {
        const allCars = parseManageCarsList(currentPage);
        const paginationInfo = currentPage.querySelectorAll(".footer")[4].innerText;
        const [currentPageNr, totalPages] = paginationInfo.match(/\d+/g);
        const offset = ((+currentPageNr) - 1) * 30;

        const carsThatCanBeSold = allCars.filter(car =>
            car.currentCountry !== car.originalCountry &&
            car.currentCountry === currentCountry &&
            !car.specialCar &&
            !dontSellCarsList.includes(car.vehicleName));

        if (carsThatCanBeSold.length > 0) {
            const body = carsThatCanBeSold.map(car => {
                return `action[${car.id}]=sell`;
            }).join("&");

            currentPage = (await postForm(Routes.ManageCars, body + "&offset=" + offset, account.email)).document;
        } else if (currentPageNr === totalPages) {
            noCarsLeftToSell = true;
        } else {
            const newOffset = offset + 30;
            currentPage = (await postForm(Routes.ManageCars + "?offset=" + newOffset, "", account.email)).document;
        }
        iteration++;

    } while (!noCarsLeftToSell || (iteration < maxIterations));

    return cooldownInMs;
}
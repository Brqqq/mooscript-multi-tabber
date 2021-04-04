import { Routes } from "./routes.js"
import { getDoc, postForm, parseManageCarsList, getCurrentCountry } from "./utils.js";
import { getDrugsInfo } from "../storage.js"

const cooldownInMs = 7 * 60 * 1000;
const extraTime = 5000;

const totalCooldown = cooldownInMs + extraTime;

export const doGta = async (account) => {
    const drugsData = getDrugsInfo();
    let shippingCountries = [
        drugsData.run1.country || "Colombia",
        drugsData.run2.country || "United States"
    ];
    const { document: gtaPageDoc } = await getDoc(Routes.CarStealing, account.email);

    if (gtaPageDoc.documentElement.innerText.includes("is only available for paying members")) {
        return totalCooldown;
    }

    if (gtaPageDoc.documentElement.innerText.includes("You have tried to steal a car recently")) {
        return totalCooldown;
    }

    let bestOption = {
        index: -1,
        percentage: -1
    };

    const rows = gtaPageDoc.querySelectorAll("form tr")
    for (let i = 1; i < 5; i++) {
        const tds = rows[i].querySelectorAll("td");
        const percentageText = tds[1].innerText;
        const percentageValue = +percentageText.match(/\d*/)[0];

        if (percentageValue > bestOption.percentage) {
            bestOption = {
                index: i - 1,
                percentage: percentageValue
            };
        }
    }

    const { document: stealResultDoc } = await postForm(Routes.CarStealing, `stealcar=${bestOption.index}&takefromcrewname=`, account.email);

    // Success
    if (stealResultDoc.actualUrl === Routes.ManageCars) {
        const valuableCars = ["Lamborghini Gallardo", "Armored Van", "Chrysler ME412"];

        const allCars = parseManageCarsList(stealResultDoc);
        const currentCountry = getCurrentCountry(stealResultDoc);
        const countryToShipTo = (currentCountry === shippingCountries[0]) ? shippingCountries[1] : shippingCountries[0];

        const stolenCars = allCars.filter(car =>
            car.currentCountry === car.originalCountry &&
            car.currentCountry === currentCountry &&
            (car.value > 2000 || valuableCars.includes(car.vehicleName)));
        if (stolenCars.length > 0) {
            const body = stolenCars.map(car => {
                const marketPlace = `marketplace[${car.id}]=`;
                let action = `action[${car.id}]=${countryToShipTo}`;

                return marketPlace + "&" + action;
            }).join("&");

            await postForm(Routes.ManageCars, body, account.email);
        }
    }

    return totalCooldown;
}
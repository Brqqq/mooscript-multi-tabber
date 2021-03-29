import { postForm, getDoc } from "../actions/utils.js";
import { Routes } from "../actions/routes.js";

export const searchAccount = async (target, countries, clearPastSearches) => {
    const sanitizeSpaces = (str) => str.replace(/\s/g, "+");
    const countriesBody = countries.map(c => `searchcountries%5B%5D=${sanitizeSpaces(c)}`).join("&");

    if (clearPastSearches) {
        await getDoc(Routes.Detective + "?action=clear");
    }

    for (let i = 0; i < 50; i++) {
        await postForm(
            Routes.Detective,
            `findname=${sanitizeSpaces(target)}&${countriesBody}&findtime=1`,
            { disableSanitize: true } // Because it contains [] that are encoded that must remain untouched
        );
    }
}
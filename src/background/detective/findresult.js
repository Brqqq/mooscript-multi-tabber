import { getDoc } from "../actions/utils.js";
import { Routes } from "../actions/routes.js";

export const findResult = async (target, email) => {
    const { document } = await getDoc(Routes.Detective, email);

    const resultTable = document.querySelectorAll("table")[2];

    const rows = Array.from(resultTable.querySelectorAll("tr")).slice(2);

    for(const row of rows) {
        if(row.children[0].innerText?.trim() === target) {
            const searchResult = row.children[3].innerText;
            if(searchResult?.includes("Found!")) {
                return searchResult.match(/(?<=In )(.*)(?= at 20)/)[0].trim();
            }
        }
    }

    return false;
}
import { Routes } from "./routes.js"
import { getDoc, postForm } from "./utils.js";

const cooldownInMs = 120 * 1000;
const extraTime = 5000;
const totalCooldown = cooldownInMs + extraTime;

export const doSmallCrime = async (account) => {
    const { document: crimePageDoc } = await getDoc(Routes.SmallCrime, account.email);
    const crimeDescription = crimePageDoc.querySelector("#text_container").innerText;

    if (crimeDescription.includes("You have comitted a crime recently")) {
        return totalCooldown;
    }

    const highestCrimeOption = crimePageDoc.querySelector("input[type=radio]").value;
    
    await postForm(Routes.SmallCrime, "crime2=" + highestCrimeOption, account.email);

    return totalCooldown;
}
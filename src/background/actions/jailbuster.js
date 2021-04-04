import { getDoc } from "./utils.js";
import { Routes } from "./routes.js";

const maxBustingPercentageCooldown = 2 * 60 * 1000;
const nobodyInJailToBustCooldown = 10 * 60 * 1000;
const bustingCooldown = 10 * 60 * 1000;

export const doJailbust = async (account) => {
    for (let attempt = 0; attempt < 10; attempt++) {
        const { document: jailDoc } = await getDoc(Routes.Jail, account.email);
        const bustPercentage = jailDoc.documentElement.innerText.match(/\d+%/)[0];
        if (bustPercentage === "100%") {
            return maxBustingPercentageCooldown;
        }

        const firstPersonToBust = Array.from(jailDoc.querySelectorAll("a.black")).find(el => el.innerText === "Bust out");

        if (firstPersonToBust == null) {
            return nobodyInJailToBustCooldown;
        }

        const { document: bustResult } = await getDoc(Routes.MainPage + firstPersonToBust.pathname + firstPersonToBust.search, account.email);

        if (bustResult.documentElement.innerText.includes("Busted pal!")) {
            return bustingCooldown;
        }

        const message = bustResult.querySelector("font").innerText;
        if (message.includes("Success!")) {
            return bustingCooldown;
        }
    }

    // It failed to bust someone out 10 times
    return bustingCooldown;
}
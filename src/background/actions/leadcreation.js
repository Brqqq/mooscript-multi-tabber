import { getDoc, postForm } from "./utils.js";
import { Routes } from "./routes.js";

// 1 hrs cooldown
const cooldown = 60 * 60 * 1000;
const extraTime = 10000;
const totalCooldown = cooldown + extraTime;

export const createLead = async () => {
    const { document: leadFactoryDoc } = await getDoc(Routes.LeadFactory);
    const doesntOwnLeadFactory = leadFactoryDoc.querySelector("p.feedback").innerText.includes("You don't own a lead factory,");

    if (doesntOwnLeadFactory) {
        return totalCooldown;
    }

    const oreAndLeadText = leadFactoryDoc.querySelector("form").innerText;
    const currentOreKg = +(oreAndLeadText.match(/\d+/)[0]);

    const maxOre = +(leadFactoryDoc.querySelectorAll("p.feedback b")[1].innerText);

    const missingOre = maxOre - currentOreKg;

    if (missingOre > 0) {
        const orePurchaseBody = `poor=0&reasonable=0&good=${missingOre}&buy=Buy`
        await postForm(Routes.LeadFactory, orePurchaseBody);
    }

    const convertLeadBody = "convert=Convert+all+ore+to+lead";
    await postForm(Routes.LeadFactory, convertLeadBody);
    
    return totalCooldown;
}
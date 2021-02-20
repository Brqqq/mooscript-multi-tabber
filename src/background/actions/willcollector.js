import { Routes } from "./routes.js"
import { getDoc, postForm } from "./utils.js";

const cooldown = 1000 * 60 * 5;

const successfulCollectionCooldown = 1000 * 60 * 60;
export const collectWill = async () => {
    const { document: willDoc } = await postForm(Routes.PersonalAjax, "page=5&_=");

    const willNrEl = willDoc.querySelectorAll("table")[1].querySelectorAll("td")[8];
    if (willNrEl == null) {
        return cooldown;
    }
    const willNrText = willNrEl.innerText;
    if (willNrText.includes("claimed")) {
        return cooldown;
    }

    const willNr = +willNrText.trim();

    //await scriptHelpers.postFormAndGetDoc(myAccountUrl, `page=5&willnumber=${willNr}&collectwill=Collect will&_=`);
    await postForm(Routes.PersonalAjax, `page=5&willnumber=${willNr}&collectwill=Collect will&_=`);

    return successfulCollectionCooldown;
}
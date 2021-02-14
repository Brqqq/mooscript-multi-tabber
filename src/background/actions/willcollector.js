import { Routes } from "./routes.js"
import { getDoc, postForm } from "./utils.js";

export const collectWill = async () => {
    const { document: willDoc } = await postForm(Routes.PersonalAjax, "page=5&_=");

    const willNrEl = willDoc.querySelectorAll("table")[1].querySelectorAll("td")[8];
    if (willNrEl == null) {
        return false;
    }
    const willNrText = willNrEl.innerText;
    if (willNrText.includes("claimed")) {
        return false;
    }

    const willNr = +willNrText.trim();

    //await scriptHelpers.postFormAndGetDoc(myAccountUrl, `page=5&willnumber=${willNr}&collectwill=Collect will&_=`);
    await postForm(Routes.PersonalAjax, `page=5&willnumber=${willNr}&collectwill=Collect will&_=`);

    return true;
}
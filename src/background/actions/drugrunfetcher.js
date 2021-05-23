import { getDrugsInfo, getConfig, setDrugrunError, updateRun } from "../storage.js";

const drugrunValidCooldown = 2 * 60 * 60 * 1000;
const failedToFetchCooldown = 1000 * 60 * 15;
let lastFetch = moment.utc(0);
const defaultPriceMap = () => ({
    Weed: 0,
    XTC: 0,
    LSD: 0,
    Speed: 0,
    Shrooms: 0,
    Heroin: 0,
    Cocaine: 0,
    Fireworks: 0
});

export const fetchDrugRun = async (account) => {
    const drugsData = getDrugsInfo();
    const now = moment().tz("Europe/Amsterdam");
    const nextDay = now.clone().add(1, "day").startOf("day");
    const hoursUntilNextDay = nextDay.diff(now, "hours");
    const todayTimestamp = now.format("YYYY-MM-DD");

    const updateRun1 = drugsData.run1.date !== todayTimestamp;
    const updateRun2 = drugsData.run2.date !== todayTimestamp;

    const refetch = now.diff(lastFetch, "hours") > 2;

    if(hoursUntilNextDay < 2) {
        return nextDay.diff(now, "milliseconds") + (1000 * 60 * 5);
    }

    if(!updateRun1 && !updateRun2 && !refetch) {
        return drugrunValidCooldown;
    }

    const config = getConfig();

    try {
        const fetchRes = await fetch(config.drugrunUrl, {
            method: "POST",
            headers: {
                "MooScript": "0"
            }
        });
        const res = await fetchRes.json();
        if(
            Array.isArray(res) && 
            res.length === 2 &&
            res[0].country != null && typeof res[0].country === "string" &&
            res[0].drug != null && typeof res[0].drug === "string"  &&
            res[1].country != null && typeof res[1].country === "string" &&
            res[1].drug != null && typeof res[1].drug === "string"
        ) {
            await updateRun(1, {
                date: todayTimestamp,
                country: res[0].country,
                prices: {
                    ...defaultPriceMap(),
                    [res[0].drug]: 100000
                }
            });

            await updateRun(2, {
                date: todayTimestamp,
                country: res[1].country,
                prices: {
                    ...defaultPriceMap(),
                    [res[1].drug]: 100000
                }
            });

            if(config.drugrunApiError) {
                setDrugrunError("");
            }

            lastFetch = moment.utc();
        } else {
            throw new Error("The server returned an unknown shape of data");
        }
    } catch(e) {
        await setDrugrunError("There was an error retrieving the drug run info: " + e);
        return failedToFetchCooldown;
    }

    return drugrunValidCooldown;
}
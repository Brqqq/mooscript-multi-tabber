import { Routes } from "./routes.js"
import { getDoc, postForm, getCash } from "./utils.js";
const boughtCooldown = 3 * 60 * 60 * 1000;
const noMoneyCooldown = 15 * 60 * 1000;
export const buyItems = async () => {
    const buyOrder = [
        "weapon",
        "protection",
        "plane",
        "plf"
    ];

    const { document: inventoryDoc } = await getDoc(Routes.Inventory);
    //document.getElementById("weapondata").innerText

    const weapon = inventoryDoc.getElementById("weapondata").innerText;
    const weaponPrice = 50_000;
    const weaponBuyBody = ["item=weapon", "buyweapon=1", "buy=Buy this weapon", "buywhat=weapon"].join("&");

    const protection = inventoryDoc.getElementById("protectiondata").innerText;
    const protectionPrice = 130_000;
    const protectionBuyBody = ["item=protection", "buyprotection=1", "buy=Buy this protection", "buywhat=protection"].join("&");

    const plane = inventoryDoc.getElementById("planedata").innerText;
    const planePrice = 2_000_000;
    const planeBuyBody = ["item=plane", "buyplane=1", "buy=Buy this plane", "buywhat=plane"].join("&");

    const leadFactory = inventoryDoc.getElementById("plfdata").innerText;
    const leadFactoryPrice = 800_000;
    const leadFactoryBuyBody = ["item=plf", "buyplf=1", "buy=Buy this leadfactory", "buywhat=plf"].join("&");

    const itemsData = [
        {
            buyItem: "weapon",
            price: weaponPrice,
            body: weaponBuyBody,
            current: weapon
        }, {
            buyItem: "protection",
            price: protectionPrice,
            body: protectionBuyBody,
            current: protection
        }, {
            buyItem: "plane",
            price: planePrice,
            body: planeBuyBody,
            current: plane
        }, {
            buyItem: "plf",
            price: leadFactoryPrice,
            body: leadFactoryBuyBody,
            current: leadFactory
        }
    ];

    // Margin is so you don't spend all your money and won't be able to do drug runs
    const margin = 200_000;
    let cash = getCash(inventoryDoc);

    for (let i = 0; i < buyOrder.length; i++) {
        const buyItem = buyOrder[i];
        const itemInfo = itemsData.find(item => item.buyItem === buyItem);
        if (itemInfo === null) {
            throw new Error("Unknown buy item specified in config: " + buyItem);
        }

        if (itemInfo.current === "None") {
            if ((cash - margin) > itemInfo.price) {
                await postForm(Routes.Shop, itemInfo.body);
                cash -= itemInfo.price;
            } else {
                return noMoneyCooldown;
            }
        }
    }

    return boughtCooldown;
}
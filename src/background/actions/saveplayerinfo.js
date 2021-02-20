import { getPlayerInfo } from "./utils.js"
import { updateAccount } from "../storage.js";

const defaultCooldown = 1000 * 60 * 2;

export const savePlayerInfo = async () => {
    const playerInfo = await getPlayerInfo();

    const { email, ...rest } = playerInfo;

    // If we can get this data, then the user cannot be dead
    const newData = { ...rest, dead: false };
    await updateAccount(email, newData);

    return defaultCooldown;
}
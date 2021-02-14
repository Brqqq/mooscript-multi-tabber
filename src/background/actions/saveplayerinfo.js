import { getPlayerInfo } from "./utils.js"
import { updateAccount } from "../storage.js";

const defaultCooldown = 1000 * 60 * 5;

export const savePlayerInfo = async () => {
    const playerInfo = await getPlayerInfo();

    const { email, ...rest } = playerInfo;
    await updateAccount(email, rest);

    return defaultCooldown;
}
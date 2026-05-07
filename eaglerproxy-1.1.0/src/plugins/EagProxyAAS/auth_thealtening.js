"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenProfileTheAltening = void 0;
const Enums_js_1 = require("../../proxy/Enums.js");
async function getTokenProfileTheAltening(token) {
    const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: token,
            password: "anything",
        }),
    };
    const res = await fetch("http://authserver.thealtening.com/authenticate", fetchOptions);
    const resJson = await res.json();
    if (resJson.error)
        throw new Error(Enums_js_1.Enums.ChatColor.RED + `${resJson.error}`);
    if (!resJson)
        throw new Error(Enums_js_1.Enums.ChatColor.RED + "TheAltening replied with an empty response!?");
    if (resJson.selectedProfile?.name?.length < 3)
        throw new Error(Enums_js_1.Enums.ChatColor.RED + "Invalid response from TheAltening received!");
    return {
        auth: "mojang",
        sessionServer: "http://sessionserver.thealtening.com",
        username: resJson.selectedProfile.name,
        haveCredentials: true,
        session: resJson,
    };
}
exports.getTokenProfileTheAltening = getTokenProfileTheAltening;

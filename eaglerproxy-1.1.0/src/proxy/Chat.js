"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const Enums_js_1 = require("./Enums.js");
var Chat;
(function (Chat) {
    function chatToPlainString(chat) {
        let ret = "";
        if (chat.text != null)
            ret += chat.text;
        if (chat.extra != null) {
            chat.extra.forEach((extra) => {
                let append = "";
                if (extra.bold)
                    append += Enums_js_1.Enums.ChatColor.BOLD;
                if (extra.italic)
                    append += Enums_js_1.Enums.ChatColor.ITALIC;
                if (extra.underlined)
                    append += Enums_js_1.Enums.ChatColor.UNDERLINED;
                if (extra.strikethrough)
                    append += Enums_js_1.Enums.ChatColor.STRIKETHROUGH;
                if (extra.obfuscated)
                    append += Enums_js_1.Enums.ChatColor.OBFUSCATED;
                if (extra.color)
                    append +=
                        extra.color == "reset"
                            ? Enums_js_1.Enums.ChatColor.RESET
                            : resolveColor(extra.color);
                append += extra.text;
                ret += append;
            });
        }
        return ret;
    }
    Chat.chatToPlainString = chatToPlainString;
    const ccValues = Object.values(Enums_js_1.Enums.ChatColor);
    const ccKeys = Object.keys(Enums_js_1.Enums.ChatColor).map((str) => str.toLowerCase());
    function resolveColor(colorStr) {
        return (Object.values(Enums_js_1.Enums.ChatColor)[ccKeys.indexOf(colorStr.toLowerCase())] ??
            colorStr);
    }
})(Chat = exports.Chat || (exports.Chat = {}));

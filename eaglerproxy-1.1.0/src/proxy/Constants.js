"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPGRADE_REQUIRED_RESPONSE = exports.Constants = void 0;
const meta = __importStar(require("../meta.js"));
var Constants;
(function (Constants) {
    Constants.EAGLERCRAFT_SKIN_CHANNEL_NAME = "EAG|Skins-1.8";
    Constants.MAGIC_ENDING_SERVER_SKIN_DOWNLOAD_BUILTIN = [0x00, 0x00, 0x00];
    Constants.MAGIC_ENDING_CLIENT_UPLOAD_SKIN_BUILTIN = [0x00, 0x05, 0x01, 0x00, 0x00, 0x00];
    Constants.EAGLERCRAFT_SKIN_CUSTOM_LENGTH = 64 ** 2 * 4;
    Constants.JOIN_SERVER_PACKET = 0x01;
    Constants.PLAYER_LOOK_PACKET = 0x08;
    Constants.ICON_SQRT = 64;
    Constants.END_BUFFER_LENGTH = Constants.ICON_SQRT ** 8;
    Constants.IMAGE_DATA_PREPEND = "data:image/png;base64,";
})(Constants = exports.Constants || (exports.Constants = {}));
exports.UPGRADE_REQUIRED_RESPONSE = `<!DOCTYPE html><!-- Served by ${meta.PROXY_BRANDING} (version: ${meta.PROXY_VERSION}) --><html> <head> <title>EaglerProxy landing page</title> <style> :root { font-family: "Arial" } code { padding: 3px 10px 3px 10px; border-radius: 5px; font-family: monospace; background-color: #1a1a1a; color: white; } </style> <script type="text/javascript"> window.addEventListener('load', () => { document.getElementById("connect-url").innerText = window.location.href.replace(window.location.protocol, window.location.protocol == "https:" ? "wss:" : "ws:"); }); </script> </head> <body> <h1>426 - Upgrade Required</h1> <p>Hello there! It appears as if you've reached the landing page for this EaglerProxy instance. Unfortunately, you cannot connect to the proxy server from here. To connect, use this server IP/URL: <code id="connect-url">loading...</code> (connect from any recent EaglercraftX client via Multiplayer > Direct Connect)</p> </body></html>`;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.channelClients = exports.wss = void 0;
const ws_1 = require("ws");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const message_service_1 = require("./app/modules/message/message.service");
const prisma_1 = __importDefault(require("./shared/prisma"));
const jwtHelpers_1 = require("./helpers/jwtHelpers");
let wss;
const channelClients = new Map();
exports.channelClients = channelClients;
let server;
// Helper function: Send JSON safely
const sendJSON = (ws, data) => {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
};
// Helper function: Broadcast past messages
const broadcastPastMessages = (channelId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const isStreaming = (_a = (yield prisma_1.default.channel.findUnique({ where: { id: channelId } }))) === null || _a === void 0 ? void 0 : _a.isStreaming;
    const pinnedMessage = yield message_service_1.messageService.pinnedMessageInDB(channelId);
    const messages = yield message_service_1.messageService.getMessagesFromDB(channelId);
    const payload = {
        type: "pastMessages",
        isStreaming,
        pinnedMessage,
        message: messages,
    };
    (_b = channelClients.get(channelId)) === null || _b === void 0 ? void 0 : _b.forEach((client) => sendJSON(client, payload));
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.server = server = app_1.default.listen(config_1.default.port, () => {
            console.log("Server is running on port", config_1.default.port);
        });
        exports.wss = wss = new ws_1.WebSocketServer({ server });
        wss.on("connection", (ws) => {
            console.log("New WebSocket connection established!");
            let subscribedChannel = null;
            let user = null;
            const interval = setInterval(() => {
                if (ws.readyState === ws_1.WebSocket.OPEN)
                    ws.ping();
            }, 30000);
            ws.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                try {
                    const parsedMessage = JSON.parse(message.toString());
                    const { type, channelId, messageId, messageIds, isPinned, message: updateText, isStreaming, token } = parsedMessage;
                    if (!user) {
                        if (type === "authenticate") {
                            if (!token) {
                                sendJSON(ws, { error: "Token is required to authenticate" });
                                return;
                            }
                            try {
                                let verifiedUser = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.jwt_secret);
                                user = verifiedUser;
                            }
                            catch (err) {
                                sendJSON(ws, { error: "Token is Invalid!" });
                                return;
                            }
                        }
                        else {
                            sendJSON(ws, { error: "You need to authenticated to access this service" });
                            return;
                        }
                    }
                    switch (type) {
                        case "subscribe":
                            if (!channelId) {
                                sendJSON(ws, { error: "ChannelId is required to subscribe" });
                                return;
                            }
                            if (subscribedChannel && channelClients.has(subscribedChannel)) {
                                (_a = channelClients.get(subscribedChannel)) === null || _a === void 0 ? void 0 : _a.delete(ws);
                                if (((_b = channelClients.get(subscribedChannel)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
                                    channelClients.delete(subscribedChannel);
                                }
                            }
                            if (!channelClients.has(channelId)) {
                                channelClients.set(channelId, new Set());
                            }
                            (_c = channelClients.get(channelId)) === null || _c === void 0 ? void 0 : _c.add(ws);
                            subscribedChannel = channelId;
                            yield broadcastPastMessages(channelId);
                            break;
                        case "message":
                            if (channelId && subscribedChannel === channelId) {
                                const messagePayload = {
                                    type: "message",
                                    channelId,
                                    message: parsedMessage.message,
                                };
                                yield prisma_1.default.message.create({ data: { channelId, senderId: user.id } });
                                (_d = channelClients.get(channelId)) === null || _d === void 0 ? void 0 : _d.forEach((client) => sendJSON(client, messagePayload));
                            }
                            break;
                        case "deleteMessage":
                            if (messageId && subscribedChannel) {
                                yield message_service_1.messageService.deleteSingleMessageFromDB(messageId);
                                yield broadcastPastMessages(subscribedChannel);
                            }
                            break;
                        case "multipleDeleteMessages":
                            if (messageIds && subscribedChannel) {
                                yield message_service_1.messageService.deleteMultipleMessagesFromDB(messageIds);
                                yield broadcastPastMessages(subscribedChannel);
                            }
                            break;
                        case "pinMessage":
                            if (messageId && typeof isPinned === "boolean" && subscribedChannel) {
                                yield message_service_1.messageService.pinUnpinMessage(messageId, isPinned);
                                yield broadcastPastMessages(subscribedChannel);
                            }
                            break;
                        case "clearMessagesFromChannel":
                            if (channelId) {
                                yield message_service_1.messageService.deleteAllMessagesFromChannel(channelId);
                                yield broadcastPastMessages(channelId);
                            }
                            break;
                        case "editMessage":
                            if (messageId && updateText && channelId) {
                                yield message_service_1.messageService.updateSingleMessageInDB(messageId, updateText);
                                yield broadcastPastMessages(channelId);
                            }
                            break;
                        case "streaming":
                            if (channelId && typeof isStreaming === "boolean") {
                                yield prisma_1.default.channel.update({
                                    where: { id: channelId },
                                    data: { isStreaming },
                                });
                                yield broadcastPastMessages(channelId);
                            }
                            break;
                        default:
                            sendJSON(ws, { error: "Unsupported message type" });
                    }
                }
                catch (err) {
                    console.error("Error processing WebSocket message:", err.message || err);
                }
            }));
            ws.on("close", () => {
                if (subscribedChannel) {
                    const clients = channelClients.get(subscribedChannel);
                    clients === null || clients === void 0 ? void 0 : clients.delete(ws);
                    if ((clients === null || clients === void 0 ? void 0 : clients.size) === 0)
                        channelClients.delete(subscribedChannel);
                }
                clearInterval(interval);
                console.log("WebSocket client disconnected!");
            });
        });
    });
}
main();

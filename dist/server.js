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
exports.channelClients = exports.wss = void 0;
const ws_1 = require("ws");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const message_service_1 = require("./app/modules/message/message.service");
const prisma_1 = __importDefault(require("./shared/prisma"));
let wss;
const channelClients = new Map();
exports.channelClients = channelClients;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = app_1.default.listen(config_1.default.port, () => {
            console.log("Server is running on port", config_1.default.port);
        });
        // WebSocket Server setup
        exports.wss = wss = new ws_1.WebSocketServer({ server });
        // Handle WebSocket connections
        wss.on("connection", (ws) => {
            console.log("New WebSocket connection established!");
            // Ping the client every 30 seconds
            const interval = setInterval(() => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.ping();
                }
            }, 30000);
            let subscribedChannel = null; // Track the client's subscribed channel
            // Listen for subscription messages
            ws.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                try {
                    const parsedMessage = JSON.parse(message.toString());
                    const { type, channelId, messageId, messageIds, isPinned, message: updateText, isStreaming, } = parsedMessage;
                    const streamingResult = yield prisma_1.default.chanel.findUnique({
                        where: { id: channelId },
                    });
                    const pinnedMessage = yield message_service_1.messageService.pinnedMessageInDB(channelId);
                    const messages = yield message_service_1.messageService.getMessagesFromDB(channelId);
                    if (type === "subscribe") {
                        if (!channelId) {
                            ws.send(JSON.stringify({ error: "ChannelId is required to subscribe" }));
                            return;
                        }
                        // Manage subscription
                        if (subscribedChannel) {
                            // If already subscribed, remove from the previous channel
                            const previousSet = channelClients.get(subscribedChannel);
                            previousSet === null || previousSet === void 0 ? void 0 : previousSet.delete(ws);
                            if ((previousSet === null || previousSet === void 0 ? void 0 : previousSet.size) === 0)
                                channelClients.delete(subscribedChannel);
                        }
                        // Add to the new channel
                        if (!channelClients.has(channelId)) {
                            channelClients.set(channelId, new Set());
                        }
                        (_a = channelClients.get(channelId)) === null || _a === void 0 ? void 0 : _a.add(ws);
                        subscribedChannel = channelId;
                        ws.send(JSON.stringify({
                            type: "pastMessages",
                            isStreaming: streamingResult === null || streamingResult === void 0 ? void 0 : streamingResult.isStreaming,
                            pinnedMessage: pinnedMessage,
                            message: messages,
                        }));
                    }
                    else if (type === "message" && // Check if the type is "message"
                        channelId && // Ensure channelId is present
                        subscribedChannel === channelId // Ensure the client is subscribed to the correct channel
                    ) {
                        // Broadcast new messages to all clients in the same channel
                        const messagePayload = {
                            type: "message",
                            channelId,
                            message: parsedMessage.message,
                        };
                        // Send to all clients subscribed to the channel
                        (_b = channelClients.get(channelId)) === null || _b === void 0 ? void 0 : _b.forEach((client) => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(JSON.stringify(messagePayload));
                            }
                        });
                    }
                    else if (type === "deleteMessage" && messageId) {
                        yield message_service_1.messageService.deleteSingleMessageFromDB(messageId);
                        const pastMessages = {
                            type: "pastMessages",
                            isStreaming: streamingResult === null || streamingResult === void 0 ? void 0 : streamingResult.isStreaming,
                            pinnedMessage: pinnedMessage,
                            message: messages,
                        };
                        (_c = channelClients.get(subscribedChannel)) === null || _c === void 0 ? void 0 : _c.forEach((client) => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(JSON.stringify(pastMessages));
                            }
                        });
                    }
                    else if (type === "multipleDeleteMessages" && messageIds) {
                        yield message_service_1.messageService.deleteMultipleMessagesFromDB(messageIds);
                        const messages = yield message_service_1.messageService.getMessagesFromDB(channelId);
                        const pastMessages = {
                            type: "pastMessages",
                            isStreaming: streamingResult === null || streamingResult === void 0 ? void 0 : streamingResult.isStreaming,
                            pinnedMessage: pinnedMessage,
                            message: messages,
                        };
                        (_d = channelClients.get(subscribedChannel)) === null || _d === void 0 ? void 0 : _d.forEach((client) => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(JSON.stringify(pastMessages));
                            }
                        });
                    }
                    else if (type === "pinMessage" && messageId) {
                        yield message_service_1.messageService.pinUnpinMessage(messageId, isPinned);
                        const pastMessages = {
                            type: "pastMessages",
                            isStreaming: streamingResult === null || streamingResult === void 0 ? void 0 : streamingResult.isStreaming,
                            pinnedMessage: pinnedMessage,
                            message: messages,
                        };
                        (_e = channelClients.get(subscribedChannel)) === null || _e === void 0 ? void 0 : _e.forEach((client) => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(JSON.stringify(pastMessages));
                            }
                        });
                    }
                    else if (type === "clearMessagesFromChannel" && channelId) {
                        yield message_service_1.messageService.deleteAllMessagesFromChannel(messageId);
                        const pastMessages = {
                            type: "pastMessages",
                            isStreaming: streamingResult === null || streamingResult === void 0 ? void 0 : streamingResult.isStreaming,
                            pinnedMessage: pinnedMessage,
                            message: messages,
                        };
                        (_f = channelClients.get(subscribedChannel)) === null || _f === void 0 ? void 0 : _f.forEach((client) => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(JSON.stringify(pastMessages));
                            }
                        });
                    }
                    else if (type === "editMessage" && messageId) {
                        yield message_service_1.messageService.updateSingleMessageInDB(messageId, updateText);
                        const messages = yield message_service_1.messageService.getMessagesFromDB(channelId);
                        const pastMessages = {
                            type: "pastMessages",
                            isStreaming: streamingResult === null || streamingResult === void 0 ? void 0 : streamingResult.isStreaming,
                            pinnedMessage: pinnedMessage,
                            message: messages,
                        };
                        (_g = channelClients.get(subscribedChannel)) === null || _g === void 0 ? void 0 : _g.forEach((client) => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(JSON.stringify(pastMessages));
                            }
                        });
                    }
                    else if (type === "streaming" && channelId) {
                        const updateResult = yield prisma_1.default.chanel.update({
                            where: { id: channelId },
                            data: {
                                isStreaming: isStreaming,
                            },
                        });
                        const pastMessages = {
                            type: "pastMessages",
                            isStreaming: updateResult === null || updateResult === void 0 ? void 0 : updateResult.isStreaming,
                            pinnedMessage: pinnedMessage,
                            message: messages,
                        };
                        (_h = channelClients.get(subscribedChannel)) === null || _h === void 0 ? void 0 : _h.forEach((client) => {
                            if (client.readyState === ws_1.WebSocket.OPEN) {
                                client.send(JSON.stringify(pastMessages));
                            }
                        });
                    }
                }
                catch (err) {
                    console.error("Error processing WebSocket message:", err.message);
                }
            }));
            // Handle client disconnections
            ws.on("close", () => {
                if (subscribedChannel) {
                    const clientsInChannel = channelClients.get(subscribedChannel);
                    clientsInChannel === null || clientsInChannel === void 0 ? void 0 : clientsInChannel.delete(ws);
                    if ((clientsInChannel === null || clientsInChannel === void 0 ? void 0 : clientsInChannel.size) === 0)
                        channelClients.delete(subscribedChannel);
                }
                console.log("WebSocket client disconnected!");
                clearInterval(interval);
            });
        });
    });
}
main();

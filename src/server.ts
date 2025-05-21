import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import config from "./config";
import { messageService } from "./app/modules/message/message.service";
import prisma from "./shared/prisma";
import { jwtHelpers } from "./helpers/jwtHelpers";
import { Secret } from "jsonwebtoken";

let wss: WebSocketServer;
const channelClients = new Map<string, Set<WebSocket>>();
let server: Server;

// Helper function: Send JSON safely
const sendJSON = (ws: WebSocket, data: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

// Helper function: Broadcast past messages
const broadcastPastMessages = async (channelId: string) => {
  const isStreaming = (await prisma.channel.findUnique({ where: { id: channelId } }))?.isStreaming;
  const pinnedMessage = await messageService.pinnedMessageInDB(channelId);
  const messages = await messageService.getMessagesFromDB(channelId);

  const payload = {
    type: "pastMessages",
    isStreaming,
    pinnedMessage,
    message: messages,
  };

  channelClients.get(channelId)?.forEach((client) => sendJSON(client, payload));
};

async function main() {
  server = app.listen(config.port, () => {
    console.log("Server is running on port", config.port);
  });

  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established!");

    let subscribedChannel: string | null = null;
    let user:any | null = null

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    ws.on("message", async (message) => {

      
      try {
        const parsedMessage = JSON.parse(message.toString());
        const {
          type,
          channelId,
          messageId,
          messageIds,
          isPinned,
          message: updateText,
          isStreaming,
          token
        } = parsedMessage;

        if (!user){
          if(type === "authenticate"){
            if(!token){
              sendJSON(ws, {error:"Token is required to authenticate"})
              return
            }
            try{
              let verifiedUser = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret)
              user = verifiedUser
            }catch(err:any){
              sendJSON(ws, {error:"Token is Invalid!"})
              return
            }
          }else{
            sendJSON(ws,{error:"You need to authenticated to access this service"})
            return
          }
        }

        switch (type) {

          case "subscribe":
            if (!channelId) {
              sendJSON(ws, { error: "ChannelId is required to subscribe" });
              return;
            }

            if (subscribedChannel && channelClients.has(subscribedChannel)) {
              channelClients.get(subscribedChannel)?.delete(ws);
              if (channelClients.get(subscribedChannel)?.size === 0) {
                channelClients.delete(subscribedChannel);
              }
            }

            if (!channelClients.has(channelId)) {
              channelClients.set(channelId, new Set());
            }
            channelClients.get(channelId)?.add(ws);
            subscribedChannel = channelId;

            await broadcastPastMessages(channelId);
            break;

          case "message":
            if (channelId && subscribedChannel === channelId) {
              const messagePayload = {
                type: "message",
                channelId,
                message: parsedMessage.message,
              };
              await prisma.message.create({data:{channelId, senderId:user.id}})

              channelClients.get(channelId)?.forEach((client) =>
                sendJSON(client, messagePayload)
              );
            }
            break;

          case "deleteMessage":
            if (messageId && subscribedChannel) {
              await messageService.deleteSingleMessageFromDB(messageId);
              await broadcastPastMessages(subscribedChannel);
            }
            break;

          case "multipleDeleteMessages":
            if (messageIds && subscribedChannel) {
              await messageService.deleteMultipleMessagesFromDB(messageIds);
              await broadcastPastMessages(subscribedChannel);
            }
            break;

          case "pinMessage":
            if (messageId && typeof isPinned === "boolean" && subscribedChannel) {
              await messageService.pinUnpinMessage(messageId, isPinned);
              await broadcastPastMessages(subscribedChannel);
            }
            break;

          case "clearMessagesFromChannel":
            if (channelId) {
              await messageService.deleteAllMessagesFromChannel(channelId);
              await broadcastPastMessages(channelId);
            }
            break;

          case "editMessage":
            if (messageId && updateText && channelId) {
              await messageService.updateSingleMessageInDB(messageId, updateText);
              await broadcastPastMessages(channelId);
            }
            break;

          case "streaming":
            if (channelId && typeof isStreaming === "boolean") {
              await prisma.channel.update({
                where: { id: channelId },
                data: { isStreaming },
              });
              await broadcastPastMessages(channelId);
            }
            break;

          default:
            sendJSON(ws, { error: "Unsupported message type" });
        }
      } catch (err: any) {
        console.error("Error processing WebSocket message:", err.message || err);
      }
    });

    ws.on("close", () => {
      if (subscribedChannel) {
        const clients = channelClients.get(subscribedChannel);
        clients?.delete(ws);
        if (clients?.size === 0) channelClients.delete(subscribedChannel);
      }
      clearInterval(interval);
      console.log("WebSocket client disconnected!");
    });
  });
}

main();

export { wss, channelClients, server };

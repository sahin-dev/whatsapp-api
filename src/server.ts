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

const PORT = config.port
// Helper function: Send JSON safely
const sendJSON = (ws: WebSocket, data: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

// Helper function: Broadcast past messages
const broadcastPastMessages = async (groupId: string) => {
  const isStreaming = (await prisma.group.findUnique({ where: { id: groupId } }))?.isStreaming;
  const pinnedMessage = await messageService.pinnedMessageInDB(groupId);
  const messages = await messageService.getMessagesFromDB(groupId);

  const payload = {
    type: "pastMessages",
    isStreaming,
    pinnedMessage,
    message: messages,
  };

  channelClients.get(groupId)?.forEach((client) => sendJSON(client, payload));
};

async function main() {
  server = app.listen(PORT, () => {
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
          groupId,
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
              return
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
            if (!groupId) {
              sendJSON(ws, { error: "groupId is required to subscribe" });
              return;
            }

            if (subscribedChannel && channelClients.has(subscribedChannel)) {
              channelClients.get(subscribedChannel)?.delete(ws);
              if (channelClients.get(subscribedChannel)?.size === 0) {
                channelClients.delete(subscribedChannel);
              }
            }

            if (!channelClients.has(groupId)) {
              channelClients.set(groupId, new Set());
            }
            channelClients.get(groupId)?.add(ws);
            subscribedChannel = groupId;

            await broadcastPastMessages(groupId);
            break;

          case "message":
            if (groupId && subscribedChannel === groupId) {
              const messagePayload = {
                type: "message",
                groupId,
                message: parsedMessage.message,
              };
              await prisma.userMessage.create({data:{groupId, senderId:user.id}})

              channelClients.get(groupId)?.forEach((client) =>
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
            if (groupId) {
              await messageService.deleteAllMessagesFromChannel(groupId);
              await broadcastPastMessages(groupId);
            }
            break;

          case "editMessage":
            if (messageId && updateText && groupId) {
              await messageService.updateSingleMessageInDB(messageId, updateText);
              await broadcastPastMessages(groupId);
            }
            break;

          case "streaming":
            if (groupId && typeof isStreaming === "boolean") {
              await prisma.group.update({
                where: { id: groupId },
                data: { isStreaming },
              });
              await broadcastPastMessages(groupId);
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

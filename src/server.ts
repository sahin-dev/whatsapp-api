import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import config from "./config";
import { messageService } from "./app/modules/message/message.service";

let wss: WebSocketServer;
const channelClients = new Map<string, Set<WebSocket>>();

async function main() {
  const server: Server = app.listen(config.port, () => {
    console.log("Server is running on port", config.port);
  });

  // WebSocket Server setup
  wss = new WebSocketServer({ server });

  // Handle WebSocket connections
  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established!");

    let subscribedChannel: string | null = null; // Track the client's subscribed channel

    // Start sending ping messages every 30 seconds
    ws.onopen = () => {
      console.log("Connected");
      setInterval(() => {
        ws.send(JSON.stringify({ type: "ping" }));
      }, 40000);
    };

    // Listen for subscription messages
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
        } = parsedMessage;
        if (type === "subscribe") {
          if (!channelId) {
            ws.send(
              JSON.stringify({ error: "ChannelId is required to subscribe" })
            );
            return;
          }

          // Manage subscription
          if (subscribedChannel) {
            // If already subscribed, remove from the previous channel
            const previousSet = channelClients.get(subscribedChannel);
            previousSet?.delete(ws);
            if (previousSet?.size === 0)
              channelClients.delete(subscribedChannel);
          }

          // Add to the new channel
          if (!channelClients.has(channelId)) {
            channelClients.set(channelId, new Set());
          }
          channelClients.get(channelId)?.add(ws);
          subscribedChannel = channelId;

          // Fetch past messages for the channel and send to the client
          const pastMessages = await messageService.getMessagesFromDB(
            channelId
          );
          ws.send(
            JSON.stringify({
              type: "pastMessages",
              message: pastMessages,
            })
          );
        } else if (
          type === "message" && // Check if the type is "message"
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
          channelClients.get(channelId)?.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messagePayload));
            }
          });
        } else if (type === "deleteMessage" && messageId) {
          try {
            await messageService.deleteSingleMessageFromDB(messageId);
            const messages = await messageService.getMessagesFromDB(channelId);

            const pastMessages = {
              type: "pastMessages",
              message: messages,
            };
            channelClients
              .get(subscribedChannel as string)
              ?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(pastMessages));
                }
              });
          } catch (error: any) {
            ws.send(
              JSON.stringify({
                error: `Failed to delete message: ${error.message}`,
              })
            );
          }
        } else if (type === "multipleDeleteMessages" && messageIds) {
          try {
            await messageService.deleteMultipleMessagesFromDB(messageIds);
            const messages = await messageService.getMessagesFromDB(channelId);

            const pastMessages = {
              type: "pastMessages",
              message: messages,
            };
            channelClients
              .get(subscribedChannel as string)
              ?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(pastMessages));
                }
              });
          } catch (error: any) {
            ws.send(
              JSON.stringify({
                error: `Failed to delete message: ${error.message}`,
              })
            );
          }
        } else if (type === "pinMessage" && messageId) {
          try {
            await messageService.pinUnpinMessage(messageId, isPinned);
            const messages = await messageService.getMessagesFromDB(channelId);

            const pastMessages = {
              type: "pastMessages",
              message: messages,
            };
            channelClients
              .get(subscribedChannel as string)
              ?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(pastMessages));
                }
              });
          } catch (error: any) {
            ws.send(
              JSON.stringify({
                error: `Failed to delete message: ${error.message}`,
              })
            );
          }
        } else if (type === "clearMessagesFromChannel" && channelId) {
          try {
            await messageService.deleteAllMessagesFromChannel(messageId);
            const messages = await messageService.getMessagesFromDB(channelId);

            const pastMessages = {
              type: "pastMessages",
              message: messages,
            };
            channelClients
              .get(subscribedChannel as string)
              ?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(pastMessages));
                }
              });
          } catch (error: any) {
            ws.send(
              JSON.stringify({
                error: `Failed to delete message: ${error.message}`,
              })
            );
          }
        } else if (type === "editMessage" && messageId) {
          try {
            await messageService.updateSingleMessageInDB(messageId, updateText);
            const messages = await messageService.getMessagesFromDB(channelId);

            const pastMessages = {
              type: "pastMessages",
              message: messages,
            };
            channelClients
              .get(subscribedChannel as string)
              ?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(pastMessages));
                }
              });
          } catch (error: any) {
            ws.send(
              JSON.stringify({
                error: `Failed to delete message: ${error.message}`,
              })
            );
          }
        }
      } catch (err: any) {
        console.error("Error processing WebSocket message:", err.message);
      }
    });

    // Handle client disconnections
    ws.on("close", () => {
      if (subscribedChannel) {
        const clientsInChannel = channelClients.get(subscribedChannel);
        clientsInChannel?.delete(ws);
        if (clientsInChannel?.size === 0)
          channelClients.delete(subscribedChannel);
      }
      console.log("WebSocket client disconnected!");
    });
  });
}

main();

export { wss, channelClients };

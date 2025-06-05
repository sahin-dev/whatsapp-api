import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { jwtHelpers } from './helpers/jwtHelpers';

export class WebSocketHandler {
    private wss: WebSocketServer;
    private channelClients: Map<string, Set<WebSocket>> = new Map();

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server });
        this.initialize();
    }

    private initialize(): void {
        this.wss.on('connection', (ws) => {
            console.log('New client connected');
            let authenticatedUser: any = null;
            let subscribedChannel: string | null = null;

            const pingInterval = setInterval(() => {
                if (ws.readyState === ws.OPEN) {
                    ws.ping();
                }
            }, 30000);

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    
                    if (!authenticatedUser && data.type !== 'authenticate') {
                        this.sendError(ws, 'Authentication required');
                        return;
                    }

                    await this.handleMessage(ws, data, authenticatedUser, subscribedChannel);
                } catch (error) {
                    this.sendError(ws, 'Invalid message format');
                }
            });

            ws.on('close', () => {
                this.handleDisconnection(ws, subscribedChannel);
                clearInterval(pingInterval);
            });
        });
    }

    private async handleMessage(ws: WebSocket, data: any, user: any, channel: string | null): Promise<void> {
        switch (data.type) {
            case 'authenticate':
                // Handle authentication
                break;
            case 'subscribe':
                // Handle subscription
                break;
            case 'message':
                // Handle message
                break;
            default:
                this.sendError(ws, 'Unknown message type');
        }
    }

    private sendError(ws: WebSocket, error: string): void {
        ws.send(JSON.stringify({ type: 'error', error }));
    }

    private handleDisconnection(ws: WebSocket, channel: string | null): void {
        if (channel && this.channelClients.has(channel)) {
            this.channelClients.get(channel)?.delete(ws);
            if (this.channelClients.get(channel)?.size === 0) {
                this.channelClients.delete(channel);
            }
        }
    }
}
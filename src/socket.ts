import app from "./app";

import {Server, Socket} from 'socket.io'
import {server} from './server'



const io = new Server(server)
console.log("socket initialized")
const clients = new Map<string, Set<Socket>>()

io.on("connections",(socket:Socket)=>{
    socket.on('join room', (message:any)=>{
        const parsedMessage:{roomId:string} = JSON.parse(message)
       const sockets = clients.get(parsedMessage.roomId)
       if (!sockets){
        let set = new Set<Socket>()
        set.add(socket)
        clients.set(parsedMessage.roomId, set)
       }else{
        sockets.add(socket)
       }
    })
})

export default io
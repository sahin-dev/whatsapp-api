import { channelClients, wss } from "../../../server"



const sendMessage = async (body:string, receiverId:string, groupId:string)=>{
    channelClients.get(groupId)?.forEach(client => {
        
    })
}
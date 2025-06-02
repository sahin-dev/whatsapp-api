import { channelClients, wss } from "../../../server"



const sendMessage = async (body:string, receiverId:string, groupId:string)=>{
    channelClients.get(groupId)?.forEach(client => {
        
    })
}


const craeteChat = async (body:string, receiverId:string, groupId:string)=>{
    const message = {
        body,
        receiverId,
        groupId
    }
    channelClients.get(groupId)?.forEach(client => {
        client.send(JSON.stringify(message))
    })
}

const getLastMessage = async (groupId:string)=>{

}   

const getAllMessages = async (groupId:string)=>{
  
}   

export const chatServices = {
    sendMessage,
    craeteChat,
    getLastMessage,
    getAllMessages
}


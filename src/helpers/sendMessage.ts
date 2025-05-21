// Your AccountSID and Auth Token from console.twilio.com
import twilio from 'twilio'
import config from '../config'

const client = twilio(config.twilio.sid, config.twilio.token)


export const sendMessage = async (body:string, to:string)=>{
    let message = await client.messages.create({body,to, from:config.twilio.number})
    console.log("message sent ",message.sid)
}


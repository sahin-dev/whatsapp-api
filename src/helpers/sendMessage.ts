// Your AccountSID and Auth Token from console.twilio.com
import twilio from 'twilio'
import config from '../config'


const client = twilio(config.twilio.test_sid, config.twilio.test_token)

export const sendMessage = async (body:string, to:string)=>{
    try{
        
        let message = await client.messages.create({body,to, from:config.twilio.number})
        console.log("message sent ",message.sid)
    }catch(err:any){
        throw err
    }
    
    
}


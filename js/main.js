const WHITELIST_GROUP = ['85263754935-1463735762@g.us']
const DATA_PATH = '/tmp/storage/sessionData'

const { Client, LocalAuth, MessageAck } = require('whatsapp-web.js')

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: DATA_PATH
    }),
    puppeteer: {args: ['--no-sandbox']}
})

client.on('authenticated', (session) => {
    console.log('[Authenticated]')
})

function check_session_exist(){
    const fs = require('fs')
    if(!fs.existsSync(DATA_PATH)){
        console.log('[ERROR] Session Data not exist!')
        client.destroy()
    }
}

function login(){
    const qrcode = require('qrcode-terminal')

    client.on('qr', qr => {
        qrcode.generate(qr, {small: true})
    })
    
    client.on('ready', () => {
        console.log('Client ready!')
        setTimeout(()=>{
            client.destroy()
        }, 30 *1000)
        client.destroy()
    })

    client.initialize()
}

//bot
//https://github.com/pedroslopez/whatsapp-web.js/issues/1343
async function concat_unread_msg(chat){
    const msgs = await chat.fetchMessages({
        limit: chat.unreadCount
    })
    var msg_strg = ''
    for(const msg of msgs){
        //console.log(`\tMsg[${msg.ack}]: ${msg.body}`)    //test
        msg_strg += '\n' + msg.body
    }
    return msg_strg
}
async function response_chat(chat){
    console.log('responsed: '+JSON.stringify({
        name: chat.name,
        id: chat.id._serialized,
        count: chat.unreadCount
    }))

    const msg_strg = await concat_unread_msg(chat)

    const ai_json = await (await fetch(process.env.AI_URL,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            Authorization: process.env.INCOME_API_KEY
        },
        body:JSON.stringify({
            num: chat.id._serialized,
            name: chat.name,
            text: msg_strg,
            require_res: true
        })
    })).json()

    await chat.sendMessage("[System]:\nYour message is redirected. I will response soon.\n你的信息已轉達，將盡快回覆。")
    await chat.sendMessage("[laiyuan Bot]:\n"+ai_json[0].response)
}
async function skip_chat(chat){
    console.log('skipped: '+JSON.stringify({
        name: chat.name,
        id: chat.id._serialized,
        count: chat.unreadCount
    }))

    const msg_strg = await concat_unread_msg(chat)

    await fetch(process.env.AI_URL,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            Authorization: process.env.INCOME_API_KEY
        },
        body:JSON.stringify({
            num: chat.id._serialized,
            name: chat.name,
            text: msg_strg,
            require_res: false
        })
    })
}

function bot(){
    check_session_exist()

    client.on('ready', async()=>{
        console.log('Client ready')
        const chats = await client.getChats()
        for(const chat of chats){
            if(chat.unreadCount > 0){
                if(!chat.isGroup || WHITELIST_GROUP.includes(chat.id._serialized))
                    await response_chat(chat)
                else
                    await skip_chat(chat)
                //const sent_msg = await chat.sendMessage("received!")
                //const sent_msg = await client.sendMessage(chat.id._serialized, '[Test] Laiyuan-Bot has received message!')
            }
        }
        setTimeout(()=>{
            client.destroy()
        }, 15 *1000)
    })

    /**
    client.on('message', async message => {
        client.sendMessage(message.from, '[Test] Laiyuan-Bot has received message!')
    })
    */

    client.initialize()
}

function list(){
    check_session_exist()

    client.on('ready', async()=>{
        console.log('Client ready!')
        const chats = await client.getChats()
        chats.forEach(chat => {
            console.log({
                name: chat.name,
                id: chat.id._serialized,
            })
        })
        client.destroy()
    })
    client.initialize()
}

const args = process.argv.slice(2)
switch(args[0]){
    case 'login':
        console.log('[start login]')
        login()
        break
    case 'list':
        console.log('[start list]')
        list()
        break
    default:
    case 'bot':
        console.log('[start bot]')
        bot()
        break
}

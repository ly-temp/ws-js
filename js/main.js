const WHITELIST_GROUP = process.env.WHITELIST_GROUP.split(' ')    //id_serialized ['85263754935-1463735762@g.us']
const DATA_PATH = '/tmp/storage/sessionData'
const WA_VERSION='2.3000.1012440038-alpha'

const { Client, LocalAuth, MessageAck } = require('whatsapp-web.js')

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: DATA_PATH
    }),
    puppeteer: {args: ['--no-sandbox']},
    webVersionCache: {
        type: 'remote',
        //remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${WA_VERSION}.html`,
        remotePath: 'https://raw.githubusercontent.com/ly-temp/ws-js-wa-version/main/2.2413.51-beta.html'
    },
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
    var ME_ALIAS = [client.info.wid.user, client.info.pushname]
    ME_ALIAS = ME_ALIAS.map(s => '@'+s)
    const ME_REGEX = new RegExp(ME_ALIAS.join('|'), 'i')

    const msgs = await chat.fetchMessages({
        limit: chat.unreadCount
    })
    var mentioned_me = false
    var msg_strg = ''
    for(const msg of msgs){
        //console.log(`\tMsg[${msg.ack}]: ${msg.body}`)    //test
        //console.log((await msg.getMentions()))

        mentioned_me |= ME_REGEX.test(msg.body)
        msg_strg += '\n' + msg.body
    }
    return {mentioned_me: mentioned_me, msg_strg: msg_strg}
}
async function response_chat(chat){
    const {mentioned_me, msg_strg} = await concat_unread_msg(chat)

    const in_contact = chat.name.charAt(0) !== '+';
    const require_res = (!chat.isGroup && (in_contact || mentioned_me) )
        || (chat.isGroup && WHITELIST_GROUP.includes(chat.id._serialized) && mentioned_me)

    console.log(`res[${require_res}]: `+JSON.stringify({
        name: chat.name,
        id: chat.id._serialized,
        count: chat.unreadCount,
        mentioned_me: mentioned_me,
        in_contact: in_contact
    }))

    const ai_json = await (await fetch(process.env.AI_URL,{
        method:'POST',
        headers:{
            'Content-Type': 'application/json',
            Authorization: process.env.INCOME_API_KEY
        },
        title:'Whatsapp',
        body:JSON.stringify({
            num: chat.id._serialized,
            name: chat.name,
            text: msg_strg,
            require_res: require_res
        })
    })).json()

    if(require_res){
        await chat.sendMessage("[System]:\nYour message is email-forwarded. I will response soon.\n你的信息已轉達電郵，將盡快回覆。")
        await chat.sendMessage("[laiyuan Bot]:\n"+ai_json[0].response)
    }
}

function bot(){
    check_session_exist()

    client.on('ready', async()=>{
        console.log('Client ready')
        const chats = await client.getChats()
        for(const chat of chats){
            if(chat.unreadCount > 0){
                await response_chat(chat)
                await chat.sendSeen()
            }
                //const sent_msg = await chat.sendMessage("received!")
                //const sent_msg = await client.sendMessage(chat.id._serialized, '[Test] Laiyuan-Bot has received message!')
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

const WHITELIST_GROUP = process.env.WHITELIST_GROUP.split(' ')    //id_serialized ['85263754935-1463735762@g.us', '120363364316832497@g.us']
const {WEBHOOK_URL, WEBHOOK_KEY} = process.env
const DATA_PATH = '/tmp/storage/sessionData'
const WA_VERSION='2.3000.1023373029-alpha'

import whatsapp_web_pkg from 'whatsapp-web.js'
const { Client, LocalAuth } = whatsapp_web_pkg
import fs from 'fs'
import qrcode from 'qrcode-terminal'

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: DATA_PATH
    }),
    puppeteer: {args: ['--no-sandbox']},
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${WA_VERSION}.html`,
    },
})

client.on('authenticated', (session) => {
    console.log('[Authenticated]')
})

function check_session_exist(){
    if(!fs.existsSync(DATA_PATH)){
        console.log('[ERROR] Session Data not exist!')
        client.destroy()
    }
}

function login(){

    client.on('qr', qr => {
        qrcode.generate(qr, {small: true})
    })
    
    client.on('ready', () => {
        console.log('Client ready!')
        setTimeout(()=>{
            console.log('Client destroy')
            client.destroy()
        }, 10 *1000)
        //client.destroy()
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

        mentioned_me ||= ME_REGEX.test(msg.body)
        msg_strg += '\n' + msg.body
    }
    return {mentioned_me, msg_strg}
}

async function handle_unread_chats(unread_chats) {
    const chats_details = await Promise.all(
        unread_chats.map(async chat=>{
            const {mentioned_me, msg_strg} = await concat_unread_msg(chat)
            const in_whitelist = chat.name.charAt(0) === '~';
            const require_res = (!chat.isGroup && (in_whitelist || mentioned_me) )
                || (chat.isGroup && WHITELIST_GROUP.includes(chat.id._serialized) && mentioned_me)
        
            console.log(`res[${require_res}]: `+JSON.stringify({
                name: chat.name,
                id: chat.id._serialized,
                count: chat.unreadCount,
                mentioned_me: mentioned_me,
                in_whitelist: in_whitelist
            }))

            return {
                chat,
                body:{
                    id: chat.id._serialized,
                    name: chat.name,
                    text: msg_strg,
                    require_res
                }
            }
        })
    )
    
    const ai_json = await (await fetch(WEBHOOK_URL,{
        method:'POST',
        headers:{
            'Content-Type': 'application/json',
            Authorization: WEBHOOK_KEY
        },
        body:JSON.stringify({
            title:'Whatsapp',
            body:{
                chats: chats_details.map(e=>e.body)
            }
        })
    })).json()

    //console.log(ai_json)

    await Promise.all(ai_json.response.map(async({id, ai_output})=>{
        const chats_detail = chats_details.find(e=>e.body.id === id)
        const chat = chats_detail.chat
        const {require_res} = chats_detail.body
        if(require_res)
            await chat.sendMessage("[System]:\nemail-forwarded 已轉達電郵"+"\n[laiyuan Bot]:\n"+ai_output)
        await chat.sendSeen()
    }))
}
function bot(){
    check_session_exist()

    client.on('ready', async()=>{
        console.log('Client ready')
        const unread_chats = (await client.getChats()).filter(chat=>chat.unreadCount)
        if(unread_chats.length)
            await handle_unread_chats(unread_chats)
        setTimeout(()=>{
            client.destroy()
        }, 15 *1000)
    })

    client.initialize()
}

function list(){
    check_session_exist()

    client.on('ready', async()=>{
        console.log('Client ready!')
        console.log({WHITELIST_GROUP})
        const chats = await client.getChats()
        chats.forEach(chat => {
            console.log({
                name: chat.name,
                id: chat.id._serialized,
            })
        })
        client.destroy()
        console.log('Client destroy')
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

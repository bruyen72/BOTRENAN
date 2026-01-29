const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

// CORES ANSI (Termux)
const AZUL = '\x1b[34m'
const VERDE = '\x1b[32m'
const RESET = '\x1b[0m'

const prefix = '-'
const dono = '5532998665591@c.us'
const nomeDono = 'Renanvargas'
const botNome = 'R.v'

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "R.v-Bot" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})

/* ===============================
   QR CODE
================================ */
client.on('qr', (qr) => {
  console.clear()
  console.log(`${AZUL}==============================${RESET}`)
  console.log(`${AZUL}📱 Vemonbot2 - Conexão${RESET}`)
  console.log(`${AZUL}==============================${RESET}\n`)

  console.log(`${AZUL}Escaneie o QR Code abaixo${RESET}`)
  qrcode.generate(qr, { small: true })

  console.log(`\n${AZUL}Ou conecte com número de telefone${RESET}`)
})

/* ===============================
   CÓDIGO DE PAREAMENTO (NÚMERO)
================================ */
client.on('pairing_code', (code) => {
  console.log(`\n${AZUL}📱 Conectar com número de telefone${RESET}`)
  console.log(`${AZUL}➡️ Insira este código no WhatsApp:${RESET}`)
  console.log(`${VERDE}${code}${RESET}`)
})

/* ===============================
   BOT PRONTO
================================ */
client.on('ready', () => {
  console.log(`\n${VERDE}✅ ${botNome} conectado com sucesso!${RESET}`)
})

/* ===============================
   COMANDOS
================================ */
client.on('message', async msg => {
  if (!msg.body.startsWith(prefix)) return

  const comando = msg.body.slice(1).toLowerCase()

  if (comando === 'menu') {
    msg.reply(`
🤖 *${botNome}*
👑 Dono: ${nomeDono}

🎮 *Brincadeiras*
${prefix}beijar
${prefix}abraçar
${prefix}casar

⚙️ *Info*
${prefix}dono
`)
  }

  if (comando === 'beijar') {
    msg.reply('💋 te deu um beijo 😘')
  }

  if (comando === 'abraçar') {
    msg.reply('🤗 abraço apertadooo')
  }

  if (comando === 'casar') {
    msg.reply('💍 agora vocês estão casados 😂')
  }

  if (comando === 'dono') {
    msg.reply(`👑 Dono do bot: ${nomeDono}`)
  }
})

client.initialize()

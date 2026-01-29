const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const messageHandler = require('./messageHandler')

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  console.log(`Versão do Baileys: ${version.join('.')}`)

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'info' }), // Logs enabled for debugging
    printQRInTerminal: false, // We will print it manually
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    browser: ['Vemonbot2', 'Chrome', '1.0.0'],
    markOnlineOnConnect: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📷 Gerando QR Code...')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('❌ Conexão fechada. Tentando reconectar...', shouldReconnect)
      if (shouldReconnect) {
        connect()
      } else {
        console.log('❌ Desconectado. Reinicie o bot para gerar nova sessão.')
      }
    } else if (connection === 'open') {
      console.log('✅ Conectado com sucesso!')
    }
  })

  sock.ev.on('messages.upsert', async m => {
    try {
      if (m.type === 'notify') {
          // Log removido para limpar o terminal
          await messageHandler(sock, m)
      }
    } catch (err) {
      console.error('❌ Erro no processamento do evento upsert:', err)
    }
  })
}

// Tratamento de erros globais para evitar queda por causa do Sync
process.on('uncaughtException', (err) => {
    console.error('⚠️ Erro Não Tratado (Ignorado):', err.message)
})

connect()
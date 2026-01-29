const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys')
const pino = require('pino')
const messageHandler = require('./messageHandler')
const express = require('express')
const http = require('http')
const path = require('path')

// Configuração do Servidor Web
const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3000

// Variáveis Globais de Estado
let qrCodeData = null
let pairingCodeData = null
let connectionStatus = 'disconnected' // disconnected, connecting, connected
let sock = null
let shouldRestart = true

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Rotas da API
app.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        qr: qrCodeData,
        pairingCode: pairingCodeData
    })
})

app.post('/start', async (req, res) => {
    const { usePairingCode, phoneNumber } = req.body
    
    // Se já estiver conectado, não faz nada
    if (connectionStatus === 'connected') {
        return res.json({ message: 'Bot já está conectado!' })
    }

    // Reinicia o processo de conexão
    if (sock) {
        try {
            shouldRestart = false
            await sock.end()
            sock = null
        } catch(e) {}
    }

    startBot(usePairingCode, phoneNumber)
    res.json({ message: 'Iniciando conexão...' })
})

// Keep Alive Endpoint (Para Render/UptimeRobot)
app.get('/', (req, res) => {
    res.send('Vemonbot2 está online. Acesse /index.html para gerenciar.')
})

server.listen(PORT, () => {
    console.log(`🌐 Servidor Web rodando na porta ${PORT}`)
    console.log(`🔗 Acesse: http://localhost:${PORT}`)
})

// Função Principal de Conexão
async function startBot(usePairingCode = false, phoneNumber = null) {
    shouldRestart = true
    connectionStatus = 'connecting'
    qrCodeData = null
    pairingCodeData = null

    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    console.log(`🤖 Iniciando Baileys v${version.join('.')}`)

    sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // Silencioso para não poluir terminal
        printQRInTerminal: !usePairingCode, // Mostra QR no terminal apenas se NÃO for pareamento
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'], // Navegador Linux padrão
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
    })

    // Lógica de Código de Pareamento
    if (usePairingCode && !sock.authState.creds.registered) {
        if (!phoneNumber) {
            console.log('⚠️ Número de telefone necessário para pareamento!')
            return
        }

        // Aguarda um pouco para o socket iniciar
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber)
                pairingCodeData = code
                connectionStatus = 'waiting_for_code'
                console.log(`🔢 Código de Pareamento: ${code}`)
            } catch (err) {
                console.error('❌ Erro ao solicitar código de pareamento:', err)
            }
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            qrCodeData = qr
            connectionStatus = 'waiting_for_qr'
            console.log('📷 QR Code Recebido')
        }

const fs = require('fs')

// ... (existing imports)

// ...

        if (connection === 'close') {
            const reason = lastDisconnect.error?.output?.statusCode
            const shouldReconnect = reason !== DisconnectReason.loggedOut
            
            console.log('❌ Conexão fechada. Razão:', reason)
            connectionStatus = 'disconnected'

            if (reason === DisconnectReason.loggedOut) {
                console.log('🚪 Dispositivo desconectado via celular. Apagando sessão e reiniciando...')
                try {
                    fs.rmSync('./session', { recursive: true, force: true })
                    console.log('🗑️ Pasta session apagada com sucesso.')
                } catch (err) {
                    console.error('⚠️ Erro ao apagar pasta session:', err)
                }
                // Força o reinício para gerar novo QR Code
                setTimeout(() => startBot(usePairingCode, phoneNumber), 1000)
                return // Sai da função para evitar reconexão duplicada
            }

            if (shouldReconnect && shouldRestart) {
                console.log('🔄 Reconectando automaticamente...')
                setTimeout(() => startBot(usePairingCode, phoneNumber), 3000) // Tenta reconectar com os mesmos parâmetros
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado com sucesso!')
            connectionStatus = 'connected'
            qrCodeData = null
            pairingCodeData = null
        }
    })

    sock.ev.on('messages.upsert', async m => {
        try {
            if (m.type === 'notify') {
                await messageHandler(sock, m)
            }
        } catch (err) {
            console.error('❌ Erro no processamento de mensagem:', err)
        }
    })
}

// Inicia automaticamente se já houver sessão salva
async function init() {
    const { state } = await useMultiFileAuthState('./session')
    if (state.creds && state.creds.registered) {
        console.log('📂 Sessão encontrada, iniciando reconexão...')
        startBot()
    } else {
        console.log('⏳ Aguardando configuração via Web UI...')
    }
}

init()
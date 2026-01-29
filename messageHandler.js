const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const fs = require('fs')
const { exec } = require('child_process')
const util = require('util')
const path = require('path')
const axios = require('axios')
const os = require('os')
const speed = require('performance-now')
const puppeteer = require('puppeteer')

// IMPORTS DOS MENUS
const { menuprime } = require('./dono/menus/comandos')
const { menuadm } = require('./dono/menus/menuadm')
const { menufig } = require('./dono/menus/menufig')
const { menujogos } = require('./dono/menus/menujogos')
const { menuefeitos } = require('./dono/menus/menuefeitos')
const { menuzoeira } = require('./dono/menus/menuzoeira')
const { menudown } = require('./dono/menus/menudown')
const { menuvip } = require('./dono/menus/menuvip')
const { menunsfw } = require('./dono/menus/menunsfw')
const { menudono } = require('./dono/menus/menudono')
const { menutinder } = require('./dono/menus/menutinder')

// CONFIGURAÇÕES
const nomeBot = "RenanBOT v4"
const imagemMenu = "./unnamed.jpg"

// FUNÇÕES AUXILIARES
const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}
const formatSize = (bytes) => {
    if (bytes >= 1073741824) { return (bytes / 1073741824).toFixed(2) + " GB"; }
    else if (bytes >= 1048576) { return (bytes / 1048576).toFixed(2) + " MB"; }
    else if (bytes >= 1024) { return (bytes / 1024).toFixed(2) + " KB"; }
    else { return bytes + " bytes"; }
}
const runtime = (seconds) => {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " dia, " : " dias, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " hora, " : " horas, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minuto, " : " minutos, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " segundo" : " segundos") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

const getBuffer = async (url) => {
    if (fs.existsSync(url)) return fs.readFileSync(url)
    try {
        const res = await axios.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0' }, 
            responseType: 'arraybuffer',
            timeout: 15000
        })
        return res.data
    } catch (e) {
        console.error('Erro getBuffer:', e.message)
        return null
    }
}

// ============================================
// SISTEMA PINTEREST COM PUPPETEER - LINKS EXATOS
// ============================================

// Cache para evitar imagens duplicadas
const usedPinterestUrls = new Set()

// Navegador reutilizável
let browserInstance = null

// Limpa cache quando atingir 300 imagens
const checkAndClearCache = () => {
    if (usedPinterestUrls.size > 300) {
        console.log('🔄 Limpando cache de imagens Pinterest...')
        usedPinterestUrls.clear()
    }
}

// MAPEAMENTO EXATO - SEUS LINKS
const getPinterestURL = (command) => {
    const urls = {
        'gay': 'https://br.pinterest.com/search/pins/?q=gay%20man&rs=typed',
        'feio': 'https://br.pinterest.com/search/pins/?q=feio&rs=typed',
        'gado': 'https://br.pinterest.com/search/pins/?q=gado%20meme&rs=typed',
        'corno': 'https://br.pinterest.com/search/pins/?q=corno%20meme&rs=typed',
        'casar': 'https://br.pinterest.com/search/pins/?q=casar%20anime&rs=typed',
        'shippar': 'https://br.pinterest.com/search/pins/?q=ships%20anime&rs=typed',
        'topcasal': 'https://br.pinterest.com/search/pins/?q=top%20couple%20anime&rs=typed'
    }
    
    return urls[command] || 'https://br.pinterest.com/search/pins/?q=anime&rs=typed'
}

// Inicializa navegador (reutiliza se já existir)
const getBrowser = async () => {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance
    }
    
    console.log('🌐 Iniciando navegador Puppeteer...')
    browserInstance = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    })
    
    return browserInstance
}

// BUSCA PINTEREST COM PUPPETEER (ÚNICO MÉTODO)
const getPinterestImagePuppeteer = async (command) => {
    checkAndClearCache()
    
    let page = null
    
    try {
        const url = getPinterestURL(command)
        console.log(`🔍 Pinterest Puppeteer: ${url}`)
        
        const browser = await getBrowser()
        page = await browser.newPage()
        
        // Configura viewport
        await page.setViewport({ width: 1920, height: 1080 })
        
        // Configura User-Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        // Vai para a página
        console.log('📄 Carregando página...')
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        })
        
        // Espera as imagens carregarem
        console.log('⏳ Aguardando imagens...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Scroll para carregar mais imagens
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2)
        })
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Extrai TODAS as URLs de imagem
        const imageUrls = await page.evaluate(() => {
            const images = []
            
            // Método 1: Tags <img>
            document.querySelectorAll('img').forEach(img => {
                if (img.src && img.src.includes('pinimg.com')) {
                    images.push(img.src)
                }
                if (img.srcset) {
                    const srcsetUrls = img.srcset.split(',').map(s => s.trim().split(' ')[0])
                    srcsetUrls.forEach(url => {
                        if (url.includes('pinimg.com')) images.push(url)
                    })
                }
            })
            
            // Método 2: Backgrounds CSS
            document.querySelectorAll('div[style*="background-image"]').forEach(div => {
                const match = div.style.backgroundImage.match(/url\(['"]?(https:\/\/i\.pinimg\.com[^'"]+)['"]?\)/)
                if (match) images.push(match[1])
            })
            
            return [...new Set(images)]
        })
        
        console.log(`📸 Encontradas ${imageUrls.length} URLs no total`)
        
        if (imageUrls.length === 0) {
            console.log('⚠️ Nenhuma imagem encontrada!')
            await page.close()
            return null
        }
        
        // Filtra URLs ruins
        const badHashes = [
            'd53b014d86a6b6761bf649a0ed813c2b', // gradiente rosa
        ]
        
        const goodImages = imageUrls.filter(url => {
            // Rejeita hashes ruins
            for (const hash of badHashes) {
                if (url.includes(hash)) return false
            }
            
            // Rejeita URLs já usadas
            if (usedPinterestUrls.has(url)) return false
            
            // Rejeita 236x (muito pequeno)
            if (url.includes('/236x/')) return false
            
            // Aceita apenas imagens de boa qualidade
            return url.includes('/474x/') || url.includes('/736x/') || url.includes('/originals/')
        })
        
        console.log(`✅ Imagens válidas: ${goodImages.length}`)
        
        if (goodImages.length === 0) {
            console.log('⚠️ Todas foram filtradas!')
            await page.close()
            return null
        }
        
        // Escolhe uma imagem aleatória
        const selectedImage = goodImages[Math.floor(Math.random() * goodImages.length)]
        usedPinterestUrls.add(selectedImage)
        
        console.log(`✅ Imagem selecionada! (cache: ${usedPinterestUrls.size})`)
        console.log(`🖼️  ${selectedImage.substring(0, 80)}...`)
        
        await page.close()
        return selectedImage
        
    } catch (error) {
        console.error('❌ Erro Puppeteer:', error.message)
        if (page) await page.close()
        return null
    }
}

// FUNÇÃO PRINCIPAL - APENAS PUPPETEER
const getImageForCommand = async (command) => {
    console.log(`\n🎯 Buscando imagem para: ${command}`)
    
    const image = await getPinterestImagePuppeteer(command)
    
    if (!image) {
        console.log('❌ Não foi possível obter imagem do Pinterest')
        return null
    }
    
    return image
}

// Função auxiliar para enviar mensagem com imagem
const sendImageMessage = async (sock, from, imageUrl, caption, mentions, quoted) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
        console.error('❌ URL inválida')
        return await sock.sendMessage(from, { 
            text: '❌ Não foi possível obter a imagem. Tente novamente.', 
            mentions 
        }, { quoted })
    }
    
    try {
        console.log(`📤 Enviando imagem...`)
        
        await sock.sendMessage(from, { 
            image: { url: imageUrl },
            caption: caption,
            mentions: mentions 
        }, { quoted })
        
        console.log('✅ Enviado com sucesso!')
    } catch (error) {
        console.error('❌ Erro ao enviar:', error.message)
        await sock.sendMessage(from, { 
            text: '❌ Erro ao enviar imagem. Tente novamente.', 
            mentions 
        }, { quoted })
    }
}

module.exports = async (sock, m) => {
    try {
        if (!m.messages || !m.messages[0]) return
        const msg = m.messages[0]
        if (!msg.message) return
        if (msg.key.remoteJid === 'status@broadcast') return

        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        
        const type = Object.keys(msg.message).find(key => key !== 'senderKeyDistributionMessage' && key !== 'messageContextInfo')
        let body = (type === 'conversation') ? msg.message.conversation :
                   (type === 'imageMessage') ? msg.message.imageMessage.caption :
                   (type === 'videoMessage') ? msg.message.videoMessage.caption :
                   (type === 'extendedTextMessage') ? msg.message.extendedTextMessage.text : ''
        
        if (type === 'ephemeralMessage') {
             const realMsg = msg.message.ephemeralMessage.message
             const realType = Object.keys(realMsg)[0]
             body = (realType === 'conversation') ? realMsg.conversation :
                    (realType === 'extendedTextMessage') ? realMsg.extendedTextMessage.text :
                    (realType === 'imageMessage') ? realMsg.imageMessage.caption : ''
        }
        
        if (!body) body = ''

        const prefix = /^[./!#]/.test(body) ? body.match(/^[./!#]/)[0] : '!'
        const isCmd = body.startsWith(prefix)
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')
        const pushname = msg.pushName || 'Usuário'
        const sender = isGroup ? msg.key.participant : msg.key.remoteJid
        
        if (msg.key.fromMe && !isCmd) return

        if (isCmd) {
            console.log(`⚡ Comando: ${command} | Usuário: ${pushname}`)
            if (!msg.key.fromMe) await sock.readMessages([msg.key])

            let menuBuffer = null
            if (['menu', 'help', 'menuadm', 'menufig', 'menujogos', 'menuefeitos', 'menuzoeira', 'menudown', 'menuvip', 'menunsfw', 'menudono', 'menuanime', 'menutinder'].includes(command)) {
                menuBuffer = await getBuffer(imagemMenu)
            }
            
            const sendMenu = async (caption) => {
                if (menuBuffer) await sock.sendMessage(from, { image: menuBuffer, caption: caption }, { quoted: msg })
                else await sock.sendMessage(from, { text: caption }, { quoted: msg })
            }

            switch (command) {
                // MENUS
                case 'menu': case 'help': await sendMenu(menuprime(pushname, new Date().toLocaleDateString(), new Date().toLocaleTimeString(), true, [], prefix)); break
                case 'menutinder': await sendMenu(menutinder(from, prefix)); break
                case 'menuadm': await sendMenu(menuadm(from, prefix)); break
                case 'menufig': await sendMenu(menufig(from, prefix)); break
                case 'menujogos': await sendMenu(menujogos(from, prefix)); break
                case 'menuefeitos': await sendMenu(menuefeitos(from, prefix)); break
                case 'menuzoeira': await sendMenu(menuzoeira(from, prefix)); break
                case 'menudown': await sendMenu(menudown(from, prefix)); break
                case 'menuvip': await sendMenu(menuvip(from, prefix)); break
                case 'menunsfw': await sendMenu(menunsfw(from, prefix)); break
                case 'menudono': await sendMenu(menudono(from, prefix)); break
                case 'menuanime': 
                     const textoAnime = `🌸 *RENANBOT - ANIMES* 🌸\n\n${prefix}neko\n${prefix}waifu\n${prefix}loli\n${prefix}cosplay`
                     await sendMenu(textoAnime)
                     break
                
                // INFO GERAL
                case 'infobot':
                    const timestamp = speed()
                    const latencia = speed() - timestamp
                    const infoText = `🤖 *SISTEMA*\n\n💻 Plataforma: ${os.platform()}\n🧠 Memória: ${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}\n⚡ Velocidade: ${latencia.toFixed(4)}ms\n⏱️ Uptime: ${runtime(process.uptime())}`
                    await sock.sendMessage(from, { image: { url: imagemMenu }, caption: infoText }, { quoted: msg })
                    break

                // ===== MENUZOEIRA =====
                case 'gay': case 'feio': case 'gado': case 'corno':
                    await sock.sendMessage(from, { react: { text: "🔍", key: msg.key } })
                    
                    const porcent = Math.floor(Math.random() * 100) + 1
                    const alvo = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
                    
                    const imgZoeira = await getImageForCommand(command)
                    
                    if (!imgZoeira) {
                        await sock.sendMessage(from, { text: '❌ Erro ao buscar imagem. Tente novamente.' }, { quoted: msg })
                        break
                    }
                    
                    const captionZoeira = `🤣 *ANALISADOR DE ${command.toUpperCase()}*\n\n👤 Alvo: @${alvo.split('@')[0]}\n📊 Nível: *${porcent}%*`
                    
                    await sendImageMessage(sock, from, imgZoeira, captionZoeira, [alvo], msg)
                    break

                case 'pau':
                     const cm = Math.floor(Math.random() * 30) + 1
                     const alvoP = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender
                     await sock.sendMessage(from, { text: `🍆 Tamanho de @${alvoP.split('@')[0]}: *${cm}cm*`, mentions: [alvoP] }, { quoted: msg })
                     break

                // ===== MENUTINDER =====
                case 'casar':
                    const conjuge = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                    if (!conjuge) return sock.sendMessage(from, { text: '💒 Marque alguém para casar!' }, { quoted: msg })
                    
                    await sock.sendMessage(from, { react: { text: "💍", key: msg.key } })
                    
                    const imgCasar = await getImageForCommand('casar')
                    
                    if (!imgCasar) {
                        await sock.sendMessage(from, { text: '❌ Erro ao buscar imagem. Tente novamente.' }, { quoted: msg })
                        break
                    }
                    
                    const captionCasar = `💒 *CASADOS!* 💒\n\n@${sender.split('@')[0]} 💍 @${conjuge.split('@')[0]}\n\n✨ Parabéns aos noivos!`
                    
                    await sendImageMessage(sock, from, imgCasar, captionCasar, [sender, conjuge], msg)
                    break

                case 'divorcio': 
                    await sock.sendMessage(from, { text: '💔 Divórcio realizado! Você está livre novamente.' }, { quoted: msg })
                    break

                case 'shippar':
                    const c1 = sender
                    const c2 = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                    if (!c2) return sock.sendMessage(from, { text: '💘 Marque alguém para shippar!' }, { quoted: msg })
                    
                    await sock.sendMessage(from, { react: { text: "💕", key: msg.key } })
                    
                    const love = Math.floor(Math.random() * 100) + 1
                    const imgLove = await getImageForCommand('shippar')
                    
                    if (!imgLove) {
                        await sock.sendMessage(from, { text: '❌ Erro ao buscar imagem. Tente novamente.' }, { quoted: msg })
                        break
                    }
                    
                    const emoji = love >= 80 ? '💖💖💖' : love >= 50 ? '💕💕' : love >= 30 ? '💗' : '💔'
                    const status = love >= 80 ? 'PERFEITO!' : love >= 50 ? 'BOM MATCH!' : love >= 30 ? 'TALVEZ...' : 'NÃO ROLA'
                    const mLove = `${emoji} *${status}*\n\n💘 Compatibilidade: *${love}%*\n\n👤 @${c1.split('@')[0]}\n❤️ @${c2.split('@')[0]}`
                    
                    await sendImageMessage(sock, from, imgLove, mLove, [c1, c2], msg)
                    break

                case 'topcasal':
                    if (!isGroup) return sock.sendMessage(from, { text: '⚠️ Este comando só funciona em grupos!' }, { quoted: msg })
                    
                    await sock.sendMessage(from, { react: { text: "❤️", key: msg.key } })
                    
                    const mc = await sock.groupMetadata(from)
                    const pc = mc.participants.map(p => p.id)
                    
                    if (pc.length < 2) return sock.sendMessage(from, { text: '⚠️ Grupo precisa ter pelo menos 2 membros!' }, { quoted: msg })
                    
                    const r1 = pc[Math.floor(Math.random() * pc.length)]
                    let r2 = pc[Math.floor(Math.random() * pc.length)]
                    
                    while (r2 === r1 && pc.length > 1) {
                        r2 = pc[Math.floor(Math.random() * pc.length)]
                    }
                    
                    const imgTop = await getImageForCommand('topcasal')
                    
                    if (!imgTop) {
                        await sock.sendMessage(from, { text: '❌ Erro ao buscar imagem. Tente novamente.' }, { quoted: msg })
                        break
                    }
                    
                    const captionTop = `🔥 *CASAL DO DIA* 🔥\n\n💑 @${r1.split('@')[0]} ❤️ @${r2.split('@')[0]}\n\n✨ Combinação perfeita!`
                    
                    await sendImageMessage(sock, from, imgTop, captionTop, [r1, r2], msg)
                    break
                
                // DOWNLOADS
                case 'tiktok':
                    if (!q) return sock.sendMessage(from, { text: '🎵 Envie o link do TikTok!' }, { quoted: msg })
                    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } })
                    try {
                        const { data } = await axios.post('https://www.tikwm.com/api/', { url: q })
                        if (data?.data?.play) {
                            await sock.sendMessage(from, { video: { url: data.data.play }, caption: `🎵 ${data.data.title || 'TikTok Video'}` }, { quoted: msg })
                        } else {
                            await sock.sendMessage(from, { text: '❌ Não foi possível baixar o vídeo.' }, { quoted: msg })
                        }
                    } catch (e) { 
                        await sock.sendMessage(from, { text: '❌ Erro ao processar o link.' }, { quoted: msg })
                    }
                    break
                    
                case 'play':
                    if (!q) return sock.sendMessage(from, { text: '🎧 Digite o nome da música!' }, { quoted: msg })
                    await sock.sendMessage(from, { react: { text: "🎧", key: msg.key } })
                    try {
                        const s = await axios.get(`https://api.agatz.xyz/api/ytmusic?message=${encodeURIComponent(q)}`)
                        if (s.data?.data) {
                            await sock.sendMessage(from, { 
                                audio: { url: s.data.data.downloadUrl }, 
                                mimetype: 'audio/mp4', 
                                ptt: false 
                            }, { quoted: msg })
                        } else {
                            await sock.sendMessage(from, { text: '❌ Música não encontrada.' }, { quoted: msg })
                        }
                    } catch (e) { 
                        await sock.sendMessage(from, { text: '❌ Erro ao buscar música.' }, { quoted: msg })
                    }
                    break
                    
                case 'video':
                     if (!q) return sock.sendMessage(from, { text: '🎬 Digite o nome do vídeo!' }, { quoted: msg })
                     await sock.sendMessage(from, { react: { text: "📹", key: msg.key } })
                     try {
                         const v = await axios.get(`https://api.agatz.xyz/api/ytvideo?message=${encodeURIComponent(q)}`)
                         if (v.data?.data) {
                             await sock.sendMessage(from, { 
                                 video: { url: v.data.data.downloadUrl }, 
                                 caption: v.data.data.title || 'Vídeo' 
                             }, { quoted: msg })
                         } else {
                             await sock.sendMessage(from, { text: '❌ Vídeo não encontrado.' }, { quoted: msg })
                         }
                     } catch (e) {
                         await sock.sendMessage(from, { text: '❌ Erro ao buscar vídeo.' }, { quoted: msg })
                     }
                     break

                // STICKERS
                case 'qc':
                    if (!q) return sock.sendMessage(from, { text: '📝 Digite o texto para criar a figurinha!' }, { quoted: msg })
                    try {
                        let pp = 'https://i.pinimg.com/736x/54/2f/1e/542f1e3f8b5e1f7d9e3e4f5a6b7c8d9e.jpg'
                        try { pp = await sock.profilePictureUrl(sender, 'image') } catch {}
                        const json = { 
                            "type": "quote", 
                            "format": "png", 
                            "backgroundColor": "#FFFFFF", 
                            "width": 512, 
                            "height": 768, 
                            "scale": 2, 
                            "messages": [{ 
                                "entities": [], 
                                "avatar": true, 
                                "from": { 
                                    "id": 1, 
                                    "name": pushname, 
                                    "photo": { "url": pp } 
                                }, 
                                "text": q, 
                                "replyMessage": {} 
                            }] 
                        }
                        const res = await axios.post('https://bot.lyo.su/quote/generate', json)
                        if (res.data?.result?.image) {
                            await sock.sendMessage(from, { 
                                sticker: Buffer.from(res.data.result.image, 'base64') 
                            }, { quoted: msg })
                        }
                    } catch (e) { 
                        await sock.sendMessage(from, { text: '❌ Erro ao criar figurinha.' }, { quoted: msg })
                    }
                    break
                    
                case 'attp':
                    if(!q) return sock.sendMessage(from, { text: '📝 Digite o texto!' }, { quoted: msg })
                    try { 
                        const res = await axios.get(`https://api.hello-world.qotp.me/api/attp?text=${encodeURIComponent(q)}`, {responseType:'arraybuffer'})
                        await sock.sendMessage(from, {sticker:res.data}, {quoted:msg}) 
                    } catch {
                        await sock.sendMessage(from, { text: '❌ Erro ao criar ATTP.' }, { quoted: msg })
                    }
                    break
                    
                case 'ttp':
                    if(!q) return sock.sendMessage(from, { text: '📝 Digite o texto!' }, { quoted: msg })
                    try { 
                        const res = await axios.get(`https://api.hello-world.qotp.me/api/ttp?text=${encodeURIComponent(q)}`, {responseType:'arraybuffer'})
                        await sock.sendMessage(from, {sticker:res.data}, {quoted:msg}) 
                    } catch {
                        await sock.sendMessage(from, { text: '❌ Erro ao criar TTP.' }, { quoted: msg })
                    }
                    break
                
                // REAÇÕES
                case 'pat': case 'kiss': case 'slap': case 'bonk':
                    try {
                        const { data } = await axios.get(`https://api.waifu.pics/sfw/${command}`)
                        const gif = await axios.get(data.url, { responseType: 'arraybuffer' })
                        const p1 = `./temp_${getRandom('.gif')}`
                        const p2 = `./st_${getRandom('.webp')}`
                        fs.writeFileSync(p1, gif.data)
                        exec(`ffmpeg -i ${p1} -vcodec libwebp -filter:v fps=fps=15 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512x512 -t 5 ${p2}`, async (err) => {
                            fs.unlinkSync(p1)
                            if (!err) { 
                                await sock.sendMessage(from, { sticker: fs.readFileSync(p2) }, { quoted: msg })
                                fs.unlinkSync(p2) 
                            }
                        })
                    } catch(e) {
                        await sock.sendMessage(from, { text: '❌ Erro ao criar reação.' }, { quoted: msg })
                    }
                    break

                case 's':
                    const isQ = type === 'extendedTextMessage' && msg.message.extendedTextMessage.contextInfo?.quotedMessage
                    const isM = type === 'imageMessage' || type === 'videoMessage'
                    if (isM || isQ) {
                        try {
                            const mD = isM ? msg : { message: msg.message.extendedTextMessage.contextInfo.quotedMessage }
                            const mime = (isM ? type : Object.keys(mD.message)[0]).replace('Message', '')
                            const stream = await downloadContentFromMessage(mD.message[mime + 'Message'], mime === 'video' ? 'video' : 'image')
                            let buff = Buffer.from([])
                            for await (const chunk of stream) buff = Buffer.concat([buff, chunk])
                            const p1 = `./temp_${getRandom(mime === 'video' ? '.mp4' : '.jpg')}`
                            const p2 = `./st_${getRandom('.webp')}`
                            fs.writeFileSync(p1, buff)
                            exec(`ffmpeg -i ${p1} -vcodec libwebp -filter:v fps=fps=15 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512x512 ${mime === 'video' ? '-t 10' : ''} ${p2}`, async (err) => {
                                fs.unlinkSync(p1)
                                if (!err) { 
                                    await sock.sendMessage(from, { sticker: fs.readFileSync(p2) }, { quoted: msg })
                                    fs.unlinkSync(p2) 
                                }
                            })
                        } catch(e) {
                            await sock.sendMessage(from, { text: '❌ Erro ao criar figurinha.' }, { quoted: msg })
                        }
                    } else {
                        await sock.sendMessage(from, { text: '📷 Envie ou marque uma imagem/vídeo!' }, { quoted: msg })
                    }
                    break
                
                case 'toimg':
                    if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
                        try {
                            const stream = await downloadContentFromMessage(msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker')
                            let buffer = Buffer.from([])
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
                            const rand = getRandom('.webp')
                            const randOut = getRandom('.png')
                            fs.writeFileSync(rand, buffer)
                            exec(`ffmpeg -i ${rand} ${randOut}`, async (err) => {
                                fs.unlinkSync(rand)
                                if (!err) { 
                                    await sock.sendMessage(from, { image: fs.readFileSync(randOut) }, { quoted: msg })
                                    fs.unlinkSync(randOut) 
                                }
                            })
                        } catch (e) {
                            await sock.sendMessage(from, { text: '❌ Erro ao converter figurinha.' }, { quoted: msg })
                        }
                    } else {
                        await sock.sendMessage(from, { text: '🖼️ Marque uma figurinha!' }, { quoted: msg })
                    }
                    break

                // ADMIN
                case 'grupo':
                    if (!isGroup) return sock.sendMessage(from, { text: '⚠️ Use este comando em um grupo!' }, { quoted: msg })
                    const bg = sock.user.id.split(':')[0] + '@s.whatsapp.net'
                    const mg = await sock.groupMetadata(from)
                    if (!mg.participants.filter(p => p.admin).map(p => p.id).includes(bg)) {
                        return sock.sendMessage(from, { text: '⚠️ Bot precisa ser admin!' }, { quoted: msg })
                    }
                    if (args[0] === 'abrir') {
                        await sock.groupSettingUpdate(from, 'not_announcement')
                        await sock.sendMessage(from, { text: '✅ Grupo aberto!' }, { quoted: msg })
                    } else if (args[0] === 'fechar') {
                        await sock.groupSettingUpdate(from, 'announcement')
                        await sock.sendMessage(from, { text: '🔒 Grupo fechado!' }, { quoted: msg })
                    } else {
                        await sock.sendMessage(from, { text: `Use: ${prefix}grupo abrir ou ${prefix}grupo fechar` }, { quoted: msg })
                    }
                    break
                    
                case 'hidetag':
                    if (!isGroup) return sock.sendMessage(from, { text: '⚠️ Use este comando em um grupo!' }, { quoted: msg })
                    const mh = await sock.groupMetadata(from)
                    const txt = q || (msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || '⚠️ Atenção!')
                    await sock.sendMessage(from, { text: txt, mentions: mh.participants.map(p => p.id) })
                    break
                
                // OUTROS
                case 'gpt':
                    if(!q) return sock.sendMessage(from, { text: '🤖 Digite sua pergunta!' }, { quoted: msg })
                    await sock.sendMessage(from, { react: { text: "🤖", key: msg.key } })
                    try { 
                        const g = await axios.get(`https://api.agatz.xyz/api/gpt4?message=${encodeURIComponent(q)}`)
                        await sock.sendMessage(from, { text: g.data.data || 'Sem resposta.' }, {quoted:msg}) 
                    } catch {
                        await sock.sendMessage(from, { text: '❌ Erro ao processar pergunta.' }, { quoted: msg })
                    }
                    break

                // ANIMES
                case 'neko': case 'waifu': case 'hentai': case 'nsfwneko': case 'nsfwtrap': case 'nsfwwaifu':
                     const kind = command === 'neko' ? 'sfw/neko' : 
                                  command === 'hentai' ? 'nsfw/waifu' : 
                                  command === 'nsfwneko' ? 'nsfw/neko' : 
                                  command === 'nsfwtrap' ? 'nsfw/trap' : 
                                  command === 'nsfwwaifu' ? 'nsfw/waifu' : 'sfw/waifu'
                     try { 
                         const {data} = await axios.get(`https://api.waifu.pics/${kind}`)
                         if (data?.url) {
                             await sock.sendMessage(from, {image:{url:data.url}}, {quoted:msg})
                         }
                     } catch {
                         await sock.sendMessage(from, { text: '❌ Erro ao buscar imagem.' }, { quoted: msg })
                     }
                     break

                default: break
            }
        }
    } catch (e) {
        console.error('❌ ERRO GLOBAL:', e)
    }
}

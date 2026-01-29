// ====== CREDITOS ======
case 'creditos':
case 'créditos': {
  let texto = `🧠 *Créditos do Projeto*

👑 Dono: Renan Vargas
🤖 Base: Bot WhatsApp MD
🛠 Ambiente: Termux / Node.js

📌 Projeto desenvolvido para fins educacionais.
`

  conn.sendMessage(m.chat, { text: texto }, { quoted: m })
}
break

// ====== GITHUB ======
case 'github':
case 'git': {
  let texto = `🐙 *GitHub do Projeto*

🔗 Repositório oficial:
https://github.com/Renanvargas/Vemonbot2

⭐ Deixe uma estrela para apoiar o projeto!
`

  conn.sendMessage(m.chat, { text: texto }, { quoted: m })
}
break

// ====== CANAL ======
case 'canal':
case 'channel': {
  let texto = `📢 *Canal Oficial no WhatsApp*

Entre para receber atualizações, novidades e avisos:

👉 https://chat.whatsapp.com/EpmYYQ0J2qSC1SQHruNejD
`

  conn.sendMessage(m.chat, { text: texto }, { quoted: m })
}
break

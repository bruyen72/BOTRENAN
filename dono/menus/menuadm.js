const menuadm = (sender, prefix) => {
return `👮 *RENANBOT v4 - ADMINISTRAÇÃO*

🔧 *Gerenciamento de Membros*
│ ${prefix}ban @usuario
│ ↳ Remove o membro do grupo.
│
│ ${prefix}promover @usuario
│ ↳ Transforma o membro em Admin.
│
│ ${prefix}rebaixar @usuario
│ ↳ Remove o Admin do membro.

⚙️ *Gerenciamento de Grupo*
│ ${prefix}grupo abrir
│ ↳ Libera o chat para todos falarem.
│
│ ${prefix}grupo fechar
│ ↳ Bloqueia o chat (só Admins falam).
│
│ ${prefix}link
│ ↳ Mostra o link de convite atual.
│
│ ${prefix}hidetag [texto]
│ ↳ Notifica todos os membros (invisível).

⚠️ *Requisito:* O Bot precisa ser Admin do grupo.`
}
exports.menuadm = menuadm
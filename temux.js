#!/usr/bin/env node

console.log('🚀 Iniciando Vemonbot2 no Termux...')

require('dotenv').config()

// carrega o arquivo principal de conexão
require('./connect')

// segurança: evita o bot fechar sozinho
process.on('uncaughtException', err => {
  console.error('❌ Erro não tratado:', err)
})

process.on('unhandledRejection', err => {
  console.error('❌ Promise rejeitada:', err)
})

// backend/config/db.js
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // Ex: 'localhost' ou IP do servidor MSSQL
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use true para Azure SQL Database, pode ser false para local
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' // Mude para true para localhost para evitar erros de certificado
    
}
};

async function connectDb() {
  try {
    await sql.connect(config);
    console.log('Conexão com MSSQL estabelecida com sucesso!');
    return sql; // Retorna a instância do pool de conexão
  } catch (err) {
    console.error('Erro ao conectar ao MSSQL:', err);
    process.exit(1); // Encerra a aplicação em caso de erro de conexão
  }
}

module.exports = {
  sql, // Exporta o objeto sql para usar em queries
  connectDb
};
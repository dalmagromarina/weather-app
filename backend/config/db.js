require('dotenv').config(); 

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, 
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', 
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'     
}
};

async function connectDb() {
  try {
    await sql.connect(config);
    console.log('Conexão com MSSQL estabelecida com sucesso!');
    return sql; 
  } catch (err) {
    console.error('Erro ao conectar ao MSSQL:', err);
    process.exit(1); 
  }
}

module.exports = {
  sql, 
  connectDb
};
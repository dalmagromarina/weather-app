// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDb } = require('./config/db');
const weatherRoutes = require('./routes/weatherRoutes'); // Importa as rotas

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Conectar ao banco de dados ao iniciar o servidor
connectDb();

// Rotas da API
app.use('/api', weatherRoutes); // Todas as rotas definidas em weatherRoutes terão o prefixo /api

// Rota de teste
app.get('/', (req, res) => {
  res.send('API de Clima está funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
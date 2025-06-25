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

// Middleware para 404 (rota não encontrada)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Recurso não encontrado. Verifique a URL e o método HTTP.' });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor. Por favor, tente novamente mais tarde.' });
});
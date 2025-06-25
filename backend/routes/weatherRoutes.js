const express = require('express');
const { fetchAndSaveWeather, getSavedWeather } = require('../controllers/weatherController');

const router = express.Router();

// Rota para buscar dados da Meteoblue e salvar no DB
router.post('/weather', fetchAndSaveWeather);

// Rota para obter as previsões salvas no DB (com filtro opcional por data)
router.get('/weather/report', getSavedWeather);

module.exports = router;
// backend/routes/weatherRoutes.js
const express = require('express');
const { fetchAndSaveWeather, getSavedWeather } = require('../controllers/weatherController');

const router = express.Router();

// Rota para buscar dados da Meteoblue e salvar no DB
// CHAME COM: POST /api/weather
router.post('/weather', fetchAndSaveWeather);

// Rota para obter as previsões salvas no DB (com filtro opcional por data)
// CHAME COM: GET /api/weather/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/weather/report', getSavedWeather);

module.exports = router;
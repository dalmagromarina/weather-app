// backend/controllers/weatherController.js
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas
const axios = require('axios');
const sql = require('mssql'); // Importa o mssql
const PrevisaoClima = require('../models/previsaoModel');

// API principal de clima da Meteoblue (pacote basic-day)
const METEOBLUE_API_URL = 'https://my.meteoblue.com/packages/basic-day';
// API de busca de localização da Meteoblue (novo endpoint testado que funcionou)
const METEOBLUE_LOCATION_SEARCH_API_URL = 'https://www.meteoblue.com/en/server/search/query3';

// Função para buscar dados da Meteoblue e salvar no DB
async function fetchAndSaveWeather(req, res) {
  let { latitude, longitude, cidade, startDate, endDate } = req.body;

  // DECLARAÇÃO DE savedCount MOVIDA PARA CÁ
  let savedCount = 0; // <--- MUDANÇA AQUI: Declarado no escopo principal da função

  console.log('Dados recebidos no backend (antes da validação):', { cidade, latitude, longitude, startDate, endDate });

  // Validação inicial ajustada: Deve ter uma cidade preenchida OU (latitude E longitude) preenchidas.
  if (!cidade && (isNaN(latitude) || isNaN(longitude))) {
    console.log('Validação de entrada falhou no backend: Nenhum parâmetro válido fornecido.');
    return res.status(400).json({ message: 'Por favor, forneça uma cidade OU latitude e longitude.' });
  }

  // Se a cidade foi fornecida, tente obter lat/lon dela usando a Location Search API da Meteoblue
  if (cidade) {
    try {
      console.log(`Tentando buscar coordenadas para a cidade: "${cidade}" usando Meteoblue Location API.`);
      const locationResponse = await axios.get(METEOBLUE_LOCATION_SEARCH_API_URL, {
        params: {
          query: cidade, // Parâmetro de busca para o nome da cidade
          apikey: process.env.METEOBLUE_API_KEY,
          format: 'json'
        },
        headers: {
          'User-Agent': 'WeatherApp/1.0 (seuemail@exemplo.com)' // Lembre-se de substituir com um contato real
        }
      });

      console.log('Resposta bruta da Meteoblue Location API:', JSON.stringify(locationResponse.data, null, 2));

      // Verificar se a resposta tem resultados e se a estrutura está como esperado
      if (locationResponse.data && locationResponse.data.results && locationResponse.data.results.length > 0) {
        const firstResult = locationResponse.data.results[0];
        console.log('Primeiro resultado da localização:', firstResult);

        // Extraindo latitude, longitude e nome da cidade dos resultados da API
        latitude = firstResult.lat; // Atribui o valor diretamente. Será uma string numérica ou número.
        longitude = firstResult.lon; // Atribui o valor diretamente. Será uma string numérica ou número.
        cidade = firstResult.name; // Usa o nome oficial retornado pela API

        console.log(`Coordenadas obtidas para "${cidade}": Lat ${latitude}, Lon ${longitude}`);

      } else {
        console.log(`Nenhum resultado encontrado pela Meteoblue Location API para a cidade: "${cidade}".`);
        return res.status(404).json({ message: `Não foi possível encontrar coordenadas para a cidade: ${cidade} usando a Location Search API da Meteoblue.` });
      }
    } catch (locationError) {
      console.error('Erro ao buscar localização na Meteoblue Location Search API:', locationError.message);
      if (locationError.response) {
          console.error('Detalhes do erro da API de Localização (response.data):', locationError.response.data);
          return res.status(locationError.response.status || 500).json({ message: 'Erro na API de Busca de Localização da Meteoblue', details: locationError.response.data });
      }
      return res.status(500).json({ message: 'Erro ao converter nome da cidade em coordenadas usando a Meteoblue API.', details: locationError.message });
    }
  }

  // Validação final de latitude e longitude:
  // Garante que latitude e longitude são números válidos antes de prosseguir
  latitude = Number(latitude); // Converte para número de forma robusta
  longitude = Number(longitude); // Converte para número de forma robusta

  if (isNaN(latitude) || isNaN(longitude)) {
    console.log('Erro: Latitude ou Longitude resultou em NaN após processamento. Lat:', latitude, 'Lon:', longitude);
    return res.status(400).json({ message: 'Latitude e Longitude inválidas após processamento.' });
  }

  // --- Lógica de Cache: Consultar o banco de dados primeiro ---
  try {
    console.log(`Verificando cache no DB para cidade "${cidade}" e período ${startDate || 'qualquer'} a ${endDate || 'qualquer'}.`);
    // Passamos a cidade e as datas de filtro para o método findCachedData
    const cachedData = await PrevisaoClima.findCachedData(cidade, startDate, endDate);

    // Consideramos o cache válido se ele contiver dados (ex: pelo menos 7 dias de previsão)
    // Se o cachedData for vazio, ele não entra aqui.
    // O 'savedCount' agora está definido, então podemos usá-lo se necessário, mas não é usado para cache
    if (cachedData && cachedData.length > 0) {
        console.log(`Dados encontrados em cache para "${cidade}" para ${cachedData.length} dias. Retornando cache.`);
        // Note: Se for retornar o cache, o frontend vai carregar o relatório a partir da GET /api/weather/report.
        // A requisição POST aqui só serve para "acionar" a busca. Se você quiser que a resposta do POST traga o CACHE,
        // precisaria retornar os dados aqui também. Por enquanto, a lógica assume que o frontend faz um GET separado para o relatório.
        return res.status(200).json({
            message: `${cachedData.length} previsões encontradas em cache para ${cidade || 'coordenadas fornecidas'}.`,
            city_name_official: cidade,
            cached: true // Indica ao frontend que é cache
        });
    }
    console.log('Dados não encontrados no cache ou cache insuficiente. Buscando na API externa.');

    // --- Se não há cache, procede com a chamada à API externa e salva ---
    console.log(`Buscando previsão climática para Lat: ${latitude}, Lon: ${longitude} (${cidade || 'coordenadas fornecidas'}) na Meteoblue Basic-Day API.`);
    const response = await axios.get(METEOBLUE_API_URL, {
      params: {
        apikey: process.env.METEOBLUE_API_KEY,
        lat: latitude,
        lon: longitude,
        asl: 0, // Altitude above sea level (pode ser ajustado se relevante)
        format: 'json'
      }
    });

    const weatherData = response.data;
    const dailyData = weatherData.data_day;

    console.log('Dados diários da Meteoblue Basic-Day API (antes do loop de inserção):', JSON.stringify(dailyData, null, 2));

    if (!dailyData || !dailyData.time || dailyData.time.length === 0) {
      console.log('Dados de previsão diária não encontrados ou vazios na resposta da Meteoblue.');
      return res.status(404).json({ message: 'Dados de previsão não encontrados para as coordenadas fornecidas pela Meteoblue.' });
    }

    savedCount = 0; // REINICIALIZA savedCount antes do loop, se a busca na API ocorreu
    for (let i = 0; i < dailyData.time.length; i++) {
      const previsao = {
        DataPrevisao: dailyData.time[i],
        TemperaturaMin: dailyData.temperature_min[i] || 0,
        TemperaturaMax: dailyData.temperature_max[i] || 0,
        CondicoesClimaticas: dailyData.pictocode[i] ? String(dailyData.pictocode[i]) : 'Desconhecido',
        VelocidadeVento: dailyData.windspeed_max[i] || 0,
        DirecaoVento: dailyData.winddirection[i] !== undefined && dailyData.winddirection[i] !== null ? String(dailyData.winddirection[i]) : 'N/A',
        ProbabilidadePrecipitacao: dailyData.precipitation_probability[i] || 0,
        Cidade: cidade || 'Desconhecida',
        Latitude: latitude,
        Longitude: longitude,
      };

      console.log(`Objeto previsao para o dia ${dailyData.time[i]} (antes da inserção no DB):`, previsao);

      await PrevisaoClima.create(previsao);
      savedCount++;
    }

    res.status(200).json({
      message: `${savedCount} previsões salvas com sucesso para ${cidade || 'coordenadas fornecidas'}.`,
      city_name_official: cidade
    });

  } catch (error) {
    console.error('Erro geral ao buscar dados da Meteoblue ou salvar no DB:', error.message);
    if (error.response) {
      console.error('Detalhes do erro da API Meteoblue (response.data):', error.response.data);
      res.status(error.response.status).json({ message: 'Erro na API Meteoblue', details: error.response.data });
    } else if (error.request) {
      console.error('Nenhuma resposta recebida da API Meteoblue:', error.request);
      res.status(500).json({ message: 'Nenhuma resposta recebida da API Meteoblue.' });
    } else {
      console.error('Erro na configuração da requisição Axios ou outro erro:', error.message);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
}

// Função para obter previsões do DB
// Já tem a lógica de 1 registro por data e filtro de colunas preenchidas
// Esta função é chamada PELO FRONTEND para carregar o relatório, não pela lógica de cache.
async function getSavedWeather(req, res) {
  try {
    const { startDate, endDate, cidade } = req.query;

    let previsoes;
    if (cidade) {
      console.log(`Recebido no getSavedWeather (backend):`, { cidade, startDate, endDate });
      console.log(`Buscando previsões para a cidade: "${cidade}" no banco de dados.`);
      const request = new sql.Request();
      request.input('cidadeParam', sql.NVarChar, cidade);

      let query = `
        WITH RankedPrevisoes AS (
            SELECT
                Id, DataPrevisao, TemperaturaMin, TemperaturaMax,
                ISNULL(p.Descricao, pc.CondicoesClimaticas) AS CondicoesClimaticas,
                VelocidadeVento, DirecaoVento, ProbabilidadePrecipitacao, Cidade,
                Latitude, Longitude, DataRegistro,
                ROW_NUMBER() OVER (PARTITION BY DataPrevisao, Cidade ORDER BY DataRegistro DESC) as rn
            FROM
                PrevisaoClima pc
            LEFT JOIN
                Pictogramas p ON pc.CondicoesClimaticas = p.Codigo
            WHERE
                LOWER(pc.Cidade) = LOWER(@cidadeParam)
                AND TemperaturaMin IS NOT NULL AND TemperaturaMax IS NOT NULL AND CondicoesClimaticas IS NOT NULL
                AND VelocidadeVento IS NOT NULL AND DirecaoVento IS NOT NULL AND ProbabilidadePrecipitacao IS NOT NULL
      `;
      
      if (startDate && endDate) {
        query += ` AND DataPrevisao >= @startDateParam AND DataPrevisao < DATEADD(day, 1, @endDateParam)`;
        request.input('startDateParam', sql.Date, startDate);
        request.input('endDateParam', sql.Date, endDate);
      }
      query += `)
        SELECT Id, DataPrevisao, TemperaturaMin, TemperaturaMax, CondicoesClimaticas,
               VelocidadeVento, DirecaoVento, ProbabilidadePrecipitacao, Cidade,
               Latitude, Longitude, DataRegistro
        FROM RankedPrevisoes
        WHERE rn = 1
        ORDER BY DataPrevisao ASC;`;
      
      console.log('Query SQL executada (filtro de 1 registro por data e colunas preenchidas):', query);
      console.log('Parâmetro SQL para cidade:', cidade);
      console.log('Parâmetros de data para o SQL: startDateParam =', startDate, ', endDateParam (calculado) = ', endDate);

      const result = await request.query(query);
      previsoes = result.recordset;

    } else if (startDate && endDate) {
      console.log(`Buscando previsões entre ${startDate} e ${endDate} no banco de dados.`);
      const request = new sql.Request();
      request.input('startDateParam', sql.Date, startDate);
      request.input('endDateParam', sql.Date, endDate);
      
      let query = `
        WITH RankedPrevisoes AS (
            SELECT
                Id, DataPrevisao, TemperaturaMin, TemperaturaMax,
                ISNULL(p.Descricao, pc.CondicoesClimaticas) AS CondicoesClimaticas,
                VelocidadeVento, DirecaoVento, ProbabilidadePrecipitacao, Cidade,
                Latitude, Longitude, DataRegistro,
                ROW_NUMBER() OVER (PARTITION BY DataPrevisao, Cidade ORDER BY DataRegistro DESC) as rn
            FROM
                PrevisaoClima pc
            LEFT JOIN
                Pictogramas p ON pc.CondicoesClimaticas = p.Codigo
            WHERE
                DataPrevisao >= @startDateParam AND DataPrevisao < DATEADD(day, 1, @endDateParam)
                AND TemperaturaMin IS NOT NULL AND TemperaturaMax IS NOT NULL AND CondicoesClimaticas IS NOT NULL
                AND VelocidadeVento IS NOT NULL AND DirecaoVento IS NOT NULL AND ProbabilidadePrecipitacao IS NOT NULL
        )
        SELECT Id, DataPrevisao, TemperaturaMin, TemperaturaMax, CondicoesClimaticas,
               VelocidadeVento, DirecaoVento, ProbabilidadePrecipitacao, Cidade,
               Latitude, Longitude, DataRegistro
        FROM RankedPrevisoes
        WHERE rn = 1
        ORDER BY DataPrevisao ASC;`;
      console.log('Query SQL executada (filtro de 1 registro por data, apenas por data):', query);
      const result = await request.query(query);
      previsoes = result.recordset;

    } else {
      console.log('Buscando todas as previsões no banco de dados.');
      const query = `
        WITH RankedPrevisoes AS (
            SELECT
                Id, DataPrevisao, TemperaturaMin, TemperaturaMax,
                ISNULL(p.Descricao, pc.CondicoesClimaticas) AS CondicoesClimaticas,
                VelocidadeVento, DirecaoVento, ProbabilidadePrecipitacao, Cidade,
                Latitude, Longitude, DataRegistro,
                ROW_NUMBER() OVER (PARTITION BY DataPrevisao, Cidade ORDER BY DataRegistro DESC) as rn
            FROM
                PrevisaoClima pc
            LEFT JOIN
                Pictogramas p ON pc.CondicoesClimaticas = p.Codigo
            WHERE
                TemperaturaMin IS NOT NULL AND TemperaturaMax IS NOT NULL AND CondicoesClimaticas IS NOT NULL
                AND VelocidadeVento IS NOT NULL AND DirecaoVento IS NOT NULL AND ProbabilidadePrecipitacao IS NOT NULL
        )
        SELECT Id, DataPrevisao, TemperaturaMin, TemperaturaMax, CondicoesClimaticas,
               VelocidadeVento, DirecaoVento, ProbabilidadePrecipitacao, Cidade,
               Latitude, Longitude, DataRegistro
        FROM RankedPrevisoes
        WHERE rn = 1
        ORDER BY DataPrevisao ASC;`;
      console.log('Query SQL executada (todos os registros, 1 por data):', query);
      const result = await sql.query(query);
      previsoes = result.recordset;
    }

    res.status(200).json(previsoes);
  } catch (error) {
    console.error('Erro ao buscar previsões salvas:', error.message);
    res.status(500).json({ message: 'Erro ao buscar previsões salvas.', details: error.message });
  }
}

module.exports = {
  fetchAndSaveWeather,
  getSavedWeather
};
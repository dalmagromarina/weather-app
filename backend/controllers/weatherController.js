require('dotenv').config(); 
const axios = require('axios');
const sql = require('mssql'); 
const PrevisaoClima = require('../models/previsaoModel');

// API principal de clima da Meteoblue (pacote basic-day)
const METEOBLUE_API_URL = 'https://my.meteoblue.com/packages/basic-day';
// API de busca de localização da Meteoblue (novo endpoint testado que funcionou)
const METEOBLUE_LOCATION_SEARCH_API_URL = 'https://www.meteoblue.com/en/server/search/query3';

// Função para buscar dados da Meteoblue e salvar no DB
async function fetchAndSaveWeather(req, res) {
  let { latitude, longitude, cidade, startDate, endDate } = req.body; 

  console.log('Dados recebidos no backend (antes da validação):', { cidade, latitude, longitude, startDate, endDate });

  // Validação inicial: Deve ter uma cidade preenchida OU (latitude E longitude) preenchidas.
  if (!cidade && (isNaN(latitude) || isNaN(longitude))) {
    console.log('Validação de entrada falhou no backend: Nenhum parâmetro válido fornecido.');
    return res.status(400).json({ message: 'Por favor, forneça uma cidade OU latitude e longitude.' });
  }

  let officialCityName = cidade; 

  // Se a cidade foi fornecida, tente obter lat/lon dela usando a Location Search API da Meteoblue
  if (cidade) {
    try {
      console.log(`Tentando buscar coordenadas para a cidade: "${cidade}" usando Meteoblue Location API.`);
      const locationResponse = await axios.get(METEOBLUE_LOCATION_SEARCH_API_URL, {
        params: {
          query: cidade, 
          apikey: process.env.METEOBLUE_API_KEY,
          format: 'json'
        },
        headers: {
          'User-Agent': 'WeatherApp/1.0 (marinadalmagro@outlook.com)' 
        }
      });

      //console.log('Resposta bruta da Meteoblue Location API:', JSON.stringify(locationResponse.data, null, 2));
      
      if (locationResponse.data && locationResponse.data.results && locationResponse.data.results.length > 0) {
        const firstResult = locationResponse.data.results[0];
        console.log('Primeiro resultado da localização:', firstResult);

        latitude = firstResult.lat;
        longitude = firstResult.lon;
        officialCityName = firstResult.name;
        
        //console.log(`Coordenadas obtidas para "${officialCityName}": Lat ${latitude}, Lon ${longitude}`);

      } else {
        //console.log(`Nenhum resultado encontrado pela Meteoblue Location API para a cidade: "${cidade}".`);
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
  } else {
    officialCityName = 'Coordenadas Fornecidas';
  }

  latitude = Number(latitude);
  longitude = Number(longitude);

  if (isNaN(latitude) || isNaN(longitude)) {
    console.log('Erro: Latitude ou Longitude resultou em NaN após processamento. Lat:', latitude, 'Lon:', longitude);
    return res.status(400).json({ message: 'Latitude e Longitude inválidas após processamento.' });
  }

  try {
    console.log(`Buscando previsão climática para Lat: ${latitude}, Lon: ${longitude} (${officialCityName || 'coordenadas fornecidas'}) na Meteoblue Basic-Day API.`);
    const response = await axios.get(METEOBLUE_API_URL, {
      params: {
        apikey: process.env.METEOBLUE_API_KEY,
        lat: latitude,
        lon: longitude,
        asl: 0,
        format: 'json'
      }
    });

    const weatherData = response.data;
    const dailyData = weatherData.data_day;

    //console.log('Dados diários da Meteoblue Basic-Day API (antes do loop de inserção):', JSON.stringify(dailyData, null, 2));

    if (!dailyData || !dailyData.time || dailyData.time.length === 0) {
      console.log('Dados de previsão diária não encontrados ou vazios na resposta da Meteoblue.');
      return res.status(404).json({ message: 'Dados de previsão não encontrados para as coordenadas fornecidas pela Meteoblue.' });
    }

    let savedCount = 0;
    for (let i = 0; i < dailyData.time.length; i++) {
      const previsao = {
        DataPrevisao: dailyData.time[i],
        TemperaturaMin: dailyData.temperature_min[i] || 0,
        TemperaturaMax: dailyData.temperature_max[i] || 0,
        CondicoesClimaticas: dailyData.pictocode[i] ? String(dailyData.pictocode[i]) : 'Desconhecido',
        VelocidadeVento: dailyData.windspeed_max[i] || 0,
        DirecaoVento: dailyData.winddirection[i] !== undefined && dailyData.winddirection[i] !== null ? String(dailyData.winddirection[i]) : 'N/A',
        ProbabilidadePrecipitacao: dailyData.precipitation_probability[i] || 0,
        Cidade: officialCityName,
        Latitude: latitude,
        Longitude: longitude,
      };

      await PrevisaoClima.create(previsao);
      savedCount++;
    }

    res.status(200).json({
      message: `${savedCount} previsões salvas com sucesso para ${officialCityName || 'coordenadas fornecidas'}.`,
      city_name_official: officialCityName
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
async function getSavedWeather(req, res) {
  try {
    const { startDate, endDate, cidade, latitude, longitude } = req.query; 

    let previsoes;
    if (cidade && cidade !== 'Coordenadas Fornecidas') { 
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
                AND VelocidadeVento IS NOT NULL AND DirecaoVento IS NOT NULL AND ProbabilidadePrecipitacao IS NOT NULL -- Corrigido aqui
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

    } else if (!isNaN(latitude) && !isNaN(longitude)) { 
        console.log(`Recebido no getSavedWeather (backend):`, { latitude, longitude, startDate, endDate });
        console.log(`Buscando previsões para Lat: ${latitude}, Lon: ${longitude} no banco de dados.`);
        const request = new sql.Request();
        request.input('latitudeParam', sql.Decimal(9,6), latitude);
        request.input('longitudeParam', sql.Decimal(9,6), longitude);

        let query = `
            WITH RankedPrevisoes AS (
                SELECT
                    Id, DataPrevisao, TemperaturaMin, TemperaturaMax,
                    ISNULL(p.Descricao, pc.CondicoesClimaticas) AS CondicoesClimaticas,
                    VelocidadeVento, DirecaoVento, ProbabilidadePrecipitacao, Cidade,
                    Latitude, Longitude, DataRegistro,
                    ROW_NUMBER() OVER (PARTITION BY DataPrevisao, Latitude, Longitude ORDER BY DataRegistro DESC) as rn
                FROM
                    PrevisaoClima pc
                LEFT JOIN
                    Pictogramas p ON pc.CondicoesClimaticas = p.Codigo
                WHERE
                    pc.Latitude = @latitudeParam AND pc.Longitude = @longitudeParam
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
        
        console.log('Query SQL executada (filtro por lat/lon, 1 registro por data):', query);
        console.log('Parâmetros SQL para lat/lon: Latitude =', latitude, ', Longitude =', longitude);
        
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
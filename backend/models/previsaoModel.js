// backend/models/previsaoModel.js
const { sql } = require('../config/db');

class PrevisaoClima {
  static async create(previsao) {
    try {
      // Log para depuração: O que o modelo está recebendo para inserir
      console.log('Objeto previsao recebido no modelo para inserção (para o DB):', previsao);
      
      const request = new sql.Request(); // Crie um objeto Request para usar input()

      // Define os parâmetros explicitamente para garantir o tipo e evitar inferência ambígua
      // Isso é crucial para colunas DATETIME/DATE e DECIMAIS. Tamanhos também especificados para NVARCHAR.
      request.input('DataPrevisaoParam', sql.Date, previsao.DataPrevisao);
      request.input('TemperaturaMinParam', sql.Decimal(5,2), previsao.TemperaturaMin);
      request.input('TemperaturaMaxParam', sql.Decimal(5,2), previsao.TemperaturaMax);
      request.input('CondicoesClimaticasParam', sql.NVarChar(255), previsao.CondicoesClimaticas);
      request.input('VelocidadeVentoParam', sql.Decimal(5,2), previsao.VelocidadeVento);
      request.input('DirecaoVentoParam', sql.NVarChar(50), previsao.DirecaoVento); // Tamanho para DirecaoVento
      request.input('ProbabilidadePrecipitacaoParam', sql.Decimal(5,2), previsao.ProbabilidadePrecipitacao);
      request.input('CidadeParam', sql.NVarChar(255), previsao.Cidade);
      request.input('LatitudeParam', sql.Decimal(9,6), previsao.Latitude);
      request.input('LongitudeParam', sql.Decimal(9,6), previsao.Longitude);

      const result = await request.query`
        INSERT INTO PrevisaoClima (
          DataPrevisao,
          TemperaturaMin,
          TemperaturaMax,
          CondicoesClimaticas,
          VelocidadeVento,
          DirecaoVento,
          ProbabilidadePrecipitacao,
          Cidade,
          Latitude,
          Longitude
        ) VALUES (
          @DataPrevisaoParam,
          @TemperaturaMinParam,
          @TemperaturaMaxParam,
          @CondicoesClimaticasParam,
          @VelocidadeVentoParam,
          @DirecaoVentoParam,
          @ProbabilidadePrecipitacaoParam,
          @CidadeParam,
          @LatitudeParam,
          @LongitudeParam
        );
      `;
      return result.rowsAffected[0]; // Retorna 1 se a inserção foi bem-sucedida
    } catch (err) {
      console.error('Erro ao inserir previsão no banco de dados (modelo):', err);
      throw err;
    }
  }

  static async findAll() {
    try {
      const result = await sql.query`
        SELECT *
        FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (PARTITION BY DataPrevisao, Cidade ORDER BY DataRegistro DESC) as rn
            FROM
                PrevisaoClima
            WHERE
                TemperaturaMin IS NOT NULL AND TemperaturaMax IS NOT NULL AND CondicoesClimaticas IS NOT NULL
                AND VelocidadeVento IS NOT NULL AND DirecaoVento IS NOT NULL AND ProbabilidadePrecipitacao IS NOT NULL
        ) AS RankedPrevisoes
        WHERE rn = 1
        ORDER BY DataPrevisao ASC;`; // MUDANÇA: Aplicado filtro de 1 por data e colunas preenchidas
      return result.recordset;
    } catch (err) {
      console.error('Erro ao buscar previsões do banco de dados:', err);
      throw err;
    }
  }

  static async findByDateRange(startDate, endDate) {
    try {
      const request = new sql.Request(); // Usar request para parâmetros nomeados
      request.input('startDateParam', sql.Date, startDate);
      request.input('endDateParam', sql.Date, endDate);
      
      const result = await request.query`
        SELECT *
        FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (PARTITION BY DataPrevisao, Cidade ORDER BY DataRegistro DESC) as rn
            FROM
                PrevisaoClima
            WHERE
                DataPrevisao >= @startDateParam AND DataPrevisao < DATEADD(day, 1, @endDateParam)
                AND TemperaturaMin IS NOT NULL AND TemperaturaMax IS NOT NULL AND CondicoesClimaticas IS NOT NULL
                AND VelocidadeVento IS NOT NULL AND DirecaoVento IS NOT NULL AND ProbabilidadePrecipitacao IS NOT NULL
        ) AS RankedPrevisoes
        WHERE rn = 1
        ORDER BY DataPrevisao ASC;`; // MUDANÇA: Aplicado filtro de 1 por data e colunas preenchidas
      return result.recordset;
    } catch (err) {
      console.error('Erro ao buscar previsões por data:', err);
      throw err;
    }
  }

  // NOVO MÉTODO: findCachedData para a lógica de cache
  static async findCachedData(cidade, startDate, endDate) {
    try {
      const request = new sql.Request();
      
      let query = `
        SELECT *
        FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (PARTITION BY DataPrevisao, Cidade ORDER BY DataRegistro DESC) as rn
            FROM
                PrevisaoClima
            WHERE
                LOWER(Cidade) = LOWER(@cidadeParam)
                AND TemperaturaMin IS NOT NULL AND TemperaturaMax IS NOT NULL AND CondicoesClimaticas IS NOT NULL
                AND VelocidadeVento IS NOT NULL AND DirecaoVento IS NOT NULL AND ProbabilidadePrecipitacao IS NOT NULL
      `;
      request.input('cidadeParam', sql.NVarChar(255), cidade);

      if (startDate && endDate) {
        query += ` AND DataPrevisao >= @startDateParam AND DataPrevisao < DATEADD(day, 1, @endDateParam)`;
        request.input('startDateParam', sql.Date, startDate);
        request.input('endDateParam', sql.Date, endDate);
      } else {
        // Se não há filtro de data, buscar um número mínimo de dias para considerar o cache "completo"
        // Por exemplo, buscar os próximos 7 dias a partir de hoje
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Dia seguinte
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7); // Daqui a 7 dias

        query += ` AND DataPrevisao >= @todayParam AND DataPrevisao < DATEADD(day, 1, @sevenDaysLaterParam)`;
        request.input('todayParam', sql.Date, today.toISOString().slice(0, 10)); // Formato YYYY-MM-DD
        request.input('sevenDaysLaterParam', sql.Date, sevenDaysLater.toISOString().slice(0, 10)); // Formato YYYY-MM-DD
      }

      query += `) AS RankedPrevisoes
        WHERE rn = 1
        ORDER BY DataPrevisao ASC;`;

      console.log('Query SQL para buscar cache executada:', query);
      const result = await request.query(query);
      return result.recordset;

    } catch (err) {
      console.error('Erro ao buscar dados em cache:', err);
      throw err;
    }
  }
}

module.exports = PrevisaoClima;
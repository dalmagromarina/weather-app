IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'db_previsao_clima')
BEGIN
    CREATE DATABASE db_previsao_clima;
END
GO
USE db_previsao_clima;
GO


IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PrevisaoClima' and xtype='U')
BEGIN
    CREATE TABLE PrevisaoClima (
        Id INT PRIMARY KEY IDENTITY(1,1),
        DataPrevisao DATE NOT NULL,
        TemperaturaMin DECIMAL(5, 2) NOT NULL,
        TemperaturaMax DECIMAL(5, 2) NOT NULL,
        CondicoesClimaticas NVARCHAR(255) NOT NULL,
        VelocidadeVento DECIMAL(5, 2),
        DirecaoVento NVARCHAR(50),
        ProbabilidadePrecipitacao DECIMAL(5, 2),
        Cidade NVARCHAR(255),
        Latitude DECIMAL(9, 6),
        Longitude DECIMAL(9, 6),
        DataRegistro DATETIME DEFAULT GETDATE()
    );
    PRINT 'Tabela PrevisaoClima criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela PrevisaoClima já existe.';
END

-- Script SQL para criar a tabela Pictogramas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pictogramas' and xtype='U')
BEGIN
    CREATE TABLE Pictogramas (
        Codigo INT PRIMARY KEY,
        Descricao NVARCHAR(255) NOT NULL
    );
    PRINT 'Tabela Pictogramas criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'A tabela Pictogramas já existe.';
END
GO

-- Script SQL para inserir os dados na tabela Pictogramas
-- Use INSERT OR UPDATE (MERGE) se precisar rodar isso várias vezes
MERGE Pictogramas AS TARGET
USING (VALUES
    (1, 'Céu limpo, sem nuvens'),
    (2, 'Céu limpo e poucas nuvens'),
    (3, 'Parcialmente nublado'),
    (4, 'Nublado'),
    (5, 'Nevoeiro'),
    (6, 'Nublado com chuva'),
    (7, 'Misto com chuvas'),
    (8, 'Chuvas, trovoadas prováveis'),
    (9, 'Nublado com neve'),
    (10, 'Misto com pancadas de neve'),
    (11, 'Predominantemente nublado com mistura de neve e chuva'),
    (12, 'Nublado com chuva ocasional'),
    (13, 'Nublado com neve ocasional'),
    (14, 'Predominantemente nublado com chuva'),
    (15, 'Predominantemente nublado com neve'),
    (16, 'Predominantemente nublado com chuva ocasional'),
    (17, 'Predominantemente nublado com neve ocasional'),
    (18, 'Não utilizado'),
    (19, 'Não utilizado'),
    (20, 'Predominantemente nublado'),
    (21, 'Predominantemente limpo com chance de trovoadas locais'),
    (22, 'Parcialmente nublado com chance de trovoadas locais'),
    (23, 'Parcialmente nublado com trovoadas e chuvas possíveis'),
    (24, 'Nublado com trovoadas e chuvas fortes'),
    (25, 'Predominantemente nublado com trovoadas e chuvas')
) AS SOURCE (Codigo, Descricao)
ON TARGET.Codigo = SOURCE.Codigo
WHEN MATCHED THEN
    UPDATE SET Descricao = SOURCE.Descricao
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Codigo, Descricao) VALUES (SOURCE.Codigo, SOURCE.Descricao);
GO
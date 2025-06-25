# Aplicativo de Previsão do Tempo - TORFRESMA

Este é um aplicativo web fullstack desenvolvido como exercício de avaliação para a TORFRESMA. Ele permite aos usuários buscar a previsão do tempo para cidades ou coordenadas geográficas, visualizar os dados em um relatório tabular e em gráficos interativos, com persistência dos dados em um banco de dados SQL Server.

## Índice

1.  [Funcionalidades](#funcionalidades)
2.  [Como Executar o Projeto](#como-executar-o-projeto)
    * [Pré-requisitos](#pré-requisitos)
    * [1. Clonar o Repositório](#1-clonar-o-repositório)
    * [2. Configurar o Banco de Dados (MSSQL)](#2-configurar-o-banco-de-dados-mssql)
    * [3. Configurar Variáveis de Ambiente](#3-configurar-variáveis-de-ambiente)
    * [4. Instalar Dependências](#4-instalar-dependências)
    * [5. Iniciar os Servidores](#5-iniciar-os-servidores)
3.  [Uso da Aplicação](#uso-da-aplicação)
4.  [Qualidade do Código e Boas Práticas](#qualidade-do-código-e-boas-práticas)
5.  [Contribuição (Opcional)](#contribuição-opcional)

## Funcionalidades

* **Busca de Previsão:**
    * [cite_start]Buscar previsão do tempo para os próximos dias informando o nome de uma cidade.
    * [cite_start]Alternativamente, buscar previsão do tempo informando a latitude e longitude.
    * [cite_start]Utiliza a API de clima da Meteoblue para obter os dados.
* **Armazenamento de Dados:**
    * [cite_start]Os dados de previsão (temperatura min/max, condições climáticas, vento, probabilidade de precipitação, etc.) são armazenados em um banco de dados relacional SQL Server.
    * Garante que apenas 1 registro por data (o mais recente) seja armazenado e exibido no relatório, evitando duplicidade.
* **Relatório de Previsão:**
    * [cite_start]Exibe os dados históricos de previsão do tempo em um formato de relatório tabular.
    * Mostra a descrição das condições climáticas (ex: "Céu limpo") em vez de códigos numéricos, com mapeamento feito no banco de dados.
    * [cite_start]Filtro por data: Permite ao usuário visualizar previsões de uma data específica ou de um intervalo de dias.
    * Ordenação dos dados por data ascendente no relatório.
* **Visualização Gráfica:**
    * [cite_start]Apresenta gráficos interativos (linhas para temperatura, barras para precipitação) para uma melhor análise visual dos dados, utilizando a biblioteca ApexCharts.
* **Tecnologias Utilizadas:**
    * [cite_start]**Frontend:** React.
    * [cite_start]**Backend:** Node.js com Express.
    * [cite_start]**Banco de Dados:** MSSQL (Microsoft SQL Server).
    * **ORM/SQL Builder:** mssql (driver para Node.js) e queries T-SQL. [cite_start]Pode ser utilizado Prisma para criação de tabelas.
    * [cite_start]**Gráficos:** ApexCharts.
    * [cite_start]**Controle de Versão:** Git e GitHub.

## Como Executar o Projeto

Siga estas instruções para configurar e executar a aplicação em seu ambiente local.

### Pré-requisitos

Certifique-se de ter o seguinte software instalado:

* **Node.js** (versão LTS recomendada, v18+ ou v20+).
* **npm** (gerenciador de pacotes do Node.js, geralmente vem com o Node.js).
* **Microsoft SQL Server** (Express Edition ou Developer Edition são boas opções para desenvolvimento).
* **SQL Server Management Studio (SSMS)** ou **Azure Data Studio** (para gerenciar seu banco de dados).
* **Git**.
* Uma **chave de API da Meteoblue**. Você pode obtê-la em [Meteoblue Weather API](https://www.meteoblue.com/weather-api).

### 1. Clonar o Repositório

Primeiro, clone este repositório para sua máquina local:

```bash
git clone [URL_DO_SEU_REPOSITORIO_GITHUB]
cd nome-do-seu-repositorio
```
### 2. Configurar o Banco de Dados (MSSQL)
Crie um Banco de Dados:
Abra o SSMS ou Azure Data Studio, conecte-se ao seu SQL Server e crie um novo banco de dados. Sugerimos o nome db_previsao_clima.

Crie as Tabelas:
Execute os seguintes scripts SQL no seu banco de dados db_previsao_clima.

Configurar Login no SQL Server:

Autenticação SQL Server (Usuário e Senha): Se você pretende usar um login SQL Server (como sa), defina uma senha forte para ele e certifique-se de que o SQL Server está configurado para "Mixed Mode Authentication" (Modo de Autenticação SQL Server e Windows).

Autenticação Windows: Se preferir, você pode usar seu usuário Windows que está executando a aplicação. Nesse caso, certifique-se de que seu usuário Windows tenha permissões de db_owner (ou similar) no banco de dados db_previsao_clima.

### 3. Configurar Variáveis de Ambiente
Na pasta backend, crie um arquivo chamado .env (se já não existir) e preencha-o com suas credenciais de banco de dados e sua chave de API da Meteoblue.

Substitua SuaSenhaSeguraAqui e SuaChaveDaAPIMeteoblueAqui pelos seus valores reais.
Ajuste DB_SERVER se sua instância do SQL Server não for localhost (ex: localhost\SQLEXPRESS).

### 4. Instalar Dependências
No terminal, navegue para as pastas backend e frontend separadamente e instale as dependências:
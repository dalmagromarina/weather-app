# Aplicativo de Previsão do Tempo - TORFRESMA

Este é um aplicativo web fullstack desenvolvido como exercício de avaliação para a TORFRESMA. Ele permite aos usuários buscar a previsão do tempo para cidades ou coordenadas geográficas, visualizar os dados em um relatório tabular e em gráficos interativos, com persistência dos dados em um banco de dados SQL Server.

## Índice

1.  [Tecnologias Utilizadas](#tecnologias-utilizadas)
2.  [Funcionalidades](#funcionalidades)
3.  [Como Executar o Projeto](#como-executar-o-projeto)
    * [Pré-requisitos](#pré-requisitos)
    * [1. Clonar o Repositório](#1-clonar-o-repositório)
    * [2. Configurar o Banco de Dados (MSSQL)](#2-configurar-o-banco-de-dados-mssql)
    * [3. Configurar Variáveis de Ambiente](#3-configurar-variáveis-de-ambiente)
    * [4. Instalar Dependências](#4-instalar-dependências)
    * [5. Iniciar os Servidores](#5-iniciar-os-servidores)
4.  [Uso da Aplicação](#uso-da-aplicação)
5.  [Qualidade do Código e Boas Práticas](#qualidade-do-código-e-boas-práticas)

### Tecnologias Utilizadas
O projeto é dividido em duas partes principais: Frontend (cliente) e Backend (servidor), cada uma com suas próprias tecnologias.

**Frontend (React.js)**
* **React.js**: Biblioteca JavaScript para construção da interface do usuário.
* **HTML/CSS**: Estruturação e estilização dos componentes visuais.
* **Axios/Fetch API**: Para fazer requisições HTTP ao backend.
* **Node.js** (com npm/yarn): Ambiente de execução JavaScript para gerenciamento de dependências.

**Backend (Node.js com Express e SQL Server)**
* **Node.js**: Ambiente de execução JavaScript.
* **Express.js**: Framework web rápido e minimalista para Node.js, utilizado para construir a API RESTful.
* **SQL Server (MSSQL)**: Sistema de Gerenciamento de Banco de Dados Relacional para armazenamento das previsões.
* *mssql* npm package: Driver para conectar Node.js ao SQL Server.
* *axios*  npm package: Cliente HTTP para fazer requisições à API externa da Meteoblue.
* *dotenv*  npm package: Para carregar variáveis de ambiente de um arquivo .env.
* CORS (*cors* npm package): Middleware para habilitar o Cross-Origin Resource Sharing.

## Funcionalidades

* **Busca de Previsão:**
    * [cite_start] Buscar previsão do tempo para os próximos dias informando o nome de uma cidade.
    * [cite_start] Alternativamente, buscar previsão do tempo informando a latitude e longitude.
    * [cite_start] Utiliza a API de clima da Meteoblue para obter os dados.
* **Armazenamento de Dados:**
    * [cite_start] Os dados de previsão (temperatura min/max, condições climáticas, vento, probabilidade de precipitação, etc.) são armazenados em um banco de dados relacional SQL Server.
    * Garante que apenas 1 registro por data (o mais recente) seja exibido no relatório, evitando duplicidade.
* **Relatório de Previsão:**
    * [cite_start] Exibe os dados históricos de previsão do tempo em um formato de relatório tabular.
    * Mostra a descrição das condições climáticas (ex: "Céu limpo") em vez de códigos numéricos, com mapeamento feito no banco de dados.
    * [cite_start] Filtro por data: Permite ao usuário visualizar previsões de uma data específica ou de um intervalo de dias.
    * Ordenação dos dados por data ascendente no relatório.
* **Visualização Gráfica:**
    * [cite_start] Apresenta gráficos interativos (linhas para temperatura, barras para precipitação) para uma melhor análise visual dos dados, utilizando a biblioteca ApexCharts.


## Como Executar o Projeto

Siga estas instruções para configurar e executar a aplicação em seu ambiente local.

### Pré-requisitos

Certifique-se de ter o seguinte software instalado:

* **Node.js** (versão LTS recomendada, v18+ ou v20+).
* **npm** (gerenciador de pacotes do Node.js, geralmente vem com o Node.js).
* **Microsoft SQL Server** (Express Edition ou Developer Edition são boas opções para desenvolvimento).
* **SQL Server Management Studio (SSMS)** (para gerenciar seu banco de dados).
* **Git**.
* Uma **chave de API da Meteoblue**. Você pode obtê-la em [Meteoblue Weather API](https://www.meteoblue.com/weather-api).

### 1. Clonar o Repositório

Primeiro, clone este repositório para sua máquina local:

```bash
git clone https://github.com/dalmagromarina/weather-app.git
cd weather-app
```
### **2\. Configurar o Banco de Dados (MSSQL)**

1. **Crie um Banco de Dados:** Abra o SSMS, conecte-se ao seu SQL Server e crie um novo banco de dados. Sugerimos o nome **db_previsao_clima.**

**Crie as Tabelas:** Execute os scripts SQL, do arquivo [Scripts.sql](https://github.com/dalmagromarina/weather-app/blob/main/backend/script.sql) no seu banco de dados db_previsao_clima.  

1. **Configurar Login no SQL Server:**
    - **Autenticação SQL Server (Usuário e Senha):** Se você pretende usar um login SQL Server (como sa), defina uma senha forte para ele e certifique-se de que o SQL Server está configurado para "Mixed Mode Authentication" (Modo de Autenticação SQL Server e Windows).
    - **Autenticação Windows:** Se preferir, você pode usar seu usuário Windows que está executando a aplicação. Nesse caso, certifique-se de que seu usuário Windows tenha permissões de db_owner (ou similar) no banco de dados db_previsao_clima.

### **3\. Configurar Variáveis de Ambiente**

Na pasta backend, crie um arquivo chamado .env (se já não existir) e preencha-o com suas credenciais de banco de dados e sua chave de API da Meteoblue.

Snippet de código
```
# Configurações do Servidor
PORT=5000
```
\# Opção 1: Autenticação SQL Server
```
# Configurações do Banco de Dados MSSQL
DB_USER=sa
DB_PASSWORD=SuaSenhaSeguraAqui
DB_SERVER=localhost
DB_DATABASE=db_previsao_clima
DB_ENCRYPT=false # Mude para true se estiver usando Azure SQL ou certificado SSL
DB_TRUST_SERVER_CERTIFICATE=true # Mude para true se estiver em localhost para evitar erros de certificado
```
\# Opção 2: Autenticação Windows (comente as linhas DB_USER e DB_PASSWORD acima)
```
DB_SERVER=localhost
DB_DATABASE=db_previsao_clima
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
TRUSTED_CONNECTION=true # Adicione esta linha no .env para Autenticação Windows (e remova user/password do db.js)

# Chave da API da Meteoblue
METEOBLUE_API_KEY=SuaChaveDaAPIMeteoblueAqui
```
1. Substitua **SuaSenhaSeguraAqui** e **SuaChaveDaAPIMeteoblueAqui** pelos seus valores reais.
2. Ajuste DB_SERVER se sua instância do SQL Server não for localhost (ex: localhost\\SQLEXPRESS).

### **4\. Instalar Dependências**

No terminal, navegue para as pastas backend e frontend separadamente e instale as dependências:

\# Na pasta raiz do projeto:
```
Bash
cd backend
npm install
```
\# Volte para a pasta raiz e vá para o frontend:
```
cd ..
cd frontend
npm install
```
### **5\. Iniciar os Servidores**

Você precisará de dois terminais abertos para rodar o backend e o frontend simultaneamente.

**Terminal 1 (para o Backend):**
```
Bash
cd backend
node server.js
```
Você deverá ver mensagens indicando que o servidor Node.js está rodando e conectado ao MSSQL.

**Terminal 2 (para o Frontend):**
```
Bash
cd frontend
npm start
```
Isso iniciará o aplicativo React e abrirá uma nova aba no seu navegador (geralmente em <http://localhost:3000>).

## **Uso da Aplicação**

1. Abra seu navegador em <http://localhost:3000>.
2. Utilize o formulário para buscar a previsão do tempo:
    - **Por Cidade:** Digite o nome da cidade (ex: "São Paulo") no campo "Nome da Cidade".
    - **Por Coordenadas:** Digite a Latitude e Longitude nos campos correspondentes (ex: Lat: -23.55, Lon: -46.63 para São Paulo).
    - **Filtro por Data:** Opcionalmente, selecione "Data Inicial" e "Data Final" para filtrar o relatório por um período específico. Você pode buscar apenas por datas para ver o histórico.
3. Clique em "Buscar Previsão".
4. O relatório tabular e os gráficos interativos serão atualizados com os dados da previsão.

## **Qualidade do Código e Boas Práticas**

- Código modularizado com separação de responsabilidades (frontend, backend, modelos, controladores).
- Uso de variáveis de ambiente para configurações sensíveis.
- Tratamento de erros robusto em ambos os lados da aplicação.
- Queries SQL parametrizadas para evitar SQL Injection.
- Mapeamento de pictogramas e tratamento de fusos horários no backend para dados consistentes.
- Utilização de logs detalhados para facilitar a depuração.

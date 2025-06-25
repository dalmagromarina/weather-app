// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import WeatherForm from './components/WeatherForm';
import WeatherReport from './components/WeatherReport';
import WeatherChart from './components/WeatherChart'; // Importa o componente de gráficos
import logoTorfresma from './assets/logo-torfresma.png';

function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSearchCity, setCurrentSearchCity] = useState(''); // Estado para armazenar a cidade atual da busca (para exibição)

  // Função para buscar dados da API do backend
  const fetchWeatherData = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(params).toString();
      // Log para ver qual query string o frontend está enviando para o relatório
      console.log(`Buscando relatório com parâmetros (frontend): ${queryParams}`);
      const response = await fetch(`http://localhost:5000/api/weather/report?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError('Falha ao buscar dados: ' + err.message);
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // A função handleSearch
  const handleSearch = async (searchParams) => {
    setLoading(true);
    setError(null);

    console.log('Objeto searchParams recebido em App.js:', searchParams);

    // Se a busca é APENAS por datas, não faz a chamada POST para o backend, apenas filtra o histórico.
    if (!searchParams.cidade && !searchParams.latitude && !searchParams.longitude && searchParams.startDate && searchParams.endDate) {
        console.log('Filtrando histórico por datas apenas...');
        setCurrentSearchCity(`Período: ${searchParams.startDate} a ${searchParams.endDate}`);
        await fetchWeatherData({ startDate: searchParams.startDate, endDate: searchParams.endDate });
        setLoading(false); // Já lidou com a busca
        return; // Retorna para não continuar com a chamada POST
    }

    // Se há cidade ou coordenadas, faz a chamada POST para buscar nova previsão.
    try {
      const response = await fetch('http://localhost:5000/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Erro desconhecido'} (Detalhes: ${JSON.stringify(errorData.details)})`);
      }

      const responseData = await response.json(); // OBTENHA OS DADOS DA RESPOSTA AQUI
      alert(responseData.message); // Usa a mensagem da resposta

      // Atualiza currentSearchCity com o nome oficial do backend ou o que for relevante
      let cityToFilter = '';
      if (responseData.city_name_official) {
          setCurrentSearchCity(responseData.city_name_official); // Atualiza o estado para exibição
          cityToFilter = responseData.city_name_official; // Usa para o filtro da requisição
      } else if (searchParams.cidade) { // Fallback se o backend não retornar official_name (se não usou a API de localização)
          setCurrentSearchCity(searchParams.cidade); // Atualiza o estado para exibição
          cityToFilter = searchParams.cidade; // Usa para o filtro da requisição
      } else {
          // Se a busca foi por lat/lon, o nome no DB será 'Coordenadas Fornecidas'
          setCurrentSearchCity('Coordenadas Fornecidas');
          cityToFilter = 'Coordenadas Fornecidas';
      }
      
      // Agora, chama fetchWeatherData com a cidade E/OU datas
      await fetchWeatherData({ cidade: cityToFilter, startDate: searchParams.startDate, endDate: searchParams.endDate });

    } catch (err) {
      setError('Falha ao buscar e salvar previsão: ' + err.message);
      console.error("Erro ao buscar e salvar previsão:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar os dados iniciais do relatório ao montar o componente
  useEffect(() => {
    // Você pode descomentar a linha abaixo se quiser que o relatório mostre todos os dados inicialmente.
    // fetchWeatherData(); 
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logoTorfresma} className="App-logo" alt="Logo Torfresma" />
        <h1>Previsão do Tempo</h1>
      </header>
      <main>
        <WeatherForm onSearch={handleSearch} />
        {loading && <p>Carregando dados...</p>}
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
        
        {/* Renderiza o relatório e os gráficos se houver dados e não houver erro/loading */}
        {!loading && !error && weatherData.length > 0 && (
          <>
            <WeatherReport data={weatherData} currentCity={currentSearchCity} />
            <WeatherChart data={weatherData} /> {/* NOVO COMPONENTE AQUI */}
          </>
        )}
        {!loading && !error && weatherData.length === 0 && (
            <p className="no-data-message">Nenhum dado de previsão disponível. Por favor, faça uma busca.</p>
        )}
      </main>
    </div>
  );
}

export default App;
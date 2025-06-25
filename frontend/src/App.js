import React, { useState, useEffect } from 'react';
import './App.css';
import WeatherForm from './components/WeatherForm';
import WeatherReport from './components/WeatherReport';
import WeatherChart from './components/WeatherChart';
import logoTorfresma from './assets/logo-torfresma.png';

function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSearchCity, setCurrentSearchCity] = useState('');

  const fetchWeatherData = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams(params).toString();
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

  const handleSearch = async (searchParams) => {
    setLoading(true);
    setError(null);

    console.log('Objeto searchParams recebido em App.js:', searchParams);

    // Se a busca é APENAS por datas, não faz a chamada POST para o backend, apenas filtra o histórico.
    if (!searchParams.cidade && !searchParams.latitude && !searchParams.longitude && searchParams.startDate && searchParams.endDate) {
        console.log('Filtrando histórico por datas apenas...');
        setCurrentSearchCity(`Período: ${searchParams.startDate} a ${searchParams.endDate}`);
        await fetchWeatherData({ startDate: searchParams.startDate, endDate: searchParams.endDate });
        setLoading(false);
        return;
    }

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

      const responseData = await response.json();
      alert(responseData.message);

      let cityToFilter = '';
      if (responseData.city_name_official) {
          setCurrentSearchCity(responseData.city_name_official);
          cityToFilter = responseData.city_name_official;
      } else {
          // Se não veio nome oficial, e veio lat/lon na busca, define um nome para o filtro
          const latLonIdentifier = searchParams.latitude && searchParams.longitude 
                                  ? `Lat: ${searchParams.latitude}, Lon: ${searchParams.longitude}` 
                                  : 'Coordenadas Fornecidas';
          setCurrentSearchCity(latLonIdentifier); // Exibe no título
          cityToFilter = 'Coordenadas Fornecidas'; // O nome que será salvo no DB e usado para filtrar
      }
      
      await fetchWeatherData({ 
          cidade: cityToFilter, 
          latitude: searchParams.latitude, 
          longitude: searchParams.longitude, 
          startDate: searchParams.startDate, 
          endDate: searchParams.endDate 
      });

    } catch (err) {
      setError('Falha ao buscar e salvar previsão: ' + err.message);
      console.error("Erro ao buscar e salvar previsão:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     //fetchWeatherData();
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
        
        {!loading && !error && weatherData.length > 0 && (
          <>
            <WeatherReport data={weatherData} currentCity={currentSearchCity} />
            <WeatherChart data={weatherData} />
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
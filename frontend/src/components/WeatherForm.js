// frontend/src/components/WeatherForm.js
import React, { useState } from 'react';
import './WeatherForm.css'; // Importa o CSS específico para o formulário

function WeatherForm({ onSearch }) {
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [startDate, setStartDate] = useState(''); // Estado para data inicial
  const [endDate, setEndDate] = useState('');     // Estado para data final

  const handleSubmit = (e) => {
    e.preventDefault();

    // Logs para depuração no frontend (aparecerão no console do navegador)
    console.log('Valor da cidade ao submeter (frontend):', city);
    console.log('Valor da latitude ao submeter (frontend):', latitude);
    console.log('Valor da longitude ao submeter (frontend):', longitude);
    console.log('Valor da data inicial ao submeter (frontend):', startDate); // NOVO LOG
    console.log('Valor da data final ao submeter (frontend):', endDate);     // NOVO LOG

    const trimmedCity = city.trim();
    const trimmedLat = latitude.trim();
    const trimmedLon = longitude.trim();

    // Lógica de validação "OU" aprimorada
    // Prioriza cidade se preenchida, caso contrário, tenta lat/lon.
    // Garante que ambos não sejam preenchidos ao mesmo tempo, e que um deles seja preenchido.
    if (trimmedCity !== '') {
      // Se a cidade foi preenchida, envia apenas a cidade
      if (trimmedLat !== '' || trimmedLon !== '') {
          alert('Por favor, insira apenas a cidade OU latitude e longitude, não ambos.');
          return;
      }
      console.log('Frontend enviando (apenas cidade):', trimmedCity);
      // Chamada onSearch agora também pode incluir datas
      onSearch({ cidade: trimmedCity, startDate, endDate }); // Passa datas aqui
    } else if (trimmedLat !== '' && trimmedLon !== '') {
      const lat = parseFloat(trimmedLat);
      const lon = parseFloat(trimmedLon);

      if (isNaN(lat) || isNaN(lon)) {
        alert('Latitude e Longitude devem ser números válidos.');
        return;
      }
      console.log('Frontend enviando (apenas coordenadas):', { latitude: lat, longitude: lon });
      // Chamada onSearch agora também pode incluir datas
      onSearch({ latitude: lat, longitude: lon, startDate, endDate }); // Passa datas aqui.
    } else {
      // Se não preencheu cidade nem coordenadas, mas preencheu datas
      if (startDate && endDate) {
        console.log('Frontend enviando (apenas datas):', { startDate, endDate });
        onSearch({ startDate, endDate }); // Permite buscar apenas por datas
        return; // Retorna para não cair no alert abaixo
      }
      alert('Por favor, insira uma cidade OU latitude e longitude (ou apenas datas para filtrar o histórico).');
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="weather-form">
      {/* Container para Cidade/Latitude/Longitude */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px',
        alignItems: 'center' // Adicionado para alinhar verticalmente os itens
      }}>
        <input
          type="text"
          placeholder="Nome da Cidade"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            if (e.target.value.trim() !== '') {
              setLatitude('');
              setLongitude('');
            }
          }}
          className="form-input"
        />
        <span style={{ display: 'flex', color: 'var(--torfresma-text-light)' }}>OU</span>
        <input
          type="text"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => {
            setLatitude(e.target.value);
            if (e.target.value.trim() !== '') {
              setCity('');
            }
          }}
          className="form-input small-input"
        />
        <input
          type="text"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => {
            setLongitude(e.target.value);
            if (e.target.value.trim() !== '') {
              setCity('');
            }
          }}
          className="form-input small-input"
        />
      </div>

      {/* NOVO CONTAINER para Data Inicial/Final e o botão Buscar */}
      <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center', // Já existente e correto para as datas
          gap: '15px'
      }}>
        {/* Agrupar Label e Input para Data Inicial */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label style={{ color: 'var(--torfresma-text-light)', whiteSpace: 'nowrap' }}>Data Inicial:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input small-input"
              style={{ width: '150px' }}
            />
        </div>

        {/* Agrupar Label e Input para Data Final */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <label style={{ color: 'var(--torfresma-text-light)', whiteSpace: 'nowrap' }}>Data Final:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input small-input"
              style={{ width: '150px' }}
            />
        </div>

        <button type="submit" className="form-button">
          Buscar Previsão
        </button>
      </div>
    </form>
  );
}

export default WeatherForm;
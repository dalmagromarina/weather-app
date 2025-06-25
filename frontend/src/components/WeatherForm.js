import React, { useState } from 'react';
import './WeatherForm.css'; 

function WeatherForm({ onSearch }) {
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState('');     

  const handleSubmit = (e) => {
    e.preventDefault();

    // Logs para depuração no frontend (aparecerão no console do navegador)
   /* console.log('Valor da cidade ao submeter (frontend):', city);
    console.log('Valor da latitude ao submeter (frontend):', latitude);
    console.log('Valor da longitude ao submeter (frontend):', longitude);
    console.log('Valor da data inicial ao submeter (frontend):', startDate); 
    console.log('Valor da data final ao submeter (frontend):', endDate);     */

    const trimmedCity = city.trim();
    const trimmedLat = latitude.trim();
    const trimmedLon = longitude.trim();

    if (trimmedCity !== '') {
      if (trimmedLat !== '' || trimmedLon !== '') {
          alert('Por favor, insira apenas a cidade OU latitude e longitude, não ambos.');
          return;
      }
      console.log('Frontend enviando (apenas cidade):', trimmedCity);

      onSearch({ cidade: trimmedCity, startDate, endDate }); 
    } else if (trimmedLat !== '' && trimmedLon !== '') {
      const lat = parseFloat(trimmedLat);
      const lon = parseFloat(trimmedLon);

      if (isNaN(lat) || isNaN(lon)) {
        alert('Latitude e Longitude devem ser números válidos.');
        return;
      }
      console.log('Frontend enviando (apenas coordenadas):', { latitude: lat, longitude: lon });
      
      onSearch({ latitude: lat, longitude: lon, startDate, endDate }); 
    } else {
      if (startDate && endDate) {
        console.log('Frontend enviando (apenas datas):', { startDate, endDate });
        onSearch({ startDate, endDate }); 
        return; 
      }
      alert('Por favor, insira uma cidade OU latitude e longitude (ou apenas datas para filtrar o histórico).');
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="weather-form">
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px',
        alignItems: 'center' 
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

      <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center', 
          gap: '15px'
      }}>
        
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
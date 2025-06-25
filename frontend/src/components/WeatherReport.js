import React from 'react';
import './WeatherReport.css'; 

function WeatherReport({ data, currentCity }) { 
  if (!data || data.length === 0) {
    return <p className="no-data-message">Nenhum dado de previsão disponível. Por favor, faça uma busca.</p>;
  }

  return (
    <div className="weather-report-container">    
      <h2 className="report-title">
        Relatório de Previsão
        {currentCity && ` para ${currentCity}`} 
      </h2>
      <div className="table-responsive">
        <table className="weather-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cidade</th>
              <th>Min (°C)</th>
              <th>Max (°C)</th>
              <th>Condições</th>
              <th>Vento (km/h)</th>
              <th>Prob. Prec. (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.Id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{new Date(item.DataPrevisao).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td> 
                <td>{item.Cidade}</td>
                <td>{item.TemperaturaMin}</td>
                <td>{item.TemperaturaMax}</td>
                <td>{item.CondicoesClimaticas}</td>
                <td>{item.VelocidadeVento} ({item.DirecaoVento})</td>
                <td>{item.ProbabilidadePrecipitacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WeatherReport;
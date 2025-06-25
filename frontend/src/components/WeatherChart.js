// frontend/src/components/WeatherChart.js
import React from 'react';
import Chart from 'react-apexcharts'; // Importa o componente Chart do react-apexcharts

function WeatherChart({ data }) {
  if (!data || data.length === 0) {
    return <p>Sem dados para exibir gráficos.</p>;
  }

  // Preparar os dados para os gráficos
  const dates = data.map(item => new Date(item.DataPrevisao).toLocaleDateString('pt-BR'));
  const tempMin = data.map(item => item.TemperaturaMin);
  const tempMax = data.map(item => item.TemperaturaMax);
  const precipProbability = data.map(item => item.ProbabilidadePrecipitacao);

  // --- Opções e Séries para o Gráfico de Temperatura ---
  const temperatureChartOptions = {
    chart: {
      id: 'temperature-chart',
      toolbar: {
        show: false // Oculta a barra de ferramentas (zoom, pan, etc.)
      }
    },
    xaxis: {
      categories: dates,
      title: {
        text: 'Data'
      }
    },
    yaxis: {
      title: {
        text: 'Temperatura (°C)'
      }
    },
    colors: ['#008FFB', '#FF4560'], // Azul para mínima, Vermelho para máxima
    stroke: {
      curve: 'smooth' // Linhas suaves
    },
    dataLabels: {
      enabled: false // Não mostrar valores nos pontos
    },
    tooltip: {
      x: {
        format: 'dd/MM/yyyy'
      }
    },
    title: {
      text: 'Previsão de Temperatura Diária',
      align: 'center',
      style: {
        color: 'var(--torfresma-dark)'
      }
    }
  };

  const temperatureChartSeries = [
    {
      name: 'Temperatura Mínima',
      data: tempMin
    },
    {
      name: 'Temperatura Máxima',
      data: tempMax
    }
  ];

  // --- Opções e Séries para o Gráfico de Probabilidade de Precipitação ---
  const precipitationChartOptions = {
    chart: {
      id: 'precipitation-chart',
      toolbar: {
        show: false
      }
    },
    xaxis: {
      categories: dates,
      title: {
        text: 'Data'
      }
    },
    yaxis: {
      title: {
        text: 'Probabilidade de Precipitação (%)'
      },
      min: 0,
      max: 100
    },
    colors: ['#00E396'], // Verde para precipitação
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + "%"
        }
      },
      x: {
        format: 'dd/MM/yyyy'
      }
    },
    title: {
      text: 'Probabilidade de Precipitação Diária',
      align: 'center',
      style: {
        color: 'var(--torfresma-dark)'
      }
    }
  };

  const precipitationChartSeries = [
    {
      name: 'Prob. Precipitação',
      data: precipProbability
    }
  ];

  return (
    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--torfresma-light)', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ marginBottom: '40px' }}>
        <Chart
          options={temperatureChartOptions}
          series={temperatureChartSeries}
          type="line"
          height={350}
        />
      </div>
      <div>
        <Chart
          options={precipitationChartOptions}
          series={precipitationChartSeries}
          type="bar"
          height={350}
        />
      </div>
    </div>
  );
}

export default WeatherChart;
import React from 'react';
import Chart from 'react-apexcharts'; 

function WeatherChart({ data }) {
  if (!data || data.length === 0) {
    return <p>Sem dados para exibir gráficos.</p>;
  }

  
  const dates = data.map(item => new Date(item.DataPrevisao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}));
  const tempMin = data.map(item => item.TemperaturaMin);
  const tempMax = data.map(item => item.TemperaturaMax);
  const precipProbability = data.map(item => item.ProbabilidadePrecipitacao);

  const temperatureChartOptions = {
    chart: {
      id: 'temperature-chart',
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
        text: 'Temperatura (°C)'
      }
    },
    colors: ['#008FFB', '#FF4560'],
    stroke: {
      curve: 'smooth'
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      x: {
        format: 'dd/MM/yyyy' 
      },
      y: { 
        formatter: function (val) {
          return val.toFixed(2) + " °C";
        }
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
    colors: ['#00E396'],
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
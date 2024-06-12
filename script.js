const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'PYPL', 'TSLA', 'JPM', 'NVDA', 'NFLX', 'DIS'];

const apiUrls = {
    chartData: 'https://stocks3.onrender.com/api/stocks/getstocksdata',
    profileData: 'https://stocks3.onrender.com/api/stocks/getstocksprofiledata',
    statsData: 'https://stocks3.onrender.com/api/stocks/getstockstatsdata'
};

let selectedStock = stocks[0];
let timeRange = '1mo'; // Default to 1mo
let stockStats = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchStatsData();
    populateList();
    setupChart();
    fetchProfileData(selectedStock);
    fetchChartData(selectedStock, timeRange);
});

function fetchProfileData(symbol) {
    fetch(`${apiUrls.profileData}?symbol=${symbol}`)
        .then(response => response.json())
        .then(data => {
            if (data.stocksProfileData && Array.isArray(data.stocksProfileData)) {
                const profileData = data.stocksProfileData.find(item => item[symbol]);
                updateDetails(symbol, profileData);
            } else {
                console.error('Unexpected data format:', data);
            }
        })
        .catch(error => console.error('Error fetching profile data:', error));
}

function fetchStatsData() {
    fetch(apiUrls.statsData)
        .then(response => response.json())
        .then(data => {
            if (data.stocksStatsData && Array.isArray(data.stocksStatsData)) {
                stockStats = data.stocksStatsData[0];
                updateListWithStats();
            } else {
                console.error('Unexpected data format:', data);
            }
        })
        .catch(error => console.error('Error fetching stats data:', error));
}

function populateList() {
    const listSection = document.getElementById('listSection');
    listSection.innerHTML = '';
    stocks.forEach(symbol => {
        const stockDiv = document.createElement('div');
        stockDiv.setAttribute('data-symbol', symbol);
        stockDiv.innerHTML = `<strong>${symbol}</strong>`;
        stockDiv.onclick = () => {
            selectedStock = symbol;
            fetchProfileData(symbol);
            fetchChartData(symbol, timeRange);
        };
        listSection.appendChild(stockDiv);
    });
}

function updateListWithStats() {
    const listSection = document.getElementById('listSection');
    const stockDivs = listSection.querySelectorAll('div[data-symbol]');
    stockDivs.forEach(stockDiv => {
        const symbol = stockDiv.getAttribute('data-symbol');
        const stats = stockStats[symbol] || {};
        stockDiv.innerHTML = `<strong>${symbol}</strong> - Book Value: ${stats.bookValue || 'N/A'}, Profit: ${stats.profit !== undefined ? (stats.profit * 100).toFixed(2) + '%' : 'N/A'}`;
    });
}

function updateDetails(symbol, profileData) {
    const detailSection = document.getElementById('detailSection');
    const profile = profileData ? profileData[symbol] : {};
    const stats = stockStats[symbol] || {};
    const profitClass = stats.profit > 0 ? 'profit-positive' : 'profit-negative';
    detailSection.innerHTML = `
        <h2>${symbol}</h2>
        <p>Summary: ${profile?.summary || 'N/A'}</p>
        <p>Book Value: ${stats.bookValue || 'N/A'}</p>
        <p class="${profitClass}">Profit: ${stats.profit !== undefined ? (stats.profit * 100).toFixed(2) + '%' : 'N/A'}</p>
    `;
}

let chart;

function setupChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Stock Price',
                data: [],
                borderColor: 'green',
                backgroundColor: 'transparent',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy'
                    }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function fetchChartData(symbol, range) {
    fetch(`${apiUrls.chartData}?symbol=${symbol}&range=${range}`)
        .then(response => response.json())
        .then(data => {
            if (data.stocksData && Array.isArray(data.stocksData)) {
                const stockData = data.stocksData.find(item => item[symbol]);
                if (stockData && stockData[symbol] && stockData[symbol][range]) {
                    const { value: prices, timeStamp: timestamps } = stockData[symbol][range];
                    const labels = timestamps.map(ts => new Date(ts * 1000));
                    updateChart(labels, prices);
                } else {
                    console.error(`Stock data not found for the specified range and symbol: ${symbol}, range: ${range}`, stockData);
                }
            } else {
                console.error('Unexpected data format:', data);
            }
        })
        .catch(error => console.error('Error fetching chart data:', error));
}

function updateChart(labels, prices) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = prices;
    chart.update();
}

function changeRange(range) {
    const rangeMap = {
        '1month': '1mo',
        '3months': '3mo',
        '1year': '1y',
        '5years': '5y'
    };
    timeRange = rangeMap[range];
    fetchChartData(selectedStock, timeRange);
}

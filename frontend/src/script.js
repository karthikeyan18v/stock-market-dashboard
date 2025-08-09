// DOM Elements
const companiesList = document.getElementById('companiesList');
const companyName = document.getElementById('companyName');
const stockPrice = document.getElementById('stockPrice');
const priceChange = document.getElementById('priceChange');
const weekHigh = document.getElementById('weekHigh');
const weekLow = document.getElementById('weekLow');
const highDiff = document.getElementById('highDiff');
const lowDiff = document.getElementById('lowDiff');
const avgVolume = document.getElementById('avgVolume');
const todayVolume = document.getElementById('todayVolume');
const predictedPrice = document.getElementById('predictedPrice');
const predictionChange = document.getElementById('predictionChange');
const chartLoader = document.getElementById('chartLoader');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const timeButtons = document.querySelectorAll('.time-btn');

// Global variables
let stockChart = null;
let currentSymbol = "AAPL";
let currentData = null;
let companies = [];

// Initialize the dashboard
async function initDashboard() {
    await fetchCompanies();
    populateCompaniesList();
    fetchStockData(currentSymbol, "1mo");
    addEventListeners();
}

// Fetch companies from backend
async function fetchCompanies() {
    try {
        const response = await fetch('http://localhost:3000/api/companies');
        companies = await response.json();
    } catch (error) {
        console.error('Failed to fetch companies:', error);
        // Fallback to hardcoded companies
        companies = [
            { symbol: "AAPL", name: "Apple Inc." },
            { symbol: "MSFT", name: "Microsoft Corporation" },
            { symbol: "GOOGL", name: "Alphabet Inc." },
            { symbol: "AMZN", name: "Amazon.com Inc." },
            { symbol: "META", name: "Meta Platforms Inc." },
            { symbol: "TSLA", name: "Tesla Inc." },
            { symbol: "JPM", name: "JPMorgan Chase & Co." },
            { symbol: "JNJ", name: "Johnson & Johnson" },
            { symbol: "V", name: "Visa Inc." },
            { symbol: "WMT", name: "Walmart Inc." },
            { symbol: "PG", name: "Procter & Gamble" },
            { symbol: "MA", name: "Mastercard Inc." },
            { symbol: "DIS", name: "Walt Disney Co." },
            { symbol: "NVDA", name: "NVIDIA Corporation" },
            { symbol: "HD", name: "Home Depot Inc." }
        ];
    }
}

// Populate companies list
function populateCompaniesList(filter = "") {
    companiesList.innerHTML = "";
    
    const filteredCompanies = filter ? 
        companies.filter(company => 
            company.name.toLowerCase().includes(filter.toLowerCase()) || 
            company.symbol.toLowerCase().includes(filter.toLowerCase())
        ) : 
        companies;
    
    filteredCompanies.forEach(company => {
        const companyItem = document.createElement('div');
        companyItem.className = `company-item ${company.symbol === currentSymbol ? 'active' : ''}`;
        companyItem.innerHTML = `
            <div class="company-logo">${company.symbol[0]}</div>
            <div class="company-info">
                <h3>${company.name}</h3>
                <p>${company.symbol}</p>
            </div>
            <div class="company-price">$0.00</div>
        `;
        companyItem.addEventListener('click', () => {
            currentSymbol = company.symbol;
            fetchStockData(company.symbol, getCurrentTimeRange());
            document.querySelectorAll('.company-item').forEach(item => item.classList.remove('active'));
            companyItem.classList.add('active');
        });
        companiesList.appendChild(companyItem);
    });
    
    // Fetch prices for all companies
    fetchAllCompanyPrices();
}

// Get current selected time range
function getCurrentTimeRange() {
    const activeBtn = document.querySelector('.time-btn.active');
    return activeBtn ? activeBtn.dataset.time : "1mo";
}

// Fetch stock data from backend
async function fetchStockData(symbol, range) {
    showLoader();
    
    try {
        // Convert frontend range to backend parameters
        let interval, period1;
        switch(range) {
            case "1d":
                interval = "5m";
                period1 = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day
                break;
            case "1w":
                interval = "30m";
                period1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 1 week
                break;
            case "1m":
                interval = "1d";
                period1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 1 month
                break;
            case "3m":
                interval = "1d";
                period1 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 3 months
                break;
            case "1y":
                interval = "1wk";
                period1 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year
                break;
            default:
                interval = "1d";
                period1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default 1 month
        }

        const response = await fetch(`http://localhost:3000/api/stock/${symbol}?period1=${period1.toISOString()}&interval=${interval}`);
        const data = await response.json();
        
        if (!data || !data.historical) {
            throw new Error("Invalid data received");
        }
        
        currentData = data;
        
        // Update UI with the new data
        updateStockInfo(data);
        renderStockChart(data);
        calculatePrediction(data);
        
    } catch (error) {
        console.error("Error fetching stock data:", error);
        alert("Failed to fetch stock data. Please try again later.");
    } finally {
        hideLoader();
    }
}

// Fetch prices for all companies in the list
async function fetchAllCompanyPrices() {
    const companyPrices = document.querySelectorAll('.company-price');
    
    try {
        // Get symbols
        const symbols = companies.map(c => c.symbol).join(',');
        if (!symbols) return;
        
        // Fetch quotes for all symbols
        const response = await fetch(`http://localhost:3000/api/market-data?symbols=${symbols}`);
        const marketData = await response.json();
        
        companyPrices.forEach((priceElement, index) => {
            const symbol = companies[index].symbol;
            const data = marketData[symbol];
            
            if (data) {
                const price = data.price || 0;
                const change = data.change || 0;
                
                priceElement.textContent = `$${price.toFixed(2)}`;
                priceElement.className = `company-price ${change >= 0 ? 'price-up' : 'price-down'}`;
            }
        });
        
    } catch (error) {
        console.error("Error fetching market prices:", error);
        // Fallback to random prices if API fails
        companyPrices.forEach((priceElement) => {
            const mockPrice = (150 + Math.random() * 1000).toFixed(2);
            const isUp = Math.random() > 0.3;
            
            priceElement.textContent = `$${mockPrice}`;
            priceElement.className = `company-price ${isUp ? 'price-up' : 'price-down'}`;
        });
    }
}

// Update stock information in the UI
function updateStockInfo(data) {
    companyName.textContent = `${data.name} (${data.symbol})`;
    stockPrice.textContent = `$${data.currentPrice.toFixed(2)}`;
    
    // Calculate change
    const change = data.currentPrice - data.previousClose;
    const changePercent = (change / data.previousClose * 100).toFixed(2);
    
    priceChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)`;
    priceChange.className = `price-change ${change >= 0 ? 'price-up' : 'price-down'}`;
    
    // Update stats
    weekHigh.textContent = `$${data.week52High.toFixed(2)}`;
    weekLow.textContent = `$${data.week52Low.toFixed(2)}`;
    
    const highDiffPercent = ((data.week52High - data.currentPrice) / data.week52High * 100).toFixed(2);
    const lowDiffPercent = ((data.currentPrice - data.week52Low) / data.week52Low * 100).toFixed(2);
    
    highDiff.textContent = `${highDiffPercent}%`;
    lowDiff.textContent = `${lowDiffPercent}%`;
    
    avgVolume.textContent = formatNumber(data.avgVolume);
    todayVolume.textContent = formatNumber(data.volume);
}

// Render the stock chart
function renderStockChart(data) {
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (stockChart) {
        stockChart.destroy();
    }
    
    // Prepare chart data
    const chartData = {
        labels: data.historical.map(day => day.date),
        datasets: [{
            label: 'Closing Price',
            data: data.historical.map(day => day.close),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4
        }]
    };
    
    // Create new chart
    stockChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Calculate AI-based prediction using linear regression
function calculatePrediction(data) {
    const historicalData = data.historical;
    
    // Prepare data for regression
    const points = historicalData.map((day, index) => [index, day.close]);
    
    // Perform linear regression
    const result = regression.linear(points);
    
    // Predict next day's closing price
    const nextDayIndex = historicalData.length;
    const predictedClosingPrice = result.predict(nextDayIndex)[1];
    
    // Calculate change from current price
    const change = predictedClosingPrice - data.currentPrice;
    const changePercent = (change / data.currentPrice * 100).toFixed(2);
    
    // Update UI
    predictedPrice.textContent = `$${predictedClosingPrice.toFixed(2)}`;
    predictionChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)`;
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Show loader
function showLoader(message = "Loading stock data...") {
    chartLoader.querySelector('p').textContent = message;
    chartLoader.style.display = 'flex';
}
// Hide loader
function hideLoader() {
    chartLoader.style.display = 'none';
}

// Add event listeners
function addEventListeners() {
    // Time filter buttons
   timeButtons.forEach(button => {
    button.addEventListener('click', () => {
        timeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        fetchStockData(currentSymbol, button.dataset.time);
    });
});
   console.log(`Fetching data for ${symbol} with range ${range}`); 
    // Search functionality
    searchBtn.addEventListener('click', () => {
        populateCompaniesList(searchInput.value);
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            populateCompaniesList(searchInput.value);
        }
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        fetchStockData(currentSymbol, getCurrentTimeRange());
    });
}

// Initialize dashboard when page loads
window.addEventListener('DOMContentLoaded', initDashboard);
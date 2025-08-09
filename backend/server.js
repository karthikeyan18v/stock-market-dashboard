require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;

const app = express();
const port = process.env.PORT || 3000;

// Suppress Yahoo Finance notices
yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical']);

app.use(cors());
app.use(express.json());

// API endpoint for stock data (using chart instead of historical)
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1mo', interval = '1d' } = req.query;

    console.log(`Fetching chart data for ${symbol}...`);

    // Get quote data
    const quote = await yahooFinance.quote(symbol);
    
    // Get chart data (replaces historical)
    const chartData = await yahooFinance.chart(symbol, {
      period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      period2: new Date(), // now
      interval: interval === '1d' ? '1d' : '1wk' // adjust as needed
    });

    const response = {
      symbol,
      name: quote.longName || symbol,
      currentPrice: quote.regularMarketPrice,
      previousClose: quote.regularMarketPreviousClose,
      week52High: quote.fiftyTwoWeekHigh,
      week52Low: quote.fiftyTwoWeekLow,
      avgVolume: quote.averageVolume,
      volume: quote.volume,
      historical: chartData.quotes.map(quote => ({
        date: new Date(quote.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close
      }))
    };

    console.log(`Successfully fetched data for ${symbol}`);
    res.json(response);
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Market data endpoint
app.get('/api/market-data', async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols parameter required' });
    }

    const symbolList = symbols.split(',');
    console.log(`Fetching market data for: ${symbolList.join(', ')}`);

    const response = {};
    
    for (const symbol of symbolList) {
      try {
        const quote = await yahooFinance.quote(symbol);
        response[symbol] = {
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent
        };
        console.log(`Fetched data for ${symbol}`);
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error.message);
        response[symbol] = {
          error: `Failed to fetch data for ${symbol}`
        };
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    res.json(response);
  } catch (error) {
    console.error('Market data error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('Test endpoints:');
  console.log(`- Single stock: http://localhost:${port}/api/stock/AAPL`);
  console.log(`- Market data: http://localhost:${port}/api/market-data?symbols=AAPL,MSFT`);
});
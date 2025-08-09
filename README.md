# 📈 Stock Market Dashboard

A responsive web application for tracking stock market data with real-time price visualization and AI-powered predictions.

## 🌟 Features

- **Interactive Charts**: 1D/1W/1M/3M/1Y time ranges
- **Company Overview**: 15+ major stocks with real-time pricing
- **Technical Indicators**: 
  - 52-week high/low
  - Volume analysis
  - Price change percentages
- **AI Prediction**: Next-day price forecast using linear regression
- **Fully Responsive**: Optimized for desktop & mobile

## 🛠️ Technologies

**Frontend**:
- Chart.js for data visualization
- Vanilla JavaScript (ES6+)
- CSS Grid/Flexbox layout
- Responsive design (mobile-first)

**Backend**:
- Node.js + Express
- yahoo-finance2 API wrapper
- RESTful API architecture

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stock-market-dashboard.git


  cd backend
npm install express cors yahoo-finance2 axios dotenv
cp .env.example .env
node server.js

cd ../frontend
live-server public

backend/.env
PORT=3000
NODE_ENV=development

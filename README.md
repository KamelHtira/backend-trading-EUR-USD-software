# Forex Trading Bot Server

A Node.js-based automated trading bot for Forex markets, specifically focused on EUR/USD trading. The bot uses machine learning predictions and real-time market data to execute trades automatically.

## Features

- **Automated Trading**: Executes trades based on ML predictions and market data
- **Risk Management**: Uses 1% of balance per trade
- **Position Limits**: Maximum 10 concurrent positions
- **Trading Frequency**: Maximum 3 trades per minute
- **Real-time Market Data**: Uses Twelve Data API for EUR/USD prices
- **ML Predictions**: Integrates with ML model for price predictions
- **User Management**: Supports multiple users with individual balances
- **Admin Dashboard**: Special admin user with $100,000 initial balance (created automatically on server start)
- **Trade History**: Tracks all trades with timestamps and profit/loss
- **API Documentation**: Swagger UI for API documentation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- PNPM package manager
- API key for Twelve Data

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ForexTradingBotServer
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/forexbot
JWT_SECRET=your_jwt_secret
TWELVE_DATA_API_KEY=your_api_key
```

4. Start the server:

```bash
pnpm start
```

The server will automatically create an admin user with the following credentials:

- Username: admin
- Password: admin
- Initial Balance: $100,000

For development with auto-reload:

```bash
pnpm run nodemon
```

## API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token

### Account Management

- `GET /account/balance` - Get user balance
- `GET /account/activities` - Get trading history
- `GET /account/open-positions` - Get current open positions
- `POST /account/open-position` - Open new position
- `POST /account/close-position` - Close existing position
- `GET /account/eurusd-data` - Get EUR/USD market data

### Bot Control

- `POST /bot/start` - Start trading bot
- `POST /bot/stop` - Stop trading bot
- `GET /bot/status` - Get bot status

## Bot Trading Logic

1. **Market Analysis**:

   - Fetches real-time EUR/USD data
   - Gets ML predictions for future prices
   - Calculates average prediction

2. **Trade Execution**:

   - Opens positions based on price vs prediction
   - Uses 1% of user balance per trade
   - Maximum 10 concurrent positions
   - Maximum 3 trades per minute

3. **Position Management**:
   - Automatically closes positions after 5-30 seconds
   - Calculates profit/loss using latest market price
   - Updates user balance with profit/loss
   - Tracks all trade details including timestamps

## Database Schema

### User Model

```javascript
{
  username: String,
  password: String (hashed),
  balance: Number,
  accountCurrency: String,
  isAdmin: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Activity Model

```javascript
{
  userId: ObjectId,
  pair: String,
  side: String (BUY/SELL),
  type: String,
  price: Number,
  amount: Number,
  total: Number,
  profit: Number,
  status: String,
  isOpen: Boolean,
  openedAt: Date,
  closedAt: Date,
  duration: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/forexbot
JWT_SECRET=your_jwt_secret
TWELVE_DATA_API_KEY=your_api_key
```

## API Documentation

Access the Swagger UI documentation at:

```
http://localhost:3000/api-docs
```

## Security Features

- JWT authentication
- Password hashing
- Rate limiting
- API key management
- Secure MongoDB connection

## Error Handling

- Comprehensive error logging
- Graceful error recovery
- Rate limit handling
- API error management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository.

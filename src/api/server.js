const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (for frontend access)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Import route modules
const borrowersRouter = require('./borrowers');
const loansRouter = require('./loans');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Team Asset - Lending System API",
    version: "1.0.0",
    endpoints: {
      borrowers: {
        "GET /borrowers": "Get all borrowers",
        "GET /borrowers/:id": "Get borrower by ID",
        "POST /borrowers": "Create new borrower",
        "PUT /borrowers/:id": "Update borrower",
        "DELETE /borrowers/:id": "Delete borrower"
      },
      loans: {
        "GET /loans": "Get all loans",
        "GET /loans/:id": "Get loan by ID",
        "POST /loans": "Create new loan (sends to approval queue)",
        "PUT /loans/:id": "Update loan",
        "DELETE /loans/:id": "Delete loan",
        "GET /loans/borrower/:borrowerId": "Get loans by borrower"
      }
    },
    features: {
      messaging: "Asynchronous loan approval via RabbitMQ",
      queue: "loan_approval_queue"
    }
  });
});

// API Routes
app.use('/borrowers', borrowersRouter);
app.use('/loans', loansRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    requestedUrl: req.url
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   TEAM ASSET - LENDING SYSTEM API');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  - http://localhost:${PORT}/`);
  console.log(`  - http://localhost:${PORT}/borrowers`);
  console.log(`  - http://localhost:${PORT}/loans`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('═══════════════════════════════════════════════════════');
});

module.exports = app;
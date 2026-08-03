const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const path = require('path');

// Middleware
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found.` } });
});

// Error handler
app.use(errorHandler);

module.exports = app;
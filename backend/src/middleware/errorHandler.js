const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: messages.join(', ') } });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: `${field} already exists.` } });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid resource ID.' } });
  }
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error.',
    },
  });
};

module.exports = errorHandler;
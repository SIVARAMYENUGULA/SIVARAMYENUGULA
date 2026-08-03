const success = (data, message = 'Success', statusCode = 200) => ({
  statusCode,
  body: { success: true, data, message },
});

const paginated = (data, total, page, limit) => ({
  statusCode: 200,
  body: {
    success: true,
    data,
    pagination: {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      total,
      pages: Math.ceil(total / (parseInt(limit) || 20)),
    },
  },
});

module.exports = { success, paginated };
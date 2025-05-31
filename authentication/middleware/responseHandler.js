const responseHandler = (res, status, message, data = null) => {
  const response = {
    status,
    message,
    data,
  };
  return res.status(status).json(response);
};

module.exports = responseHandler;

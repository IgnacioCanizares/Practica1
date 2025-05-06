//Al final utilizo otro

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}


const notFound = (message = 'Resource not found') => {
  return new AppError(message, 404);
};

const badRequest = (message = 'Bad request') => {
  return new AppError(message, 400);
};

const unauthorized = (message = 'Unauthorized') => {
  return new AppError(message, 401);
};

const forbidden = (message = 'Forbidden') => {
  return new AppError(message, 403);
};

module.exports = {
  AppError,
  notFound,
  badRequest,
  unauthorized,
  forbidden
};
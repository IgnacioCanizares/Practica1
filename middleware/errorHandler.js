const { logErrorToSlack } = require('../utils/slackLogger');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Manejar tipos de error específicos
  if (err.name === 'ValidationError') {
    // Error de validación de MongoDB
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({ error: 'Error de validación', details: errors });
  }

  if (err.name === 'CastError') {
    // Error de conversión de MongoDB (formato de ID inválido)
    return res.status(400).json({ error: 'Formato de ID inválido' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  if(err.name === 'AccessDeniedError') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  if(err.name === 'NotFoundError') {
    return res.status(404).json({ error: 'No encontrado' });
  }

  // Manejar códigos de estado personalizados
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Para errores 5XX, registrar en Slack
  if (!err.statusCode || err.statusCode >= 500) {
    // Registrar en Slack de forma asíncrona (sin await)
    logErrorToSlack(err, req);
  }

  // Por defecto, 500 para errores no manejados
  res.status(500).json({ error: 'Error interno del servidor' });
};

module.exports = errorHandler;
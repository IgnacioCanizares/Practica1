const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
    try {
        console.log('Middleware de autenticación llamado');
        
        // Comprobar si el encabezado Authorization existe
        if (!req.header('Authorization')) {
            console.log('No se encontró el encabezado Authorization');
            return res.status(401).json({ error: 'Por favor autentícate' });
        }
        
        const authHeader = req.header('Authorization');
        console.log('Encabezado Authorization:', authHeader);
        
        const token = authHeader.replace('Bearer ', '');
        console.log('Token extraído:', token.substring(0, 20) + '...');
        
        console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'existe' : 'faltante');
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decodificado correctamente:', decoded);
            
            // Asegurar que el token sea válido y pertenezca a un usuario existente
            const user = await User.findOne({ _id: decoded.userId });
            
            if (!user) {
                console.log('Usuario no encontrado con ID:', decoded.userId);
                throw new Error('Usuario no encontrado');
            }
            
            console.log('Usuario encontrado:', user.email);
            
            req.token = token;
            req.user = user;
            next();
        } catch (jwtError) {
            console.error('Error de verificación JWT:', jwtError.message);
            return res.status(401).json({ error: 'Por favor autentícate' });
        }
    } catch (error) {
        console.error('Error en el middleware de autenticación:', error.message);
        res.status(401).json({ error: 'Por favor autentícate' });
    }
};

module.exports = authMiddleware;
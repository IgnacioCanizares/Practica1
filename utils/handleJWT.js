const jwt = require('jsonwebtoken');

const validateJWT = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token erroneo' });
    }
};

module.exports = { validateJWT };
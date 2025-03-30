const User = require('../models/user');

const checkExistingValidatedEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ 
            email: email, 
            status: 'VERIFIED' 
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Email ya registrado y verificado'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = checkExistingValidatedEmail;
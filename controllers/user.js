const User = require('../models/user');
const jwt = require('jsonwebtoken');

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists and is verified
        const existingUser = await User.findOne({ email, status: 'VERIFIED' });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered and verified' });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const codeExpiration = new Date();
        codeExpiration.setHours(codeExpiration.getHours() + 24);

        // Create new user
        const user = new User({
            email,
            password,
            verificationCode: {
                code: verificationCode,
                attempts: 3,
                expiresAt: codeExpiration
            }
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            user: {
                email: user.email,
                status: user.status,
                role: user.role
            },
            token
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const validateEmail = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.status === 'VERIFIED') {
            return res.status(400).json({ error: 'Email already verified' });
        }

        if (!user.verificationCode || 
            !user.verificationCode.code || 
            user.verificationCode.attempts <= 0 || 
            new Date() > user.verificationCode.expiresAt) {
            return res.status(400).json({ error: 'Verification code expired or no attempts left' });
        }

        if (user.verificationCode.code !== code) {
            user.verificationCode.attempts -= 1;
            await user.save();
            return res.status(400).json({ 
                error: 'Invalid code',
                attemptsLeft: user.verificationCode.attempts
            });
        }

        user.status = 'VERIFIED';
        user.verificationCode = undefined;
        await user.save();

        return res.status(200).json({ 
            message: 'Email verified successfully',
            status: user.status
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if email is verified
        if (user.status !== 'VERIFIED') {
            return res.status(401).json({ error: 'Email not verified' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data and token
        res.status(200).json({
            user: {
                email: user.email,
                status: user.status,
                role: user.role
            },
            token
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, validateEmail, login };
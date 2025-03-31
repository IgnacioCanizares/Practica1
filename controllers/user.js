const User = require('../models/user');
const jwt = require('jsonwebtoken');

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Comprobamos si el usuario existe
        const existingUser = await User.findOne({ email, status: 'VERIFIED' });
        if (existingUser) {
            return res.status(409).json({ error: 'Email ya registrado y verificado' });
        }

        // Generamos el codigo de verificacion
        const verificationCode = generateVerificationCode();
        const codeExpiration = new Date();
        codeExpiration.setHours(codeExpiration.getHours() + 24);

        // Creamos el nuevo usuario
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

        // Generamos el JWT token
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
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (user.status === 'VERIFIED') {
            return res.status(400).json({ error: 'Email ya verificado' });
        }

        if (!user.verificationCode || 
            !user.verificationCode.code || 
            user.verificationCode.attempts <= 0 || 
            new Date() > user.verificationCode.expiresAt) {
            return res.status(400).json({ error: 'Codigo de verificacion expirado o numero de intentos sobrepasados' });
        }

        if (user.verificationCode.code !== code) {
            user.verificationCode.attempts -= 1;
            await user.save();
            return res.status(400).json({ 
                error: 'Codigo invalido',
                attemptsLeft: user.verificationCode.attempts
            });
        }

        user.status = 'VERIFIED';
        user.verificationCode = undefined;
        await user.save();

        return res.status(200).json({ 
            message: 'Email verificado correctamente',
            status: user.status
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscamos el usuario con el email
        const user = await User.findOne({ email });
        
        // Comprobamos si existe el usuario
        if (!user) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        // Comprobamos que el usuario este verificado
        if (user.status !== 'VERIFIED') {
            return res.status(401).json({ error: 'Email no verificado' });
        }

        // Verificamos contraseña
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        // Generamos el token  JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Devolvemos los datos de usuario y el token JWT
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

const updateUserData = async (req, res) => {
    try {
        const { name, surname, nif } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        user.name = name;
        user.surname = surname;
        user.nif = nif;

        await user.save();

        res.status(200).json({
            user: {
                email: user.email,
                name: user.name,
                surname: user.surname,
                nif: user.nif,
                status: user.status,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCompanyData = async (req, res) => {
    try {
        const { company } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (company.isAutonomous) {
            // Si el usuario es autonomo, usamos los datos personales
            company.name = `${user.name} ${user.surname}`;
            company.cif = user.nif;
        }

        user.company = company;
        await user.save();

        res.status(200).json({
            user: {
                email: user.email,
                name: user.name,
                surname: user.surname,
                company: user.company
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({
            user: {
                email: user.email,
                name: user.name,
                surname: user.surname,
                nif: user.nif,
                status: user.status,
                role: user.role,
                company: user.company,
                logo: user.logo
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Fichero no subido' });
        }

        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Guardamos el logo en la carpeta uploads
        user.logo = `/uploads/${req.file.filename}`;
        await user.save();

        res.status(200).json({
            logo: user.logo
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const isSoftDelete = req.query.soft !== 'false';
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (isSoftDelete) {
            // Soft delete, solo lo marcamos como borrado
            user.deletedAt = new Date();
            await user.save();
        } else {
            // Hard delete, lo borramos del mongo
            await User.findByIdAndDelete(userId);
        }

        res.status(200).json({
            message: `Usuario ${isSoftDelete ? 'soft' : 'hard'} deleteado correctamente` // Mensaje para saber si el usuario ha sido borrado por soft o por hard delete
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Generamos codigo de reseteo
        const resetCode = generateVerificationCode();
        const codeExpiration = new Date();
        codeExpiration.setHours(codeExpiration.getHours() + 1);

        user.passwordReset = {
            code: resetCode,
            attempts: 3,
            expiresAt: codeExpiration
        };

        await user.save();

        // Aqui se podria enviar el codigo de reseteo al correo
        res.status(200).json({
            message: 'Recuperacion de contraseña enviado',
            code: resetCode // Para comprobar
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (!user.passwordReset || 
            !user.passwordReset.code || 
            user.passwordReset.attempts <= 0 || 
            new Date() > user.passwordReset.expiresAt) {
            return res.status(400).json({ error: 'Codigo de restablecimiento expirado o numero de intentos excedido. ' });
        }

        if (user.passwordReset.code !== code) {
            user.passwordReset.attempts -= 1;
            await user.save();
            return res.status(400).json({ 
                error: 'Codigo invalido',
                attemptsLeft: user.passwordReset.attempts
            });
        }

        user.password = newPassword;
        user.passwordReset = undefined;
        await user.save();

        res.status(200).json({
            message: 'Contraseña restablecida correctamente'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const inviteToCompany = async (req, res) => {
    try {
        const { email } = req.body;
        const inviterId = req.user.userId;

        // Comprobamos si la persona ya tiene una compañia
        const inviter = await User.findById(inviterId);
        if (!inviter || !inviter.company) {
            return res.status(400).json({ error: 'Debes tener una compañia asociada' });
        }

        // Comprobamos si el invitado existe y esta verificado
        const invitee = await User.findOne({ email, status: 'VERIFIED' });
        if (!invitee) {
            return res.status(404).json({ error: 'Usuario no encontrado o no verificado' });
        }

        // Comprobamos si el usuario ya esta en una compañia
        if (invitee.companyId) {
            return res.status(400).json({ error: 'Usuario ya pertenece a una compañia' });
        }

        // Actualizamos el invitado
        invitee.role = 'GUEST';
        invitee.companyId = inviterId;
        await invitee.save();

        res.status(200).json({
            message: 'Usuario invitado a la compañia',
            guest: {
                email: invitee.email,
                role: invitee.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    register, 
    validateEmail, 
    login, 
    updateUserData, 
    updateCompanyData,
    updateLogo,
    getUser,
    deleteUser,
    requestPasswordReset,
    resetPassword,
    inviteToCompany    
};
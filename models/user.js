const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Introduzca un correo correcto'] // Esto es para comprobar todos los tipos de correo, lo encontré por internet la verdad
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    status: {
        type: String,
        enum: ['PENDING', 'VERIFIED'],
        default: 'PENDING'
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN', 'GUEST'],
        default: 'USER'
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verificationCode: {
        code: {
            type: String,
            length: 6
        },
        attempts: {
            type: Number,
            default: 3
        },
        expiresAt: {
            type: Date
        }
    },
    name: {
        type: String,
        trim: true
    },
    surname: {
        type: String,
        trim: true
    },
    nif: {
        type: String,
        trim: true
    },
    company: {
        name: {
            type: String,
            trim: true
        },
        cif: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        isAutonomous: {
            type: Boolean,
            default: false
        }
    },
    logo: {
        type: String,
        trim: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    passwordReset: {
        code: {
            type: String,
            length: 6
        },
        attempts: {
            type: Number,
            default: 3
        },
        expiresAt: {
            type: Date
        }
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
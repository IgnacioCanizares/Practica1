const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String
        },
        company: {
            type: mongoose.Types.ObjectId,
            ref: 'Company'
        },
        createdBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        },
        isArchived: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model('Client', ClientSchema);
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        client: {
            type: mongoose.Types.ObjectId,
            ref: 'Client',
            required: true
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

module.exports = mongoose.model('Project', ProjectSchema);
const mongoose = require('mongoose');

const DeliveryNoteSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        client: {
            type: mongoose.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        createdBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
        },
        company: {
            type: mongoose.Types.ObjectId,
            ref: 'Company'
        },
        items: [
            {
                type: {
                    type: String,
                    enum: ['HOURS', 'MATERIAL'],
                    required: true
                },
                description: {
                    type: String,
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                },
                unitPrice: {
                    type: Number,
                    required: true
                },
                // Para el caso de horas
                person: {
                    type: String
                },
                date: {
                    type: Date
                },
                // Para el caso de materiales
                reference: {
                    type: String
                }
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        notes: {
            type: String
        },
        signature: {
            date: Date,
            imageUrl: String
        },
        pdfUrl: {
            type: String
        },
        isArchived: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            enum: ['DRAFT', 'SIGNED'],
            default: 'DRAFT'
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model('DeliveryNote', DeliveryNoteSchema);
const DeliveryNote = require('../models/deliveryNote');
const Project = require('../models/project');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const createDeliveryNote = async (req, res, next) => {
    try {
        const { projectId, items, notes } = req.body;
        const userId = req.user._id;
        
        // Validar projectId
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'ID de proyecto no válido' });
        }

        // Validar el array de items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'El array de items no puede estar vacío' });
        }

        // Validar cada item
        for (const item of items) {
            if (!['HOURS', 'MATERIAL'].includes(item.type)) {
                return res.status(400).json({ error: 'Tipo de item no válido' });
            }
            if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                return res.status(400).json({ error: 'La cantidad debe ser un número positivo' });
            }
            if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
                return res.status(400).json({ error: 'El precio unitario debe ser un número no negativo' });
            }
        }

        // Obtener el proyecto para validar y obtener el cliente
        const project = await Project.findOne({ 
            _id: projectId,
            $or: [
                { createdBy: userId }
            ]
        }).populate('client');

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        // Manejar el campo company correctamente
        let companyId = null;
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                companyId = req.user.company._id;
                // También comprobar si el proyecto pertenece a la compañía
                if (!project.company.equals(companyId)) {
                    const projectCompanyQuery = await Project.findOne({
                        _id: projectId,
                        company: companyId
                    });
                    if (!projectCompanyQuery) {
                        return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
                    }
                }
            } else if (typeof req.user.company !== 'object') {
                companyId = req.user.company;
            }
        }
        
        // Calcular el monto total
        const totalAmount = items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice);
        }, 0);
        
        // Crear el albarán
        const deliveryNoteData = {
            project: projectId,
            client: project.client._id,
            createdBy: userId,
            items,
            totalAmount,
            notes
        };

        if (companyId) {
            deliveryNoteData.company = companyId;
        }

        const deliveryNote = await DeliveryNote.create(deliveryNoteData);

        // Poblar referencias para la respuesta
        await deliveryNote.populate([
            { path: 'project' },
            { path: 'client' },
            { path: 'createdBy', select: 'name email' }
        ]);

        res.status(201).json(deliveryNote);
    } catch (error) {
        next(error);
    }
};

const getDeliveryNotes = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Crear la consulta base
        const query = {
            isArchived: false,
            $or: [{ createdBy: userId }]
        };
        
        // Solo agregar company a la consulta si es un ID válido
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }
        
        const deliveryNotes = await DeliveryNote.find(query)
            .populate('project')
            .populate('client')
            .populate('createdBy', 'name email');
            
        res.json(deliveryNotes);
    } catch (error) {
        console.error('Error al obtener los albaranes:', error);
        res.status(500).json({ error: error.message });
    }
};

const getDeliveryNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        // Crear la consulta base
        const query = {
            _id: id,
            isArchived: false,
            $or: [{ createdBy: userId }]
        };
        
        // Solo agregar company a la consulta si es un ID válido
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }
        
        const deliveryNote = await DeliveryNote.findOne(query)
            .populate('project')
            .populate('client')
            .populate('createdBy', 'name email');
            
        if (!deliveryNote) {
            return res.status(404).json({ error: 'Albarán no encontrado' });
        }
        
        res.json(deliveryNote);
    } catch (error) {
        console.error('Error al obtener el albarán:', error);
        res.status(500).json({ error: error.message });
    }
};

const generatePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        // Crear la consulta base
        const query = {
            _id: id,
            $or: [{ createdBy: userId }]
        };
        
        // Solo agregar company a la consulta si es un ID válido
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }
        
        const deliveryNote = await DeliveryNote.findOne(query)
            .populate('project')
            .populate('client')
            .populate('createdBy', 'name email company');
            
        if (!deliveryNote) {
            return res.status(404).json({ error: 'Albarán no encontrado' });
        }
        
        // Si el PDF ya está en almacenamiento en la nube, redirigir a esa URL
        if (deliveryNote.signature && deliveryNote.pdfUrl) {
            return res.redirect(deliveryNote.pdfUrl);
        }
        
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        
        // Crear el directorio para los PDFs si no existe
        const pdfDir = path.join(__dirname, '../uploads/pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }
        
        // Definir la ruta del archivo
        const filename = `delivery-note-${id}.pdf`;
        const filePath = path.join(pdfDir, filename);
        
        // Crear el stream de escritura para guardar el PDF en disco
        const writeStream = fs.createWriteStream(filePath);
        
        // Establecer los encabezados de respuesta para la descarga del PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        // Enviar el PDF tanto al archivo como a la respuesta
        doc.pipe(writeStream);
        doc.pipe(res);
        
        // Agregar contenido al PDF
        doc.fontSize(25).text('Albarán', { align: 'center' });
        doc.moveDown();
        
        // Información de la compañía
        doc.fontSize(14).text('Información de la compañía:');
        doc.fontSize(10).text(`Creado por: ${deliveryNote.createdBy.name || deliveryNote.createdBy.email}`);
        if (deliveryNote.createdBy.company) {
            doc.text(`Compañía: ${deliveryNote.createdBy.company.name || 'N/A'}`);
        }
        doc.moveDown();
        
        // Información del cliente
        doc.fontSize(14).text('Información del cliente:');
        doc.fontSize(10).text(`Nombre: ${deliveryNote.client.name}`);
        doc.text(`Email: ${deliveryNote.client.email}`);
        doc.text(`Teléfono: ${deliveryNote.client.phone || 'N/A'}`);
        doc.moveDown();
        
        // Información del proyecto
        doc.fontSize(14).text('Información del proyecto:');
        doc.fontSize(10).text(`Nombre: ${deliveryNote.project.name}`);
        doc.text(`Descripción: ${deliveryNote.project.description || 'N/A'}`);
        doc.moveDown();
        
        // Items
        doc.fontSize(14).text('Items:');
        doc.moveDown();
        
        // Crear una tabla para los items
        const itemsTableTop = doc.y;
        const itemsTableWidth = 500;
        
        // Dibujar los encabezados de la tabla
        doc.fontSize(10);
        doc.text('Tipo', 50, itemsTableTop);
        doc.text('Descripción', 120, itemsTableTop);
        doc.text('Cantidad', 300, itemsTableTop);
        doc.text('Precio Unitario', 370, itemsTableTop);
        doc.text('Total', 450, itemsTableTop);
        
        doc.moveTo(50, itemsTableTop - 5)
           .lineTo(550, itemsTableTop - 5)
           .stroke();
           
        doc.moveTo(50, itemsTableTop + 15)
           .lineTo(550, itemsTableTop + 15)
           .stroke();
        
        // Dibujar los items
        let itemY = itemsTableTop + 30;
        
        deliveryNote.items.forEach(item => {
            doc.text(item.type, 50, itemY);
            doc.text(item.description, 120, itemY);
            doc.text(item.quantity.toString(), 300, itemY);
            doc.text(`$${item.unitPrice.toFixed(2)}`, 370, itemY);
            doc.text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, 450, itemY);
            
            // Agregar persona/fecha para HOURS o referencia para MATERIAL
            if (item.type === 'HOURS' && item.person) {
                itemY += 15;
                doc.text(`Persona: ${item.person}`, 120, itemY);
                if (item.date) {
                    doc.text(`Fecha: ${new Date(item.date).toLocaleDateString()}`, 300, itemY);
                }
            } else if (item.type === 'MATERIAL' && item.reference) {
                itemY += 15;
                doc.text(`Referencia: ${item.reference}`, 120, itemY);
            }
            
            itemY += 30;
        });
        
        // Dibujar la línea inferior
        doc.moveTo(50, itemY - 15)
           .lineTo(550, itemY - 15)
           .stroke();
        
        // Agregar el total
        doc.fontSize(12).text(`Importe total: $${deliveryNote.totalAmount.toFixed(2)}`, { align: 'right' });
        doc.moveDown();
        
        // Agregar notas si existen
        if (deliveryNote.notes) {
            doc.fontSize(14).text('Notas:');
            doc.fontSize(10).text(deliveryNote.notes);
            doc.moveDown();
        }
        
        // Agregar firma si está disponible
        if (deliveryNote.signature && deliveryNote.signature.imageUrl) {
            doc.fontSize(14).text('Firma:');
            doc.image(deliveryNote.signature.imageUrl, {
                fit: [200, 100],
                align: 'center'
            });
            doc.fontSize(10).text(`Firmado el: ${new Date(deliveryNote.signature.date).toLocaleDateString()}`, { align: 'center' });
        } else {
            doc.fontSize(14).text('Firma:');
            doc.moveDown();
            doc.fontSize(10).text('_______________________________', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text('Fecha: ___________________', { align: 'center' });
        }
        
        // Finalizar el PDF
        doc.end();
        
        // Actualizar el albarán con la URL del PDF si está firmado
        if (deliveryNote.signature && !deliveryNote.pdfUrl) {
            deliveryNote.pdfUrl = `/uploads/pdfs/${filename}`;
            await deliveryNote.save();
        }
        
    } catch (error) {
        console.error('Error al generar el PDF:', error);
        res.status(500).json({ error: error.message });
    }
};

const signDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        // Comprobar si se subió la imagen de la firma
        if (!req.file) {
            return res.status(400).json({ error: 'Se requiere la imagen de la firma' });
        }
        
        // Crear la consulta base
        const query = {
            _id: id,
            $or: [{ createdBy: userId }]
        };
        
        // Solo agregar company a la consulta si es un ID válido
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }
        
        const deliveryNote = await DeliveryNote.findOne(query);
            
        if (!deliveryNote) {
            return res.status(404).json({ error: 'Albarán no encontrado' });
        }

        if (deliveryNote.status === 'SIGNED') {
            return res.status(400).json({ error: 'El albarán ya está firmado' });
        }
        
        // Guardar la URL de la firma
        const signatureUrl = `/uploads/${req.file.filename}`;
        
        // Actualizar el albarán con la firma
        deliveryNote.signature = {
            date: new Date(),
            imageUrl: signatureUrl
        };
        deliveryNote.status = 'SIGNED';
        
        // En una app real, aquí se generaría y subiría el PDF a la nube
        deliveryNote.pdfUrl = `/api/deliverynote/pdf/${id}`;
        
        await deliveryNote.save();
        
        res.json({
            message: 'Albarán firmado correctamente',
            deliveryNote
        });
    } catch (error) {
        console.error('Error al firmar el albarán:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        // Crear la consulta base
        const query = {
            _id: id,
            $or: [{ createdBy: userId }]
        };
        
        // Solo agregar company a la consulta si es un ID válido
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }
        
        const deliveryNote = await DeliveryNote.findOne(query);
            
        if (!deliveryNote) {
            return res.status(404).json({ error: 'Albarán no encontrado' });
        }
        
        // Solo bloquear la eliminación si el albarán está firmado
        if (deliveryNote.signature && deliveryNote.signature.imageUrl) {
            return res.status(400).json({ error: 'No se puede eliminar un albarán firmado' });
        }
        
        await DeliveryNote.findByIdAndDelete(id);
        
        res.status(200).json({ message: 'Albarán eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el albarán:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createDeliveryNote,
    getDeliveryNotes,
    getDeliveryNoteById,
    generatePDF,
    signDeliveryNote,
    deleteDeliveryNote
};
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const {
    createDeliveryNote,
    getDeliveryNotes,
    getDeliveryNoteById,
    generatePDF,
    signDeliveryNote,
    deleteDeliveryNote
} = require('../controllers/deliveryNote');

// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function(req, file, cb) {
        cb(null, `signature-${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Aplicar el middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     ItemAlbaran:
 *       type: object
 *       required:
 *         - type
 *         - description
 *         - quantity
 *         - unitPrice
 *       properties:
 *         type:
 *           type: string
 *           enum: [HOURS, MATERIAL]
 *           description: Tipo de item (HORAS o MATERIAL)
 *         description:
 *           type: string
 *           description: Descripción del trabajo o material
 *         quantity:
 *           type: number
 *           description: Número de horas o cantidad de material
 *         unitPrice:
 *           type: number
 *           description: Precio por hora o por unidad
 *         person:
 *           type: string
 *           description: Persona que realizó el trabajo (para tipo HORAS)
 *         date:
 *           type: string
 *           format: date-time
 *           description: Fecha en la que se realizó el trabajo (para tipo HORAS)
 *         reference:
 *           type: string
 *           description: Código de referencia del material (para tipo MATERIAL)
 *     
 *     Albaran:
 *       type: object
 *       required:
 *         - project
 *         - client
 *         - items
 *         - totalAmount
 *       properties:
 *         _id:
 *           type: string
 *           description: ID autogenerado del albarán
 *         project:
 *           type: string
 *           description: ID del proyecto asociado al albarán
 *         client:
 *           type: string
 *           description: ID del cliente asociado al albarán
 *         createdBy:
 *           type: string
 *           description: ID del usuario que creó el albarán
 *         company:
 *           type: string
 *           description: ID de la empresa asociada al albarán
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemAlbaran'
 *           description: Lista de items (horas o materiales)
 *         totalAmount:
 *           type: number
 *           description: Importe total del albarán
 *         notes:
 *           type: string
 *           description: Notas adicionales
 *         signature:
 *           type: object
 *           properties:
 *             date:
 *               type: string
 *               format: date-time
 *               description: Fecha de la firma del albarán
 *             imageUrl:
 *               type: string
 *               description: URL de la imagen de la firma
 *           description: Información de la firma
 *         pdfUrl:
 *           type: string
 *           description: URL del PDF generado
 *         isArchived:
 *           type: boolean
 *           description: Indica si el albarán está archivado
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del albarán
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización del albarán
 */

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear un nuevo albarán
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - items
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID del proyecto
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ItemAlbaran'
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Albaran'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proyecto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: Obtener todos los albaranes
 *     tags: [Albaranes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de albaranes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Albaran'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Get a delivery note by ID
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Delivery note ID
 *     responses:
 *       200:
 *         description: Delivery note details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryNote'
 *       404:
 *         description: Delivery note not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', getDeliveryNoteById);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Generate and download a PDF for a delivery note
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Delivery note ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Delivery note not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/pdf/:id', generatePDF);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   post:
 *     summary: Sign a delivery note
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Delivery note ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Signature image file
 *     responses:
 *       200:
 *         description: Delivery note signed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Signature image is required
 *       404:
 *         description: Delivery note not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/sign', upload.single('signature'), signDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Delete a delivery note
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Delivery note ID
 *     responses:
 *       200:
 *         description: Delivery note deleted successfully
 *       400:
 *         description: Cannot delete a signed delivery note
 *       404:
 *         description: Delivery note not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteDeliveryNote);

module.exports = router;
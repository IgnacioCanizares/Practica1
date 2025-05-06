const Client = require('../models/client');
const { notFound, badRequest, forbidden } = require('../utils/errors');
const sendValidationEmail = require('../utils/sendValidationEmail');

const createClient = async (req, res) => {
    try {
        const { name, email, phone } = req.body; // Recibimos los datos del cliente de la solicitud
        const userId = req.user._id; // Obtenemos el ID del usuario
        
        // Creamos la query base
        const query = { 
            email,
            $or: [{ createdBy: userId }]
        };
        
        // Si este usuario es autónomo, no incluimos la compañía en la query
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                // Si company es un objeto con _id, lo usamos
                query.$or.push({ company: req.user.company._id }); // Usamos el ID de la compañía para la búsqueda
            } else if (typeof req.user.company !== 'object') { 
                // Si company es un string/ObjectId, lo usamos directamente
                query.$or.push({ company: req.user.company });
            }
        }

        // Ya con los datos, buscamos si el cliente ya existe
        const existingClient = await Client.findOne(query); 

        if (existingClient) { // Si el cliente existe, devolvemos un error 400
            throw badRequest('El cliente ya existe');
        }

        // Si el cliente no existe, lo creamos
        const clientData = {
            name,
            email,
            phone,
            createdBy: userId
        };
        
        // Si este usuario es autónomo, no incluimos la compañía en los datos
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) { // Si company es un objeto con _id, lo usamos
                clientData.company = req.user.company._id; // Usamos el ID de la compañía
            } else if (typeof req.user.company !== 'object') { // Si company es un string/ObjectId, lo usamos directamente
                clientData.company = req.user.company; 
            }
        }

        const client = await Client.create(clientData); // Creamos el cliente

        // Enviamos el correo de validación al correo del cliente
        await sendValidationEmail(client);

        res.status(201).json(client); // Devolvemos el cliente creado con un estado 201
    } catch (error) {
        // console.error('Error interno de servidor: ', error); 
        next(error);
    }
};

// Actualizar un cliente
const updateClient = async (req, res) => {
    try {
        const { id } = req.params; // Obtenemos el ID del cliente de la URL
        const userId = req.user._id; // Obtenemos el ID del usuario
        
        // Creamos la query base
        const query = {
            _id: id,
            $or: [{ createdBy: userId }]
        };
        
        // Si este usuario es autónomo, no incluimos la compañía en la query
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                // Si company es un objeto con _id, lo usamos
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                // Si company es un string/ObjectId, lo usamos directamente
                query.$or.push({ company: req.user.company });
            }
        }

        // Ya con los datos, buscamos al cliente y lo actualizamos
        const client = await Client.findOneAndUpdate(query, req.body, { new: true });

        if (!client) {
            throw notFound('Cliente no encontrado');
        }

        res.status(200).json(client); // Devolvemos un estado 200
    } catch (error) {
        // console.error('Error interno de servidor: ', error);
        next(error);
    }
};

// Obtener todos los clientes
const getClients = async (req, res) => {
    try {
        const userId = req.user._id; // Obtenemos el ID del usuario
        
        // Creamos la query base
        const query = {
            isArchived: false,
            $or: [{ createdBy: userId }]
        };
        
        // Si este usuario es autónomo, no incluimos la compañía en la query
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                // Si company es un objeto con _id, lo usamos
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                // Si company es un string/ObjectId, lo usamos directamente
                query.$or.push({ company: req.user.company });
            }
        }

        console.log('Query:', JSON.stringify(query)); // Esto es para depurar, se podria eliminar
        const clients = await Client.find(query); // Buscamos todos los clientes

        res.status(200).json(clients); // Devolvemos un estado 201
    } catch (error) {
        // console.error('Error interno de servidor: ', error);
        next(error);
    }
};

// Obtener un cliente por ID
const getClientById = async (req, res, next) => {
    try {
        const { id } = req.params; // Obtenemos el ID del cliente de la URL
        const userId = req.user._id;  // Obtenemos el ID del usuario
        
        // Creamos la query base
        const query = {
            _id: id,
            isArchived: false,
            $or: [{ createdBy: userId }]
        };
        
        // Si este usuario es autónomo, no incluimos la compañía en la query...
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }
        

        // Ya con los datos, buscamos al cliente
        const client = await Client.findOne(query);

        if (!client) {
            throw notFound('Cliente no encontrado'); // Si no lo encontramos, lanzamos un error 404
        }

        res.status(201).json(client); // Devolvemos un estado 201
    } catch (error) {
        next(error); // Pasamos el error al middleware de manejo de errores
    }
};


// Archivar un cliente
const archiveClient = async (req, res) => {
    try {
        const { id } = req.params; // Obtenemos el ID del cliente de la URL
        const userId = req.user._id; // Obtenemos el ID del usuario
        
        // Creamos la query base
        const query = {
            _id: id,
            $or: [{ createdBy: userId }]
        };
        
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }

        // Ya con los datos, buscamos al cliente y lo actualizamos
        const client = await Client.findOneAndUpdate(
            query,
            { isArchived: true }, // Marcamos al cliente como archivado
            { new: true } // Devolvemos el cliente actualizado
        );

        if (!client) {
            throw notFound('Cliente no encontrado'); // Si no lo encontramos, lanzamos un error 404
        }

        res.status(201).json(client); // Devolvemos un estado 201
    } catch (error) {
        // console.error('Error interno de servidor: ', error);
        next(error);
    }
};

// Eliminar un cliente, pero no lo borramos de la base de datos
const deleteClient = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        
        const query = {
            _id: id,
            $or: [{ createdBy: userId }]
        };
        

        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }

        const client = await Client.findOneAndDelete(query);

        if (!client) {
            throw notFound('Cliente no encontrado');
        }

        res.status(201).json(client); // Devolvemos el cliente creado con un estado 201
    } catch (error) {
        next(error);
    }
};

const getArchivedClients = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const query = {
            isArchived: true,
            $or: [{ createdBy: userId }]
        };
        
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }

        const clients = await Client.find(query); // Buscamos todos los clientes

        res.status(201).json(clients); // Devolvemos el cliente creado con un estado 201
    } catch (error) {
        // console.error('Get archived clients error:', error);
        next(error);
    }
};

const restoreClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const query = {
            _id: id,
            isArchived: true,
            $or: [{ createdBy: userId }]
        };

        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                query.$or.push({ company: req.user.company._id });
            } else if (typeof req.user.company !== 'object') {
                query.$or.push({ company: req.user.company });
            }
        }

        const client = await Client.findOneAndUpdate(
            query,
            { isArchived: false },
            { new: true }
        );

        if (!client) {
            throw notFound('Cliente no encontrado');
        }

        res.status(201).json(client); // Devolvemos un estado 201
    } catch (error) {
        // console.error('Restore client error:', error);
        next(error); // Pasamos el error al middleware de manejo de errores
    }
};

module.exports = {
    createClient,
    updateClient,
    getClients,
    getClientById,
    archiveClient,
    deleteClient,
    getArchivedClients,
    restoreClient
};
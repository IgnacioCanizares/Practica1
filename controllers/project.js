const Project = require('../models/project');

const createProject = async (req, res) => {
    try {
        const { name, description, client } = req.body;
        const userId = req.user._id;
        
        // Manejar correctamente el campo company
        let companyId = null;
        if (req.user.company) {
            if (typeof req.user.company === 'object' && req.user.company._id) {
                companyId = req.user.company._id;
            } else if (typeof req.user.company !== 'object') {
                companyId = req.user.company;
            }
        }

        // Comprobar si el proyecto ya existe para este usuario/compañía y cliente
        const query = {
            name,
            client,
            $or: [{ createdBy: userId }]
        };
        
        if (companyId) {
            query.$or.push({ company: companyId });
        }

        const existingProject = await Project.findOne(query);

        if (existingProject) {
            return res.status(400).json({ error: 'El proyecto ya existe' });
        }

        // Crear los datos del proyecto
        const projectData = {
            name,
            description,
            client,
            createdBy: userId
        };
        
        if (companyId) {
            projectData.company = companyId;
        }

        const project = await Project.create(projectData);

        res.status(201).json(project);
    } catch (error) {
        console.error('Error al crear el proyecto:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateProject = async (req, res) => {
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

        const project = await Project.findOneAndUpdate(query, req.body, { new: true });

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error al actualizar el proyecto:', error);
        res.status(500).json({ error: error.message });
    }
};

const getProjects = async (req, res) => {
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

        const projects = await Project.find(query).populate('client');

        res.json(projects);
    } catch (error) {
        console.error('Error al obtener los proyectos:', error);
        res.status(500).json({ error: error.message });
    }
};

const getProjectById = async (req, res) => {
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

        const project = await Project.findOne(query).populate('client');

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error al obtener el proyecto:', error);
        res.status(500).json({ error: error.message });
    }
};

const archiveProject = async (req, res) => {
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

        const project = await Project.findOneAndUpdate(
            query,
            { isArchived: true },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error al archivar el proyecto:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteProject = async (req, res) => {
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

        const project = await Project.findOneAndDelete(query);

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json({ message: 'Proyecto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el proyecto:', error);
        res.status(500).json({ error: error.message });
    }
};

const getArchivedProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Crear la consulta base
        const query = {
            isArchived: true,
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

        const projects = await Project.find(query).populate('client');

        res.json(projects);
    } catch (error) {
        console.error('Error al obtener los proyectos archivados:', error);
        res.status(500).json({ error: error.message });
    }
};

const restoreProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        // Crear la consulta base
        const query = {
            _id: id,
            isArchived: true,
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

        const project = await Project.findOneAndUpdate(
            query,
            { isArchived: false },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json(project);
    } catch (error) {
        console.error('Error al restaurar el proyecto:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createProject,
    updateProject,
    getProjects,
    getProjectById,
    archiveProject,
    deleteProject,
    getArchivedProjects,
    restoreProject
};
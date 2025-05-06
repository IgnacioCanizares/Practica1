const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    createProject,
    updateProject,
    getProjects,
    getProjectById,
    archiveProject,
    restoreProject,
    deleteProject,
    getArchivedProjects
} = require('../controllers/project');

router.use(authMiddleware);


router.get('/archived', getArchivedProjects);


router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.patch('/:id/archive', archiveProject);
router.patch('/:id/restore', restoreProject);
router.delete('/:id', deleteProject);

module.exports = router;
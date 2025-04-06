const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { searchTrees, addTree } = require('../controllers/trees');
const upload = require('../config/multer');

// Search trees route
router.post('/search', verifyFirebaseToken, async (req, res) => {
    try {
        const { name } = req.body;
        const results = await searchTrees(name);
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new tree route
router.post('/', 
    verifyFirebaseToken, 
    upload.single('treeImage'), 
    async (req, res) => {
        try {
            const treeData = {
                ...req.body,
                treeImage: req.file ? req.file.path : null
            };
            const newTree = await addTree(treeData);
            res.status(201).json(newTree);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

module.exports = router;
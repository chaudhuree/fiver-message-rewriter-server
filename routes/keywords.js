const express = require('express');
const router = express.Router();
const Keyword = require('../models/keyword');
const { auth } = require('../middleware/auth');

// Get all keywords with pagination (public route)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const keywords = await Keyword.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Keyword.countDocuments();

        res.json({
            keywords,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get approved keywords only (public route)
router.get('/approved', async (req, res) => {
    try {
        const keywords = await Keyword.find({ isApproved: true })
            .sort({ createdAt: -1 });
        res.json(keywords);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Request a new keyword (public route)
router.post('/request', async (req, res) => {
    try {
        const { word } = req.body;
        
        // Check if keyword already exists
        const existingKeyword = await Keyword.findOne({ word: { $regex: new RegExp(`^${word}$`, 'i') } });
        if (existingKeyword) {
            return res.status(400).json({ message: 'Keyword already exists' });
        }

        const keyword = new Keyword({
            word,
            isApproved: false
        });
        await keyword.save();
        res.status(201).json(keyword);
    } catch (error) {
        res.status(500).json({ message: 'Error creating keyword request' });
    }
});

// Protected routes below (require authentication)

// Add a new keyword (admin only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    const keyword = new Keyword({
        word: req.body.word,
        isApproved: req.body.isApproved || false
    });

    try {
        const newKeyword = await keyword.save();
        res.status(201).json(newKeyword);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete all keywords (admin only)
router.delete('/deleteAll', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Keyword.deleteMany({});
        res.json({ message: 'All keywords deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting all keywords' });
    }
});

// Delete a keyword (admin only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    try {
        const keyword = await Keyword.findById(req.params.id);
        if (!keyword) {
            return res.status(404).json({ message: 'Keyword not found' });
        }
        
        await keyword.deleteOne();
        res.json({ message: 'Keyword deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update keyword approval status (admin only)
router.patch('/:id/approve', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    try {
        const keyword = await Keyword.findById(req.params.id);
        if (!keyword) {
            return res.status(404).json({ message: 'Keyword not found' });
        }
        
        keyword.isApproved = !keyword.isApproved;
        const updatedKeyword = await keyword.save();
        res.json(updatedKeyword);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
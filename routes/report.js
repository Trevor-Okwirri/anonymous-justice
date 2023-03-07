const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const {
  verifyToken,
} = require("./verifyToken");

const CrimeReport = require('../models/report');
const Comment = require('../models/Comment');
const { ObjectId } = require('mongodb');

// Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};


// Create a new crime report
router.post('/crime-reports', verifyToken, [
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters long'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  body('location').notEmpty().withMessage('Location is required'),
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { title, description, location , image_url, category, date} = req.body;

  try {
    // Create a new crime report with the user's ID as the author
    const crimeReport = await CrimeReport.create({ title, description, location, author: req.user.id , category, image: image_url, date});

    return res.status(201).json(crimeReport);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err });
  }
});

// Get all crime reports
router.get('/crime-reports', verifyToken, async (req, res) => {
  try {
    // Find all crime reports and populate the author field with the user's name
    const crimeReports = await CrimeReport.find().populate('author', 'name');

    return res.json(crimeReports);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get a single crime report
router.get('/crime-reports/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Find a crime report by ID and populate the author field with the user's name
    const crimeReport = await CrimeReport.findById(id).populate('author', 'name');

    if (!crimeReport) {
      return res.status(404).json({ message: 'Crime report not found' });
    }

    return res.json(crimeReport);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});
// Update crime report
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, location } = req.body;
    const crimeReport = await CrimeReport.findById(req.params.id);

    // Check if crime report exists
    if (!crimeReport) {
      return res.status(404).json({ message: 'Crime report not found' });
    }

    // Check if user is authorized to update the crime report
    if (crimeReport.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this crime report' });
    }

    // Update the crime report fields
    crimeReport.title = title || crimeReport.title;
    crimeReport.description = description || crimeReport.description;
    crimeReport.location = location || crimeReport.location;

    // Save the updated crime report
    const updatedCrimeReport = await crimeReport.save();

    res.json(updatedCrimeReport);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /crimes/:id
// Delete a specific crime report
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const crime = await CrimeReport.findById(req.params.id);
    if (!crime) {
      return res.status(404).json({ message: 'Crime report not found' });
    }

    // Check if the authenticated user is authorized to delete the crime report
    if (req.user.role !== 'admin' && crime.reporterId !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this crime report' });
    }

    // Delete the crime report
    await crime.remove();
    res.json({ message: 'Crime report deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Add a comment to a crime report
router.post('/crime-reports/:id/comments', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const { id } = req.params;

    const crimeReport = await CrimeReport.findById(id);

    if (!crimeReport) {
      return res.status(404).json({ message: 'Crime report not found' });
    }

    const comment = new Comment({
      author: ObjectId(req.user._id),
      text : text
    })
    const newComment = await comment.save()
    crimeReport.comments = [newComment._id, ...crimeReport.comments];

    await crimeReport.save();

    res.status(201).json({ message: 'Comment added to crime report' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
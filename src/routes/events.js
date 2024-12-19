// src/routes/events.js
const express = require('express');
const Event = require('../models/event');
const { auth, isAdmin } = require('../middleware/auth');
const { eventSchema } = require('../validation/event');

const router = express.Router();

// Get all events with search and filtering
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    
    if (req.query.title) {
      query.title = new RegExp(req.query.title, 'i');
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const events = await Event.find(query).populate('createdBy', 'email');
    res.json(events);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'email');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create new event (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { error } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const event = new Event({
      ...req.body,
      createdBy: req.user._id
    });
    
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update event (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { error } = eventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete event (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
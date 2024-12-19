// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { registerSchema, loginSchema } = require('../validation/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User(req.body);
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(req.body.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

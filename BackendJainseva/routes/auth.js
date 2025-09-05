const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, gender, mobile, email, dob, city, state, disease } = req.body;

    // ✅ Email is optional now
    if (!firstName || !lastName || !gender || !mobile || !dob) {
      return res.status(400).json({ message: 'First name, last name, gender, mobile, and DOB are required.' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      const isEmailTaken = email && existingUser.email === email;
      const isMobileTaken = existingUser.mobile === mobile;

      return res.status(409).json({
        message: isEmailTaken
          ? 'Email already exists.'
          : isMobileTaken
          ? 'Mobile number already exists.'
          : 'User already exists.'
      });
    }

    // ✅ Use DOB as password
    const hashedPassword = await bcrypt.hash(dob, 10);

    const newUser = new User({
      firstName,
      lastName,
      gender,
      mobile,
      email: email || null, // optional
      dob,
      city,
      state,
      disease,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.' });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login route
// Login route
router.post('/login', async (req, res) => {
  const { loginId, password } = req.body; // ✅ use loginId + password (dob)

  try {
    const user = await User.findOne({
      $or: [{ email: loginId }, { mobile: loginId }]
    });

    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.blocked) {
      return res.status(403).json({ message: 'You are blocked by admin. Please contact support (8870969514).' });
    }

    // ✅ password is DOB, stored hashed
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid DOB' });

    res.status(200).json({
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

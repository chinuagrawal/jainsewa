const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Signup route
// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, gender, mobile, email, dob, city, state, disease } = req.body;

    // ✅ Email is optional now
    if (!firstName || !lastName || !gender || !mobile || !dob) {
      return res.status(400).json({ message: 'First name, last name, gender, mobile, and DOB are required.' });
    }

    // ✅ Build query dynamically (only check email if filled)
    const query = [{ mobile }];
    if (email) query.push({ email });

    const existingUser = await User.findOne({ $or: query });

    if (existingUser) {
      if (email && existingUser.email === email) {
        return res.status(409).json({ message: 'Email already exists.' });
      }
      if (existingUser.mobile === mobile) {
        return res.status(409).json({ message: 'Mobile number already exists.' });
      }
      return res.status(409).json({ message: 'User already exists.' });
    }

    // ✅ Use DOB as password
    const hashedPassword = await bcrypt.hash(dob, 10);

    const newUser = new User({
      firstName,
      lastName,
      gender,
      mobile,
      email: email || null,
      dob,
      city,
      state,
      disease,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        mobile: newUser.mobile,
        email: newUser.email,
        role: newUser.role
      }
    });

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

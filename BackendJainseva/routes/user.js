const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/add-family-member', async (req, res) => {
  try {
    const { mobile, name, relation, age, gender } = req.body;

    if (!mobile || !name || !relation || !age || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔴 DUPLICATE CHECK (THIS SOLVES YOUR PROBLEM)
    const exists = user.familyMembers.some(m =>
      m.name === name &&
      m.relation === relation &&
      Number(m.age) === Number(age) &&
      m.gender === gender
    );

    if (exists) {
      return res.status(409).json({
        message: "Family member already exists"
      });
    }

    user.familyMembers.push({ name, relation, age, gender });
    await user.save();

    res.json({
      message: "Family member added successfully",
      familyMembers: user.familyMembers
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

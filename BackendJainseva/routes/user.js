const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * ➕ ADD FAMILY MEMBER
 * Mobile is always main user's mobile
 */
router.post('/add-family-member', async (req, res) => {
  try {
    const {
      mobile,
      name,
      relation,
      age,
      gender,
      dob,
      city,
      state,
      disease
    } = req.body;

    // 🔒 REQUIRED FIELD VALIDATION
    if (!mobile || !name || !relation || !age || !gender) {
      return res.status(400).json({
        message: "Name, relation, age and gender are mandatory"
      });
    }

    // 🔍 FIND USER BY MOBILE
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔴 DUPLICATE FAMILY MEMBER CHECK
    const alreadyExists = user.familyMembers.some(member =>
      member.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      member.relation.trim().toLowerCase() === relation.trim().toLowerCase() &&
      Number(member.age) === Number(age) &&
      member.gender === gender
    );

    if (alreadyExists) {
      return res.status(409).json({
        message: "Family member already exists"
      });
    }

    // ➕ ADD FAMILY MEMBER (FULL DETAILS)
    const newMember = {
      name: name.trim(),
      relation: relation.trim(),
      age: Number(age),
      gender,
      dob: dob || "",
      city: city || "",
      state: state || "",
      disease: disease || ""
    };

    user.familyMembers.push(newMember);
    await user.save();

    res.status(201).json({
      message: "Family member added successfully",
      familyMembers: user.familyMembers
    });

  } catch (error) {
    console.error("Add family member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 📥 GET FAMILY MEMBERS BY MOBILE
 * Used on dashboard load
 */
router.get('/family-members/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Family member added successfully",
      user: user
    });


  } catch (error) {
    console.error("Fetch family members error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

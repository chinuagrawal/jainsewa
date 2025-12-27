const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    disease: { type: String }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String },
    dob: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    blocked: { type: Boolean, default: false },

    // ✅ Main user medical details
    city: { type: String },
    state: { type: String },
    disease: { type: String },

    // ✅ Family members with FULL details
    familyMembers: [familyMemberSchema],

    // ✅ Admin custom pricing
    customPricing: {
      am: Number,
      pm: Number,
      full: Number,
      offers: [
        {
          duration: Number,
          discount: Number
        }
      ],
      paymentGatewayFeePercent: Number,
      convenienceFee: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

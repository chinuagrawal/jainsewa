const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  gender:    { type: String, required: true },
  mobile:    { type: String, required: true, unique: true },
  email: { type: String }, // optional email
  dob:       { type: String, required: true }, // store DOB (e.g., "2000-05-12")
  password:  { type: String, required: true }, // hashed DOB
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  blocked:   { type: Boolean, default: false }, 

  // ✅ Newly added patient details
  city:      { type: String },
  state:     { type: String },
  disease:   { type: String },

  // ✅ Admin custom pricing
  customPricing: {
    am: Number,
    pm: Number,
    full: Number,
    offers: [
      {
        duration: Number, // e.g., 2 months
        discount: Number  // e.g., 20 off
      }
    ],
    paymentGatewayFeePercent: Number,
    convenienceFee: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

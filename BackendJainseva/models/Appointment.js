const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  userEmail: { type: String },
  userMobile: { type: String },
  patient: {
    type: {
      type: String,
      enum: ["self", "family"],
      required: true
    },
    name: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    relation: { type: String },
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  doctor: { type: String, default: 'General' },
  date: { type: Date },
  notes: { type: String },
  fee: { type: Number },
  paymentTxnId: { type: String },
  paymentMethod: { type: String, default: 'online' },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  viewed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

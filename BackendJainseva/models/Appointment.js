const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  userMobile: { type: String },
  doctor: { type: String, default: 'General' },
  date: { type: Date },
  notes: { type: String },
  fee: { type: Number, required: true },
  paymentTxnId: { type: String },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

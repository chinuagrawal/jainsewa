const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  userEmail: { type: String},
  userMobile: { type: String },
  patientName: { type: String },
  doctor: { type: String, default: 'General' },
  date: { type: Date },
  notes: { type: String },
  fee: { type: Number},
  paymentTxnId: { type: String },
  paymentMethod: { type: String, default: 'online' },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  viewed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

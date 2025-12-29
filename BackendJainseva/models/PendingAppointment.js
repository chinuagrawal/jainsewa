const mongoose = require('mongoose');

const PendingAppointmentSchema = new mongoose.Schema({
  txnId: { type: String, required: true, unique: true },
  email: { type: String },                     // ✅ optional now
  mobile: { type: String, required: true },
  amount: { type: Number, required: true },
  purpose: { type: String, default: 'Doctor Consultation' },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingAppointment', PendingAppointmentSchema);

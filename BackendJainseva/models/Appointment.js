const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  userEmail: { type: String},
  userMobile: { type: String },
  doctor: { type: String, default: 'General' },
  date: { type: Date },
  notes: { type: String },
  fee: { type: Number},
  paymentTxnId: { type: String },
  paymentMethod: { type: String, default: 'online' },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  viewed: { type: Boolean, default: false },
patientType: {
  type: String,
  enum: ["self", "family"],
  default: "self"
},

patient: {
  name: String,
  age: Number,
  gender: String,
  city: String,
  state: String,
  disease: String
},

familyMemberId: {
  type: mongoose.Schema.Types.ObjectId,
  default: null
},
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

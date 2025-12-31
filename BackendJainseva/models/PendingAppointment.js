const mongoose = require("mongoose");

const PendingAppointmentSchema = new mongoose.Schema({
  txnId: { type: String, required: true, unique: true },

  email: String,
  mobile: { type: String, required: true },

  amount: { type: Number, required: true },
  notes: String,

  // ✅ REQUIRED PATIENT SNAPSHOT
  patient: {
    type: {
      type: String,
      enum: ["self", "family"],
      required: true
    },
    name: { type: String, required: true },
    relation: String,
    age: Number,
    gender: String,
    city: String,
    state: String,
    disease: String
  },

  doctor: String,
  date: Date,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model(
  "PendingAppointment",
  PendingAppointmentSchema
);

const mongoose = require("mongoose");

const PendingAppointmentSchema = new mongoose.Schema({
  txnId: { type: String, required: true, unique: true },

  // payer
  email: String,
  mobile: { type: String, required: true },

  amount: { type: Number, required: true },
  purpose: String,
  notes: String,

  // 🔴 IMPORTANT: patient info
  patient: {
    type: {
      type: String,
      enum: ["self", "family"],
      required: true
    },
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },

  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PendingAppointment", PendingAppointmentSchema);

const PendingAppointmentSchema = new mongoose.Schema({
  txnId: { type: String, required: true, unique: true },
  email: { type: String, required: false },     // ⬅️ not required now
  mobile: { type: String, required: true },     // ⬅️ make this required instead (for contact)
  amount: { type: Number, required: true },
  purpose: { type: String, default: 'Doctor Consultation' },
  notes: { type: String },
  paymentMethod: { type: String, enum: ['phonepe', 'upi', 'card'], default: 'phonepe' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

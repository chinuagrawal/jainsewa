const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment'); // adjust path
const PendingAppointment = require('../models/PendingAppointment'); // adjust path

router.post('/phonepe/webhook', async (req, res) => {
  try {
    console.log('📥 PhonePe Callback Received (Appointments):', req.body);

    const payload = req.body.payload;
    if (!payload) {
      console.error("❌ Invalid webhook format");
      return res.status(200).send("OK"); // ACK to PhonePe
    }

    const { merchantOrderId, state, paymentDetails, metaInfo } = payload;

    if (state === "COMPLETED") {
      const phonepeTxn = paymentDetails?.[0]?.transactionId || null;
      const paymentMode = paymentDetails?.[0]?.paymentMode || "UNKNOWN";
      const email = metaInfo?.udf1 || null;

      // 1️⃣ Check if appointment already exists
      const existing = await Appointment.findOne({ paymentTxnId: merchantOrderId });
      if (!existing) {
        // 2️⃣ Find Pending Appointment
        const pending = await PendingAppointment.findOne({ txnId: merchantOrderId });
        if (pending) {
          // ✅ Create confirmed appointment
          const appointment = new Appointment({
            appointmentId: 'APT_' + Date.now(),
            userEmail: pending.email,
            userMobile: pending.mobile,
            patient: pending.patient, 
            doctor: pending.doctor || 'General',
            date: pending.date,
            notes: pending.notes || '',
            fee: pending.amount,
            status: 'confirmed',
            paymentMode,
            paymentTxnId: merchantOrderId,  // our txnId
            transactionId: phonepeTxn,      // PhonePe’s txnId
            paymentConfirmedVia: "webhook"
          });

          await appointment.save();
          await PendingAppointment.deleteOne({ _id: pending._id });

          console.log(`✅ Appointment confirmed for ${email}, TXN: ${merchantOrderId}`);
        } else {
          console.warn("⚠️ Pending appointment not found for:", merchantOrderId);
        }
      } else {
        console.log("ℹ️ Appointment already exists, skipping duplicate:", merchantOrderId);
      }
    } else {
      // ❌ Payment failed or expired → cleanup
      await PendingAppointment.deleteOne({ txnId: payload.merchantOrderId });
      console.log(`❌ Payment failed/expired: ${payload.merchantOrderId}`);
    }

    res.status(200).send("OK"); // Always ACK to PhonePe
  } catch (err) {
    console.error("❌ Webhook error (Appointments):", err);
    res.status(200).send("OK");
  }
});

module.exports = router;

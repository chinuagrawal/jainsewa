const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const PendingAppointment = require('../models/PendingAppointment');
const User = require('../models/User');

router.post('/phonepe/webhook', async (req, res) => {
  try {
    console.log('📥 PhonePe Callback Received:', JSON.stringify(req.body, null, 2));

    const payload = req.body.payload;
    if (!payload) {
      console.error('❌ Invalid webhook payload');
      return res.status(200).send('OK');
    }

    const { merchantOrderId, state, paymentDetails } = payload;

    if (state !== 'COMPLETED') {
      await PendingAppointment.deleteOne({ txnId: merchantOrderId });
      console.log('❌ Payment failed or expired:', merchantOrderId);
      return res.status(200).send('OK');
    }

    // Prevent duplicate appointments
    const existing = await Appointment.findOne({ paymentTxnId: merchantOrderId });
    if (existing) {
      console.log('ℹ️ Appointment already exists:', merchantOrderId);
      return res.status(200).send('OK');
    }

    const pending = await PendingAppointment.findOne({ txnId: merchantOrderId });
    if (!pending) {
      console.error('❌ PendingAppointment NOT FOUND:', merchantOrderId);
      return res.status(200).send('OK');
    }

    // 🔑 Determine patient name
    let patientName = 'Self';

    if (pending.patient?.type === 'self') {
      patientName = pending.patient.name;
    }

    if (pending.patient?.type === 'family') {
      const user = await User.findOne({ mobile: pending.mobile });
      const member = user?.familyMembers?.id(pending.patient.memberId);
      patientName = member ? member.name : 'Family Member';
    }

    const phonepeTxn = paymentDetails?.[0]?.transactionId || null;
    const paymentMode = paymentDetails?.[0]?.paymentMode || 'ONLINE';

    const appointment = new Appointment({
      appointmentId: 'APT_' + Date.now(),

      userMobile: pending.mobile,
      userEmail: pending.email || null,

      patientName,
      doctor: 'General',

      date: new Date(),
      notes: pending.notes || '',

      fee: pending.amount,
      paymentTxnId: merchantOrderId,
      paymentMethod: paymentMode,

      status: 'confirmed',
      viewed: false
    });

    await appointment.save();
    await PendingAppointment.deleteOne({ _id: pending._id });

    console.log('✅ Appointment CREATED:', patientName, merchantOrderId);
    res.status(200).send('OK');

  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(200).send('OK');
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const PendingAppointment = require("../models/PendingAppointment");
const User = require("../models/User");
router.post("/phonepe/webhook", async (req, res) => {
  try {
    const payload = req.body.payload;
    if (!payload) return res.status(200).send("OK");

    const { merchantOrderId, state, paymentDetails } = payload;

    if (state !== "COMPLETED") {
      await PendingAppointment.deleteOne({ txnId: merchantOrderId });
      return res.status(200).send("OK");
    }

    const existing = await Appointment.findOne({
      paymentTxnId: merchantOrderId
    });
    if (existing) return res.status(200).send("OK");

    const pending = await PendingAppointment.findOne({
      txnId: merchantOrderId
    });
    if (!pending) return res.status(200).send("OK");

    // ✅ USE SNAPSHOT ONLY
    const patient = pending.patient || {};
    const patientType = patient.type || "self";

    const phonepeTxn = paymentDetails?.[0]?.transactionId || null;
    const paymentMode = paymentDetails?.[0]?.paymentMode || "UNKNOWN";

    const appointment = new Appointment({
      appointmentId: "APT_" + Date.now(),

      userMobile: pending.mobile,
      userEmail: pending.email,

      patientType,
      patient: {
        name: patient.name,
        relation: patient.relation || null,
        age: patient.age || null,
        gender: patient.gender || null,
        city: patient.city || null,
        state: patient.state || null,
        disease: patient.disease || null
      },

      doctor: pending.doctor || "General",
      date: pending.date || new Date(),
      notes: pending.notes || "",
      fee: pending.amount,

      paymentTxnId: merchantOrderId,
      transactionId: phonepeTxn,
      paymentMode,
      paymentConfirmedVia: "webhook",

      status: "confirmed"
    });

    await appointment.save();
    await PendingAppointment.deleteOne({ _id: pending._id });

    console.log(
      `✅ Appointment confirmed for ${patient.name} | Mobile: ${pending.mobile}`
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(200).send("OK");
  }
});


module.exports = router;

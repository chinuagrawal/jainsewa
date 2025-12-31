const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const PendingAppointment = require("../models/PendingAppointment");
const User = require("../models/User");

router.post("/phonepe/webhook", async (req, res) => {
  try {
    console.log("📥 PhonePe Callback Received (Appointments):", req.body);

    const payload = req.body.payload;
    if (!payload) {
      console.error("❌ Invalid webhook payload");
      return res.status(200).send("OK"); // ACK to PhonePe
    }

    const { merchantOrderId, state, paymentDetails } = payload;

    // ✅ Only handle successful payments
    if (state !== "COMPLETED") {
      await PendingAppointment.deleteOne({ txnId: merchantOrderId });
      console.log(`❌ Payment failed/expired: ${merchantOrderId}`);
      return res.status(200).send("OK");
    }

    // ✅ Prevent duplicate appointments
    const existing = await Appointment.findOne({
      paymentTxnId: merchantOrderId
    });
    if (existing) {
      console.log("ℹ️ Appointment already exists, skipping:", merchantOrderId);
      return res.status(200).send("OK");
    }

    // 1️⃣ Find pending appointment
    const pending = await PendingAppointment.findOne({
      txnId: merchantOrderId
    });
    if (!pending) {
      console.warn("⚠️ Pending appointment not found:", merchantOrderId);
      return res.status(200).send("OK");
    }

    // 2️⃣ Fetch user (payer)
    const user = await User.findOne({ mobile: pending.mobile });
    if (!user) {
      console.error("❌ User not found for mobile:", pending.mobile);
      return res.status(200).send("OK");
    }

    // 3️⃣ Resolve patient snapshot
    let patientType = pending.patient?.type || "self";
    let patientSnapshot = {};
    let familyMemberId = null;

    if (patientType === "family") {
      const member = user.familyMembers.id(
        pending.patient.familyMemberId
      );

      if (!member) {
        console.error("❌ Family member not found:", pending.patient.familyMemberId);
        return res.status(200).send("OK");
      }

      patientSnapshot = {
        name: member.name,
        age: member.age,
        gender: member.gender,
        city: member.city,
        state: member.state,
        disease: member.disease
      };

      familyMemberId = member._id;
    } else {
      // SELF
      patientSnapshot = {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        gender: user.gender,
        city: user.city,
        state: user.state,
        disease: user.disease
      };
    }

    // 4️⃣ Extract PhonePe payment info
    const phonepeTxn =
      paymentDetails?.[0]?.transactionId || null;
    const paymentMode =
      paymentDetails?.[0]?.paymentMode || "UNKNOWN";

    // 5️⃣ Create appointment (FINAL)
    const appointment = new Appointment({
      appointmentId: "APT_" + Date.now(),

      // 🔒 CONTACT (never changes)
      userMobile: user.mobile,
      userEmail: user.email,

      // 🧍 PATIENT (changes)
      patientType,
      patient: patientSnapshot,
      familyMemberId,

      // 📋 APPOINTMENT
      doctor: pending.doctor || "General",
      date: pending.date || new Date(),
      notes: pending.notes || "",
      fee: pending.amount,

      // 💳 PAYMENT
      paymentTxnId: merchantOrderId,
      transactionId: phonepeTxn,
      paymentMode,
      paymentConfirmedVia: "webhook",

      status: "confirmed"
    });

    await appointment.save();
    await PendingAppointment.deleteOne({ _id: pending._id });

    console.log(
      `✅ Appointment confirmed for ${patientSnapshot.name} | Mobile: ${user.mobile}`
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error (Appointments):", err);
    return res.status(200).send("OK"); // always ACK
  }
});

module.exports = router;

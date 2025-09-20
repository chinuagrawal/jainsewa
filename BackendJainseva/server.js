// ✅ Fully Updated server.js with PhonePe V2 Integration
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const router = express.Router();
const app = express();
app.get("/", (req, res) => res.send("Server is running"));
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());



// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Models & Routes
const Appointment = require('./models/Appointment');
const PendingAppointment = require('./models/PendingAppointment');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');

app.use('/api', authRoutes);
app.use('/api', webhookRoutes);





const deleteUserRoute = require('./routes/deleteuser');
app.use('/api', deleteUserRoute);

const blockUserRoute = require('./routes/blockuser');
app.use('/api', blockUserRoute);









// GET /api/admin/appointments
// Optional query: status, from=YYYY-MM-DD, to=YYYY-MM-DD, period=days, limit, skip
app.get('/api/admin/appointments', async (req, res) => {
  try {
    const { status, from, to, period, limit = 200, skip = 0 } = req.query;

    // Build match stage
    const match = {};
    if (status) match.status = status;

    // Date filtering (createdAt)
    let startDate, endDate;
    if (period) {
      const now = new Date();
      startDate = new Date(now.getTime() - Number(period) * 24 * 60 * 60 * 1000);
      endDate = now;
    } else {
      if (from) startDate = new Date(from);
      if (to) {
        endDate = new Date(to);
        endDate.setHours(23,59,59,999);
      }
    }
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: Number(skip) },
      { $limit: Math.min(1000, Number(limit)) },
      {
        $lookup: {
          from: 'users',              // ensure your users collection is named 'users'
          localField: 'userMobile',   // appointment holds mobile here
          foreignField: 'mobile',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          patientName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$user.firstName', ''] },
                  ' ',
                  { $ifNull: ['$user.lastName', ''] }
                ]
              }
            }
          },
          patientEmail: { $ifNull: ['$user.email', null] }
        }
      },
      { $project: { user: 0 } } // remove embedded user doc
    ];

    const appointments = await Appointment.aggregate(pipeline);
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching admin appointments with patient names:', err);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// New test endpoint
app.get('/api/test-route', (req, res) => {
  res.json({ success: true, message: 'Test route working' });
});

app.get('/api/appointments/test', (req, res) => {
  res.json({ success: true, message: 'Appointments test route working' });
});


// GET /api/appointments?mobile=9876543210[&status=confirmed][&from=YYYY-MM-DD&to=YYYY-MM-DD][&period=7][&limit=50&skip=0]
app.get('/api/appointments', async (req, res) => {
  try {
    const { mobile, status, from, to, period, limit = 200, skip = 0 } = req.query;

    // require mobile (dashboard depends on it)
    if (!mobile) {
      return res.status(400).json({ message: "Missing 'mobile' query parameter" });
    }

    const filter = { userMobile: mobile };

    // status filter (optional)
    if (status) filter.status = status;

    // date filtering (createdAt)
    let startDate, endDate;
    if (period) {
      const now = new Date();
      startDate = new Date(now.getTime() - Number(period) * 24 * 60 * 60 * 1000);
      endDate = now;
    } else {
      if (from) startDate = new Date(from);
      if (to) {
        endDate = new Date(to);
        endDate.setHours(23,59,59,999);
      }
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const docs = await Appointment.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(1000, Number(limit)));

    res.json(docs);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/user?mobile=9876543210
app.get('/api/user', async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) return res.status(400).json({ message: "Missing 'mobile' query parameter" });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: "Server error" });
  }
});



// GET /api/admin/users
// Optional query: search (name, email, mobile)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      const regex = new RegExp(search, 'i'); // case-insensitive search
      filter = {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { mobile: regex }
        ]
      };
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});




// Utility function: get PhonePe Access Token
const getPhonePeAccessToken = async () => {
  const baseUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;

  const response = await axios.post(
    `${baseUrl}/v1/oauth/token`,
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      client_version: '1'
    }).toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  return response.data.access_token;
};


app.post('/api/payment/initiate', async (req, res) => {
  const { amount, email, mobile, purpose, notes, paymentMethod } = req.body;
  const merchantTransactionId = 'TXN_' + Date.now();
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const baseUrl = process.env.PHONEPE_BASE_URL;
  const redirectUrl = `${process.env.PHONEPE_REDIRECT_URL}?txnId=${merchantTransactionId}`;

  console.log(`✅ PhonePe Payment initiated for ${mobile}, TXN: ${merchantTransactionId}`);

  try {
    // ✅ Save pending appointment
    await PendingAppointment.create({
      txnId: merchantTransactionId,
      mobile,
      amount,
      purpose,
      notes,
      status: 'pending'
    });

    const accessToken = await getPhonePeAccessToken();



    // ✅ Prepare payload
    const payload = {
      merchantId,
      merchantOrderId: merchantTransactionId,
      amount: amount * 100,
      expireAfter: 1200,
      metaInfo: { udf1: mobile },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        redirectMode: 'AUTO',
        merchantUrls: { redirectUrl }
      },
    };

    // ✅ Call PhonePe Initiate API
    const response = await axios.post(
      `${baseUrl}/apis/pg-sandbox/checkout/v2/pay`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${accessToken}`
        }
      }
    );

    const redirectUrlFromResponse = response.data.redirectUrl || redirectUrl;

    res.json({
      redirectUrl: redirectUrlFromResponse,
      merchantTransactionId
    });

  } catch (err) {
    console.error("❌ PhonePe API Error:", err.response?.data || err.message);
    res.status(500).json({ message: 'PhonePe API error', details: err.response?.data || err.message });
  }
});


app.get('/api/payment/status', async (req, res) => {
  const { txnId } = req.query;

  if (!txnId) {
    return res.status(400).json({ code: 'MISSING_TXN_ID', message: 'Missing transaction ID' });
  }

  const baseUrl = process.env.PHONEPE_BASE_URL;

  try {
    // ✅ Step 1: Get Access Token
    const tokenRes = await axios.post(
      `${baseUrl}/apis/pg-sandbox/v1/oauth/token`,
      new URLSearchParams({
        client_id: process.env.PHONEPE_CLIENT_ID,
        client_secret: process.env.PHONEPE_CLIENT_SECRET,
        grant_type: 'client_credentials',
        client_version: '1'
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = tokenRes.data.access_token;

    // ✅ Step 2: Check order status
    const statusRes = await axios.get(
      `${baseUrl}/apis/pg-sandbox/checkout/v2/order/${txnId}/status?details=false`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${accessToken}`
        }
      }
    );

    const state = statusRes.data.state;

    if (state === 'COMPLETED') {
      // Mark pending as completed
      
      return res.json({ code: 'PAYMENT_SUCCESS' });
    } else if (state === 'FAILED') {
      
      return res.json({ code: 'PAYMENT_FAILED' });
    } else {
      return res.json({ code: 'PAYMENT_PENDING' });
    }

  } catch (err) {
    console.error("❌ PhonePe status check error:", err.response?.data || err.message);
    res.status(500).json({
      code: 'PAYMENT_ERROR',
      message: 'PhonePe status check failed',
      error: err.response?.data || err.message
    });
  }
});





app.post('/api/appointments/confirm', async (req, res) => {
  try {
    const { txnId } = req.body;

    
    

    // 1. Find the pending appointment using txnId
    const pending = await PendingAppointment.findOne({ txnId });
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'Pending appointment not found'
      });
    }

    // 2. Create a confirmed appointment
    const appointment = new Appointment({
      appointmentId: 'APT_' + Date.now(),
      userEmail: pending.email,
      userMobile: pending.mobile,
      doctor: pending.doctor || 'General',
      date: pending.date,
      notes: pending.notes || '',
      fee: pending.amount,
      paymentTxnId: txnId,
      
      status: 'confirmed'
    });

    await appointment.save();

    // 3. Remove from Pending
    await PendingAppointment.deleteOne({ _id: pending._id });

    res.json({
      success: true,
      appointmentId: appointment.appointmentId
    });
  } catch (err) {
    console.error('❌ Error confirming appointment:', err);
    res.status(500).json({
      success: false,
      message: 'Error confirming appointment'
    });
  }
});

// Get all appointments (Admin)






// Endpoint: Payment callback
app.post('/api/payment/callback', (req, res) => {
  console.log('📥 PhonePe Callback Received:', req.body);
  res.status(200).send('OK');
});






// Endpoint: Pending cash bookings summary



// Simple test route to check server



// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

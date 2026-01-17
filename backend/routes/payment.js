const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'college_media_secret_key';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Webhook (No Auth)
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

// Products
router.post('/products', verifyToken, PaymentController.createProduct);
router.get('/products', verifyToken, PaymentController.getProducts);

// Payments
router.post('/create-payment-intent', verifyToken, PaymentController.createPaymentIntent);

module.exports = router;

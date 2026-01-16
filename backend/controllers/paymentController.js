const Stripe = require('stripe');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

class PaymentController {
    /**
     * Create a Product Listing
     */
    static async createProduct(req, res) {
        try {
            const product = await Product.create({
                ...req.body,
                seller: req.userId
            });
            res.status(201).json({ success: true, product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * List Products
     */
    static async getProducts(req, res) {
        try {
            const products = await Product.find({ status: 'active' })
                .populate('seller', 'username profilePicture')
                .sort({ createdAt: -1 });
            res.json({ success: true, products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Create Payment Intent for a Product
     * Uses Idempotency Key to prevent double-charge
     */
    static async createPaymentIntent(req, res) {
        try {
            const { productId, idempotencyKey } = req.body;

            if (!idempotencyKey) {
                return res.status(400).json({ success: false, message: 'Idempotency key required' });
            }

            // Check if order already exists
            const existingOrder = await Order.findOne({ idempotencyKey });
            if (existingOrder) {
                return res.json({
                    success: true,
                    clientSecret: existingOrder.stripeClientSecret, // Need to store this if we want to return it
                    message: 'Order already exists'
                });
            }

            const product = await Product.findById(productId);
            if (!product || product.status !== 'active') {
                return res.status(404).json({ success: false, message: 'Product unavailable' });
            }

            // Platform Fee (e.g., 5%)
            const amount = Math.round(product.price * 100); // in cents
            const platformFee = Math.round(amount * 0.05);

            // Create PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'inr',
                metadata: {
                    productId: product._id.toString(),
                    buyerId: req.userId,
                    sellerId: product.seller.toString()
                },
                automatic_payment_methods: { enabled: true },
            }, {
                idempotencyKey
            });

            // Create Order
            await Order.create({
                buyer: req.userId,
                seller: product.seller,
                product: product._id,
                amount: product.price,
                platformFee: platformFee / 100,
                stripePaymentIntentId: paymentIntent.id,
                idempotencyKey,
                status: 'pending'
            });

            res.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                orderId: paymentIntent.id
            });

        } catch (error) {
            logger.error('Payment intent creation failed:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Stripe Webhook Handler
     * Verifies signature and updates order status
     */
    static async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            // Check if req.body is buffer or need raw-body parser (Express defaults might parse it)
            // Usually webhooks need raw body. Assuming app middleware handles this or we skip verification for demo.
            // For production, ensure raw body is used for construction.
            event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, endpointSecret);
        } catch (err) {
            // If checking signature fails, allow "mock" events in dev if secret not set
            if (!endpointSecret) {
                event = req.body;
            } else {
                logger.error('Webhook signature verification failed.', err.message);
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { productId } = paymentIntent.metadata;

            logger.info(`Payment succeeded for Product ${productId}`);

            // Update Order
            await Order.findOneAndUpdate(
                { stripePaymentIntentId: paymentIntent.id },
                { status: 'paid' }
            );

            // Mark Product as Sold
            await Product.findByIdAndUpdate(productId, { status: 'sold' });
        }

        res.json({ received: true });
    }
}

module.exports = PaymentController;

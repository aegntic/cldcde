
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import fs from 'fs';

// Load environment variables
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
    console.log('Loaded .env.local');
} else {
    dotenv.config();
    console.log('Loaded default .env');
}

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4242;

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in cart' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image] : [],
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe uses cents
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3456'}/success`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3456'}/cancel`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

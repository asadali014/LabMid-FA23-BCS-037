// ─────────────────────────────────────────────────────────────────
//  Daraz Clone — Express + MongoDB Backend
//  Student: FA23-BCS-037
// ─────────────────────────────────────────────────────────────────
const express   = require('express');
const mongoose  = require('mongoose');
const path      = require('path');

const app       = express();
const PORT      = process.env.PORT      || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/darazdb';

app.use(express.json()); // Middleware to parse JSON request bodies

// ── Mongoose Schema ──────────────────────────────────────────────
const productSchema = new mongoose.Schema({
    title       : { type: String, required: true },
    category    : { type: String, required: true },
    price       : { type: Number, required: true },
    oldPrice    : { type: Number },
    discount    : { type: String },
    emoji       : { type: String, default: '🛍️' },
    description : { type: String },
    rating: {
        rate  : { type: Number, default: 4.0 },
        count : { type: Number, default: 0 }
    }
});

const Product = mongoose.model('Product', productSchema);

// ── Seed Data ────────────────────────────────────────────────────
const seedProducts = [
    {
        title: 'Women Kurta', category: 'Clothing',
        price: 1299, oldPrice: 2500, discount: '-48%', emoji: '👗',
        description: 'Beautiful printed cotton kurta, perfect for casual and formal occasions.',
        rating: { rate: 4.5, count: 312 }
    },
    {
        title: 'HP Laptop 15', category: 'Electronics',
        price: 89000, oldPrice: 110000, discount: '-19%', emoji: '💻',
        description: 'HP 15-inch laptop with Intel Core i5, 8GB RAM, 512GB SSD.',
        rating: { rate: 4.3, count: 186 }
    },
    {
        title: 'Sony WH-1000XM5', category: 'Audio',
        price: 34500, oldPrice: 45000, discount: '-23%', emoji: '🎧',
        description: 'Industry-leading noise cancelling headphones with 30-hour battery life.',
        rating: { rate: 4.8, count: 521 }
    },
    {
        title: 'Smart Watch Pro', category: 'Wearables',
        price: 8499, oldPrice: 12000, discount: '-29%', emoji: '⌚',
        description: 'Feature-rich smartwatch with heart rate monitor, GPS, and 7-day battery.',
        rating: { rate: 4.2, count: 204 }
    },
    {
        title: 'PS5 Controller', category: 'Gaming',
        price: 15999, oldPrice: 19999, discount: '-20%', emoji: '🎮',
        description: 'DualSense wireless controller with haptic feedback and adaptive triggers.',
        rating: { rate: 4.7, count: 389 }
    },
    {
        title: 'Leather Handbag', category: 'Accessories',
        price: 3200, oldPrice: 5500, discount: '-42%', emoji: '👜',
        description: 'Premium genuine leather handbag with multiple organised compartments.',
        rating: { rate: 4.1, count: 97 }
    },
    {
        title: 'Dumbbell Set (20kg)', category: 'Sports',
        price: 4500, oldPrice: 7000, discount: '-36%', emoji: '🏋️',
        description: 'Adjustable rubber-coated dumbbell set, ideal for home gym workouts.',
        rating: { rate: 4.4, count: 158 }
    },
    {
        title: 'Non-Stick Pan Set', category: 'Kitchen',
        price: 2100, oldPrice: 3800, discount: '-45%', emoji: '🍳',
        description: '3-piece non-stick pan set with heat-resistant handles and glass lids.',
        rating: { rate: 4.0, count: 73 }
    },
    {
        title: 'Running Shoes', category: 'Sports',
        price: 5999, oldPrice: 9000, discount: '-33%', emoji: '👟',
        description: 'Lightweight breathable running shoes with memory foam insoles.',
        rating: { rate: 4.6, count: 267 }
    },
    {
        title: 'Air Fryer 5L', category: 'Kitchen',
        price: 12500, oldPrice: 18000, discount: '-31%', emoji: '🍟',
        description: '5-litre digital air fryer with 8 preset cooking modes and touchscreen.',
        rating: { rate: 4.5, count: 134 }
    }
];

// ── Connect to MongoDB & Seed ────────────────────────────────────
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB:', MONGO_URI);
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(seedProducts);
            console.log(`🌱 Database seeded with ${seedProducts.length} products.`);
        } else {
            console.log(`📦 ${count} products already in database.`);
        }
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ── Serve Static Frontend Files ──────────────────────────────────
app.use(express.static(__dirname));

// ── API: GET all products (optional ?limit=N) ────────────────────
app.get('/api/products', async (req, res) => {
    try {
        const limit    = parseInt(req.query.limit) || 0;   // 0 = no limit in Mongoose
        const products = await Product.find({}).limit(limit);
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products from database.' });
    }
});

// ── API: GET health / DB connection status ────────────────────────
// Useful for viva demo — shows live MongoDB connection state in browser
app.get('/api/health', (req, res) => {
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const state    = mongoose.connection.readyState;
    res.json({
        status   : state === 1 ? 'ok' : 'error',
        database : stateMap[state] || 'unknown',
        dbName   : 'darazdb',
        products : '/api/products',
        timestamp: new Date().toISOString()
    });
});

// ── API: POST add a new product ──────────────────────────────────
app.post('/api/products', async (req, res) => {
    try {
        const { title, category, price, description, emoji } = req.body;
        
        if (!title || !price) {
            return res.status(400).json({ error: 'Title and price are required.' });
        }

        const newProduct = new Product({
            title,
            category: category || 'General',
            price: Number(price),
            description: description || '',
            emoji: emoji || '🛍️',
            rating: { rate: 5.0, count: 0 }
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add product to database.' });
    }
});

// ── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Daraz Clone running → http://localhost:${PORT}`);
});

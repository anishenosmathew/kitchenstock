require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const householdRoutes = require('./routes/household.routes');
const setupRoutes = require('./routes/setup.routes'); // TEMPORARY — remove after DB setup

const app = express();

// In production, set FRONTEND_URL to your actual deployed frontend origin
// (e.g. https://kitchenstock.vercel.app) to restrict who can call this API.
app.use(cors({
  origin: process.env.FRONTEND_URL || true, // true = allow any origin (dev only)
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/', setupRoutes); // TEMPORARY — remove after DB setup

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Everything under /api/kitchens/:kitchenId/* requires auth + kitchen membership.
// Both route files are mounted here so :kitchenId is shared across them.
app.use('/api/kitchens/:kitchenId', inventoryRoutes);
app.use('/api/kitchens/:kitchenId', householdRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Centralized error handler — catches anything thrown/rejected in routes
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`KitchenStock API listening on port ${PORT}`);
});

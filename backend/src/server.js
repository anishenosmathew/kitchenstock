import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import householdRoutes from './routes/household.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`KitchenStock API listening on http://192.168.1.45:${PORT}`);
});


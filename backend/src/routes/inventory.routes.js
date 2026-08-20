import { Router } from 'express';
import { requireAuth, requireKitchenAccess } from '../middleware/auth.js';
import * as inventory from '../controllers/inventory.controller.js';

const router = Router({ mergeParams: true });

// All routes here are mounted at /api/kitchens/:kitchenId/...
router.use(requireAuth);
router.use(requireKitchenAccess);

router.get('/inventory', inventory.listItems);
router.post('/inventory', inventory.createItem);
router.get('/inventory/:itemId', inventory.getItem);
router.patch('/inventory/:itemId/quantity', inventory.adjustQuantity);
router.patch('/inventory/:itemId/threshold', inventory.updateThreshold);
router.patch('/inventory/:itemId', inventory.updateItem);
router.delete('/inventory/:itemId', inventory.deleteItem);

router.get('/shopping-list', inventory.getShoppingList);

export default router;

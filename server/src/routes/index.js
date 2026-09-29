import express from 'express';
import orderRoutes from './orderRoutes.js';
import productRoutes from './productRoutes.js';
import miscRoutes from './miscRoutes.js';

const router = express.Router();

router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/', miscRoutes);

export default router;

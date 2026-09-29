import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id', updateOrder);

export default router;

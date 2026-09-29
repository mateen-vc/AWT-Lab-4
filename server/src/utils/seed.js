import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { ChatMessage } from '../models/ChatMessage.js';

export const seedDatabase = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      console.log('[Seed] Database already contains records. Skipping seed.');
      return;
    }

    console.log('[Seed] Database is empty. Seeding initial demo data...');

    // 1. Seed Demo Users
    const users = await User.create([
      {
        id: 'cust_01',
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        id: 'cust_02',
        name: 'Sarah Connor',
        email: 'sarah.c@example.com',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        id: 'agent_01',
        name: 'Agent Marcus Ray',
        email: 'marcus.support@logistics.io',
        role: 'agent',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        id: 'agent_02',
        name: 'Agent Elena Rostova',
        email: 'elena.support@logistics.io',
        role: 'agent',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      },
    ]);

    // 2. Seed Products
    const products = await Product.create([
      {
        name: 'TitanPulse Pro ANC Headphones',
        description: 'Active noise-cancelling wireless headphones with 40-hour battery life and spatial audio.',
        price: 249.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
        category: 'Audio',
        stock: 45,
      },
      {
        name: 'Apex Mechanical Gaming Keyboard',
        description: 'Hot-swappable RGB mechanical keyboard with linear custom switches and aircraft-grade aluminum frame.',
        price: 139.5,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
        category: 'Accessories',
        stock: 30,
      },
      {
        name: 'QuantumFit Smart Tracker V4',
        description: 'Ultra-slim health smartwatch with AMOLED display, PPG heart-rate sensor, and GPS tracking.',
        price: 189.0,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
        category: 'Wearables',
        stock: 60,
      },
      {
        name: 'Horizon 4K Ultra-Wide Monitor',
        description: '34-inch curved 144Hz IPS display with 99% DCI-P3 color accuracy and 90W USB-C PD.',
        price: 499.99,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
        category: 'Displays',
        stock: 15,
      },
      {
        name: 'Vortex Precision Wireless Mouse',
        description: 'Ergonomic dual-mode wireless mouse with 26K DPI optical sensor and magnetic scroll wheel.',
        price: 79.95,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60',
        category: 'Accessories',
        stock: 75,
      },
    ]);

    // 3. Seed Demo Orders
    const order1 = await Order.create({
      customerId: 'cust_01',
      customerName: 'Alex Johnson',
      customerEmail: 'alex.johnson@example.com',
      items: [
        {
          productId: products[0]._id.toString(),
          name: products[0].name,
          price: products[0].price,
          quantity: 1,
          image: products[0].image,
        },
        {
          productId: products[4]._id.toString(),
          name: products[4].name,
          price: products[4].price,
          quantity: 1,
          image: products[4].image,
        },
      ],
      totalAmount: products[0].price + products[4].price,
      status: 'shipped',
      shippingAddress: {
        street: '100 University Ave, Apt 4B',
        city: 'Palo Alto',
        state: 'CA',
        zip: '94301',
      },
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 48 * 3600 * 1000),
          note: 'Order placed by customer via REST API',
          updatedBy: 'Alex Johnson',
        },
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 40 * 3600 * 1000),
          note: 'Payment verified and inventory allocated',
          updatedBy: 'Agent Marcus Ray',
        },
        {
          status: 'processing',
          timestamp: new Date(Date.now() - 24 * 3600 * 1000),
          note: 'Package boxed and dispatched to fulfillment center',
          updatedBy: 'Warehouse Team',
        },
        {
          status: 'shipped',
          timestamp: new Date(Date.now() - 10 * 3600 * 1000),
          note: 'Carrier pickup confirmed. Tracking ID: TRK-99281',
          updatedBy: 'Agent Marcus Ray',
        },
      ],
    });

    const order2 = await Order.create({
      customerId: 'cust_01',
      customerName: 'Alex Johnson',
      customerEmail: 'alex.johnson@example.com',
      items: [
        {
          productId: products[1]._id.toString(),
          name: products[1].name,
          price: products[1].price,
          quantity: 1,
          image: products[1].image,
        },
      ],
      totalAmount: products[1].price,
      status: 'pending',
      shippingAddress: {
        street: '100 University Ave, Apt 4B',
        city: 'Palo Alto',
        state: 'CA',
        zip: '94301',
      },
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Order placed by customer via REST API',
          updatedBy: 'Alex Johnson',
        },
      ],
    });

    const order3 = await Order.create({
      customerId: 'cust_02',
      customerName: 'Sarah Connor',
      customerEmail: 'sarah.c@example.com',
      items: [
        {
          productId: products[2]._id.toString(),
          name: products[2].name,
          price: products[2].price,
          quantity: 2,
          image: products[2].image,
        },
      ],
      totalAmount: products[2].price * 2,
      status: 'processing',
      shippingAddress: {
        street: '88 Cyberdyne Way',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
      },
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 15 * 3600 * 1000),
          note: 'Order placed by customer',
          updatedBy: 'Sarah Connor',
        },
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 12 * 3600 * 1000),
          note: 'Verified by system',
          updatedBy: 'System',
        },
        {
          status: 'processing',
          timestamp: new Date(Date.now() - 5 * 3600 * 1000),
          note: 'Unit undergoing quality inspection',
          updatedBy: 'Agent Elena Rostova',
        },
      ],
    });

    // 4. Seed Support Chat Conversation
    const defaultRoomId = 'support:cust_01:agent_01';
    await ChatMessage.create([
      {
        messageId: 'msg_seed_01',
        roomId: defaultRoomId,
        senderId: 'cust_01',
        senderName: 'Alex Johnson',
        senderRole: 'customer',
        message: 'Hello! I wanted to check the delivery ETA for my audio order.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        messageId: 'msg_seed_02',
        roomId: defaultRoomId,
        senderId: 'agent_01',
        senderName: 'Agent Marcus Ray',
        senderRole: 'agent',
        message: 'Hi Alex! I see your order #1 is already shipped with carrier tracking TRK-99281. It is scheduled to arrive tomorrow afternoon!',
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
      },
      {
        messageId: 'msg_seed_03',
        roomId: defaultRoomId,
        senderId: 'cust_01',
        senderName: 'Alex Johnson',
        senderRole: 'customer',
        message: 'Awesome, thanks Marcus! Can I also modify the delivery address if needed?',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
    ]);

    console.log('[Seed] Database seeded successfully with demo products, orders, users, and chat history!');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
};

// If run directly via `node src/utils/seed.js`
if (process.argv[1]?.endsWith('seed.js')) {
  import('../config/db.js').then(async ({ connectDB, closeDB }) => {
    import('dotenv').then(async (dotenv) => {
      dotenv.config();
      await connectDB();
      await seedDatabase();
      await closeDB();
      process.exit(0);
    });
  });
}

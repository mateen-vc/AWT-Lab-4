import React, { useState, useEffect } from 'react';
import { getProducts, createOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProtocolBadge } from '../components/ProtocolBadge';
import {
  ShoppingBag,
  Plus,
  Check,
  Search,
  ShoppingCart,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ProductCatalog = ({ onOrderCreated }) => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({}); // { [productId]: quantity }
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [restLog, setRestLog] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      if (res?.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product) => {
    const id = product._id || product.id;
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[productId] > 1) {
        next[productId] -= 1;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const totalCartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const cartItemsList = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find((p) => (p._id || p.id) === productId);
    return {
      product,
      quantity,
    };
  }).filter((item) => item.product);

  const cartTotalAmount = cartItemsList.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );

  const handleCheckout = async () => {
    if (cartItemsList.length === 0) return;

    try {
      setIsOrdering(true);
      const orderPayload = {
        customerId: currentUser?.id || 'cust_01',
        customerName: currentUser?.name || 'Alex Johnson',
        customerEmail: currentUser?.email || 'alex.johnson@example.com',
        items: cartItemsList.map((item) => ({
          productId: item.product._id || item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
        totalAmount: cartTotalAmount,
        shippingAddress: {
          street: '100 University Ave, Apt 4B',
          city: 'Palo Alto',
          state: 'CA',
          zip: '94301',
        },
      };

      // REST POST /api/v1/orders
      const res = await createOrder(orderPayload);

      setRestLog({
        endpoint: 'POST /api/v1/orders',
        status: 201,
        payload: orderPayload,
        response: res,
      });

      setCart({});
      setShowCartModal(false);

      if (onOrderCreated) {
        onOrderCreated(res.data);
      }
    } catch (err) {
      alert(`Order creation failed: ${err.message}`);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Product Catalog</h1>
            <ProtocolBadge type="REST" size="md" />
          </div>
          <p className="text-xs text-slate-400">
            Powered by REST APIs (<code className="text-emerald-400 font-mono">GET /api/v1/products</code> and <code className="text-emerald-400 font-mono">POST /api/v1/orders</code>)
          </p>
        </div>

        {/* View Cart Button */}
        <button
          onClick={() => setShowCartModal(true)}
          className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cart ({totalCartCount})</span>
          {totalCartCount > 0 && (
            <span className="font-mono font-bold">${cartTotalAmount.toFixed(2)}</span>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Package className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No products found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const id = product._id || product.id;
            const inCartCount = cart[id] || 0;

            return (
              <div
                key={id}
                className="group flex flex-col bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div className="relative h-48 overflow-hidden bg-slate-950">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-medium text-slate-300 border border-slate-800">
                    {product.category}
                  </span>
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Price</span>
                      <span className="text-lg font-bold text-emerald-400">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        inCartCount > 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {inCartCount > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added ({inCartCount})</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Drawer / Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Your Shopping Cart</h3>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="my-4 max-h-64 overflow-y-auto space-y-3">
              {cartItemsList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Your cart is empty.</p>
              ) : (
                cartItemsList.map(({ product, quantity }) => {
                  const id = product._id || product.id;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                        <div>
                          <h5 className="text-xs font-semibold text-white line-clamp-1">{product.name}</h5>
                          <span className="text-[11px] text-slate-400">
                            ${product.price.toFixed(2)} each
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(id)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cartItemsList.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Order Subtotal</span>
                  <span className="text-lg font-bold text-emerald-400">
                    ${cartTotalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 text-[11px] text-slate-400 border border-slate-800">
                  <span className="block font-semibold text-slate-300 mb-0.5">Shipping to:</span>
                  {currentUser?.name} • 100 University Ave, Palo Alto, CA
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isOrdering}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <ProtocolBadge type="REST" size="sm" />
                  <span>{isOrdering ? 'Submitting Order via REST...' : 'Place Order via REST POST'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

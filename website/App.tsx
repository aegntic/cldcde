import React, { useState, useEffect, useContext, createContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User as UserIcon, LogOut, Menu, X, Trash2, Plus, Minus, Search, LayoutDashboard, CreditCard, ShieldCheck, Terminal, Cpu, Zap, Download, Layers, Command, Gift, Check } from 'lucide-react';
import { Product, CartItem, User } from './types';
import { MOCK_PRODUCTS, calculateBundleDiscount, getPricingPhase, PLACEHOLDER_IMAGE } from './constants';
import AIChat from './components/AIChat';
import SDKPanel from './components/SDKPanel';
import StackBuilder from './components/StackBuilder';
import CommandPalette from './components/CommandPalette';
import EarlyBirdBanner from './components/EarlyBirdBanner';
import ThemeToggle from './components/ThemeToggle';
import ASCIILogo from './components/ASCIILogo';
import NewsletterPopup from './components/NewsletterPopup';
import Preloader from './components/Preloader';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// --- Contexts ---

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  user: User | null;
  login: (role: 'user' | 'admin') => void;
  logout: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (v: boolean) => void;
  isSDKOpen: boolean;
  setIsSDKOpen: (v: boolean) => void;
  isStackOpen: boolean;
  setIsStackOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- Utilities ---

const downloadData = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// --- Components ---

const Navbar: React.FC = () => {
  const { cart, user, logout, setIsCartOpen, setIsSDKOpen, setIsStackOpen } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 liquid-glass border-b-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:opacity-80 transition-opacity duration-300 flex items-center">
              <ASCIILogo size="xs" />
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8 font-mono text-sm tracking-wider">
              <Link to="/" className="hover:text-gray-100 transition text-gray-400 uppercase">Marketplace</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-gray-100 transition text-gray-400 uppercase">Dashboard</Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle className="hidden md:flex" showLabel />

            <button
              onClick={() => setIsSDKOpen(true)}
              className="hidden md:flex items-center gap-2 btn-polished btn-polished-sm"
            >
              <Terminal size={12} />
              <span className="btn-text">SDK</span>
            </button>

            <button
              onClick={() => setIsStackOpen(true)}
              className="hidden md:flex items-center gap-2 btn-polished btn-polished-sm btn-polished-primary"
            >
              <Layers size={12} />
              <span className="btn-text">STACK</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative btn-polished btn-polished-sm"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-black rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {cartCount}
                </span>
              )}
            </button>

            {!user && (
              <Link to="/login" className="btn-polished btn-polished-primary hidden md:flex items-center gap-2">
                <UserIcon size={14} />
                <span className="btn-text">SIGN IN</span>
              </Link>
            )}

            {user && (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs text-gray-500 font-mono">{user.name}</span>
                <button
                  onClick={logout}
                  className="btn-polished btn-polished-sm text-red-400 border-red-900/30"
                >
                  <span className="btn-text">EXIT</span>
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden btn-polished btn-polished-sm">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden liquid-glass animate-fade-in border-t border-neutral-800/50">
          <div className="px-4 py-6 space-y-4">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-300 font-mono text-sm uppercase hover:text-white transition">Marketplace</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-gray-300 font-mono text-sm uppercase hover:text-white transition">Dashboard</Link>
            )}
            <button onClick={() => { setIsSDKOpen(true); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-gray-400 font-mono text-sm uppercase hover:text-white transition">
              <Terminal size={14} /> SDK Terminal
            </button>
            <button onClick={() => { setIsStackOpen(true); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-gray-400 font-mono text-sm uppercase hover:text-white transition">
              <Layers size={14} /> Stack Builder
            </button>
            {!user && (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 btn-polished w-full text-center">
                <span className="btn-text">SIGN IN</span>
              </Link>
            )}
            {user && (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-red-400 font-mono text-sm">LOGOUT</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, clearCart, addToCart } = useAppContext();
  const navigate = useNavigate();
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Get recommended items (items not in cart, max 3)
  const cartIds = cart.map(item => item.id);
  const recommendations = MOCK_PRODUCTS
    .filter(p => !cartIds.includes(p.id))
    .slice(0, 3);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md liquid-glass flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-cyber-border">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-term font-bold text-cyber-blue tracking-wider">CART_SYSTEM</h2>
              {cart.length > 0 && (
                <button
                  onClick={() => downloadData(cart, 'cldcde_cart_export.json')}
                  className="text-gray-500 hover:text-cyber-blue transition"
                  title="Export Raw Data"
                >
                  <Download size={18} />
                </button>
              )}
            </div>
            <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 font-mono py-10">
                [EMPTY_BUFFER]
                <br />
                Select tools to initiate.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4 p-4 bg-neutral-900/50 border border-cyber-border rounded-lg">
                  <img src={item.image} alt={item.name} loading="lazy" className="w-20 h-20 object-cover rounded bg-neutral-800" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                  <div className="flex-1">
                    <h3 className="text-lg font-term font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-cyber-blue font-mono text-sm">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 border border-neutral-600 rounded hover:border-cyber-blue text-gray-400 hover:text-cyber-blue transition">
                        <Minus size={12} />
                      </button>
                      <span className="font-mono text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 border border-neutral-600 rounded hover:border-cyber-blue text-gray-400 hover:text-cyber-blue transition">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-red-500 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Recommended Products */}
            {recommendations.length > 0 && (
              <div className="pt-4 border-t border-neutral-800">
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
                  Recommended for you
                </h3>
                <div className="space-y-2">
                  {recommendations.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 bg-neutral-900/30 border border-neutral-800 rounded-lg hover:border-neutral-700 transition"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded bg-neutral-800"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">${product.price}</p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="btn-polished btn-polished-sm flex items-center gap-1"
                      >
                        <Plus size={12} />
                        <span className="btn-text text-[10px]">ADD</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {cart.length > 0 && (() => {
            const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
            const discount = calculateBundleDiscount(itemCount);
            const discountedTotal = total * (1 - discount);
            const savings = total - discountedTotal;

            return (
              <div className="p-6 border-t border-cyber-border bg-neutral-900/30">
                {/* Bundle Discount Badge */}
                {discount > 0 && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
                    <Gift className="text-green-400" size={18} />
                    <span className="text-green-400 font-mono font-bold text-sm">
                      BUNDLE DISCOUNT: {Math.round(discount * 100)}% OFF
                    </span>
                  </div>
                )}

                {/* Upsell for more discount */}
                {discount === 0.25 && (
                  <p className="text-xs text-cyber-blue mb-3 font-mono">
                    Add 1 more item for 50% off!
                  </p>
                )}
                {discount === 0 && itemCount === 1 && (
                  <p className="text-xs text-gray-500 mb-3 font-mono">
                    Add 2+ items for 25-50% bundle discount
                  </p>
                )}

                <div className="space-y-2 mb-4 font-mono text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="flex justify-between text-green-400">
                        <span>Discount ({Math.round(discount * 100)}%)</span>
                        <span>-${savings.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-cyber-border text-lg">
                    <span className="text-gray-400">TOTAL</span>
                    <span className="text-cyber-blue font-bold">${discountedTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full py-4 btn-polished btn-polished-lg btn-polished-primary"
                >
                  <span className="btn-text text-sm">PROCEED TO CHECKOUT</span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// --- Pages ---

const Home: React.FC = () => {
  const { addToCart } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))];

  const asciiClaude = `
 ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗     ██████╗ ██████╗ 
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗
██║     ██║     ███████║██║   ██║██║  ██║█████╗      ██║     ██║   ██║
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝      ██║     ██║   ██║
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗    ╚██████╗╚██████╔╝
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ 
               WELCOME TO CLDCDE.CC
`;

  const asciiMarket = `
 ███╗   ███╗ █████╗ ██████╗ ██╗  ██╗███████╗████████╗██████╗ ██╗      █████╗  ██████╗███████╗
 ████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝╚══██╔══╝██╔══██╗██║     ██╔══██╗██╔════╝██╔════╝
 ██╔████╔██║███████║██████╔╝█████╔╝ █████╗     ██║   ██████╔╝██║     ███████║██║     █████╗  
 ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██╔══╝     ██║   ██╔═══╝ ██║     ██╔══██║██║     ██╔══╝  
 ██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗███████╗   ██║   ██║     ███████╗██║  ██║╚██████╗███████╗
 ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝
`;

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="pt-16 pb-12 md:pt-24 md:pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,94,0,0.08)_0,rgba(0,0,0,0)_70%)] pointer-events-none" />

        <div className="relative z-10 mb-6 hidden sm:block">
          <div className="ascii-hero-wrapper">
            <pre className="text-[0.5rem] leading-[0.5rem] sm:text-[0.7rem] sm:leading-[0.7rem] md:text-[0.9rem] md:leading-[0.9rem] lg:text-[1.1rem] lg:leading-[1.1rem] xl:text-[1.3rem] xl:leading-[1.3rem] ascii-hero-title font-bold whitespace-pre overflow-x-hidden select-none mx-auto w-fit">
              {asciiClaude}
            </pre>
          </div>
        </div>

        {/* Mobile Title */}
        <div className="sm:hidden relative z-10 mb-4">
          <h1 className="text-4xl font-bold ansi-shadow-text tracking-tighter">
            CLAUDE CODE
          </h1>
        </div>

        {/* Value Proposition - CLEAR FOR FIRST VISITORS */}
        <div className="relative z-10 max-w-2xl mx-auto mb-8">
          <p className="text-xl md:text-2xl text-gray-300 font-sans mb-3">
            <span className="text-white font-semibold">Tools, prompts, and workflows</span> for AI-powered development
          </p>
          <p className="text-gray-500 text-sm md:text-base">
            Debug faster. Plan smarter. Automate the boring stuff.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 relative z-10">
          <button
            onClick={() => setCategory('All')}
            className="btn-polished btn-polished-lg btn-polished-primary flex items-center gap-2"
          >
            <span className="btn-text">BROWSE FREE TOOLS</span>
          </button>
          <button
            onClick={() => setCategory('All')}
            className="btn-polished btn-polished-lg flex items-center gap-2"
          >
            <span className="btn-text">TRY SDK DEMO →</span>
          </button>
        </div>
      </div>

      {/* Early Bird Launch Banner */}
      <EarlyBirdBanner />

      {/* Filters - Centered */}
      <div className="flex flex-col gap-6 mb-8 items-center">
        <div className="flex items-center bg-neutral-900 border border-neutral-700 p-3 rounded w-full max-w-md focus-within:border-cyber-blue focus-within:shadow-blue transition-all">
          <Search className="text-gray-500 ml-2" size={20} />
          <input
            type="text"
            placeholder="Search models, scripts, and tools..."
            className="bg-transparent border-none focus:ring-0 text-white w-full ml-2 focus:outline-none placeholder-gray-600 font-mono text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2 pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-sm text-xs font-mono font-bold whitespace-nowrap border transition-all ${category === cat
                ? 'bg-cyber-blue text-black border-cyber-blue shadow-blue'
                : 'bg-transparent border-neutral-700 text-gray-400 hover:border-cyber-blue/50 hover:text-cyber-blue'
                }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid - Centered */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {filteredProducts.map(product => {
          const pricing = getPricingPhase();
          const displayPrice = pricing.currentPrice === -1 ? product.price : pricing.currentPrice;
          const isLaunchPricing = pricing.phase !== 'full_price';

          return (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="group obsidian rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-64 overflow-hidden bg-black">
                <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-70 group-hover:opacity-100" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                {/* Launch Badge */}
                {isLaunchPricing && (
                  <div className="absolute top-3 right-3 bg-violet-500 text-white px-2 py-1 text-[10px] font-bold font-mono rounded shadow-lg">
                    ${displayPrice} LAUNCH
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-between items-end">
                    <span className="bg-cyber-blue/10 text-cyber-blue px-2 py-1 text-[10px] font-bold tracking-wider font-mono rounded border border-cyber-blue/30 uppercase">{product.category}</span>
                    <div className="flex text-cyber-blue text-xs gap-0.5">
                      {"★".repeat(Math.floor(product.rating))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold ansi-shadow-text-sm mb-2 leading-none">{product.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10 font-sans">{product.description}</p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono text-green-400 font-bold">${displayPrice}</span>
                    {isLaunchPricing && (
                      <span className="text-sm font-mono text-gray-500 line-through">${product.price}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart({ ...product, price: displayPrice }); }}
                    className="btn-polished btn-polished-sm btn-polished-primary flex items-center gap-2"
                  >
                    <Plus size={12} />
                    <span className="btn-text">GET ${displayPrice}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 font-mono">No matching artifacts found.</p>
        </div>
      )}


      <div className="mt-20 border-t border-cyber-border pt-12">
        <h2 className="text-2xl ansi-shadow-text mb-8">FEATURED FREE & PAID</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-neutral-900/30 border border-cyber-border p-4 rounded hover:border-cyber-blue/30 transition group">
              <div className="w-full h-32 bg-cyber-blue/5 rounded mb-3 flex items-center justify-center border border-cyber-blue/10 group-hover:bg-cyber-blue/10 transition">
                <Zap className="text-cyber-blue opacity-50 group-hover:opacity-100 group-hover:scale-110 transition" size={32} />
              </div>
              <div className="text-xs text-cyber-blue font-mono mb-1">Free: Basic Script</div>
              <div className="text-white font-bold text-sm font-term tracking-wide">Automated Refactor</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative liquid-glass rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
              <X size={24} />
            </button>
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-64 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }} />
            <div className="p-6">
              <span className="text-cyber-blue text-xs font-mono mb-2 block">{selectedProduct.category.toUpperCase()}</span>
              <h2 className="text-3xl ansi-shadow-text mb-4">{selectedProduct.name}</h2>
              <p className="text-gray-400 mb-6">{selectedProduct.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono text-green-400 font-bold">${selectedProduct.price}</span>
                <button
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className="bg-cyber-blue text-black px-6 py-3 font-bold font-mono rounded hover:bg-white transition flex items-center gap-2"
                >
                  <Plus size={16} /> ADD TO CART
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAppContext();

  if (!user || user.role !== 'admin') {
    return <div className="pt-32 text-center text-red-500 font-mono">ACCESS DENIED. PROTOCOL 403.</div>;
  }

  return (
    <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="text-gray-400" size={32} />
        <h1 className="text-4xl ansi-shadow-text">ADMIN_CONSOLE</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-neutral-900 p-6 border border-cyber-border rounded">
          <p className="text-gray-500 font-mono text-sm">TOTAL REVENUE</p>
          <p className="text-3xl text-cyber-blue font-bold mt-2 font-term">$12,450.00</p>
        </div>
        <div className="bg-neutral-900 p-6 border border-cyber-border rounded">
          <p className="text-gray-500 font-mono text-sm">ACTIVE USERS</p>
          <p className="text-3xl text-white font-bold mt-2 font-term">1,203</p>
        </div>
        <div className="bg-neutral-900 p-6 border border-cyber-border rounded">
          <p className="text-gray-500 font-mono text-sm">SYSTEM HEALTH</p>
          <p className="text-3xl text-green-400 font-bold mt-2 font-term">98.9%</p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-cyber-border rounded overflow-hidden">
        <div className="p-4 border-b border-cyber-border bg-neutral-800/50 flex justify-between items-center">
          <h2 className="font-bold text-white font-term text-xl tracking-wide">PRODUCT_DATABASE</h2>
          <button
            onClick={() => downloadData(MOCK_PRODUCTS, 'cldcde_product_db.json')}
            className="flex items-center gap-2 text-xs font-mono text-cyber-blue border border-cyber-blue/30 px-3 py-1 rounded hover:bg-cyber-blue/10 transition"
          >
            <Download size={14} /> EXPORT_DATA
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-neutral-800 text-gray-200 uppercase font-mono text-xs">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {MOCK_PRODUCTS.map(p => (
                <tr key={p.id} className="hover:bg-neutral-800/50 transition">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">#{p.id.padStart(4, '0')}</td>
                  <td className="px-6 py-4 font-medium text-white font-term text-lg">{p.name}</td>
                  <td className="px-6 py-4 text-cyber-blue">{p.category}</td>
                  <td className="px-6 py-4 text-cyber-neon font-mono">${p.price}</td>
                  <td className="px-6 py-4">
                    <span className="bg-green-900/30 text-green-400 border border-green-900 px-2 py-0.5 rounded text-xs">ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const Checkout: React.FC = () => {
  const { cart } = useAppContext();
  const [processing, setProcessing] = useState(false);
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate discount
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const discount = calculateBundleDiscount(itemCount);
  const discountedTotal = total * (1 - discount);
  const savings = total - discountedTotal;

  const handleCheckout = async () => {
    setProcessing(true);
    try {

      const response = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cart }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      // Redirect to Stripe Checkout using session URL (modern approach)
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Checkout failed: ' + error.message);
      setProcessing(false);
    }
  };

  if (cart.length === 0) return (
    <div className="min-h-screen pt-32 text-center">
      <h2 className="text-3xl font-term text-white mb-4">CART EMPTY</h2>
      <Link to="/" className="text-cyber-blue hover:underline font-mono">Return to Marketplace</Link>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-4xl ansi-shadow-text mb-8">SECURE_CHECKOUT</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Order Summary */}
        <div className="bg-neutral-900/50 p-6 rounded border border-neutral-800 h-fit shadow-blue-strong">
          <h3 className="text-xl font-term text-cyber-blue border-b border-gray-800 pb-4 mb-4">Order Summary</h3>
          <div className="space-y-4 mb-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div>
                  <p className="text-white font-bold font-term text-lg">{item.name}</p>
                  <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="text-cyber-blue font-mono">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-4 space-y-2 font-mono">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-400 text-sm">
                <span className="flex items-center gap-2">
                  <Gift size={14} />
                  Bundle Discount ({Math.round(discount * 100)}%)
                </span>
                <span>-${savings.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-800 mt-2">
              <span className="text-gray-400 text-xl">Total</span>
              <span
                className="ansi-shadow-text text-2xl"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(0, 243, 255, 0.2))'
                }}
              >
                ${discountedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processing}
            className="w-full mt-8 py-4 btn-polished btn-polished-lg btn-polished-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="btn-text text-sm">{processing ? 'REDIRECTING...' : `PAY $${discountedTotal.toFixed(2)}`}</span>
          </button>

          <div className="flex items-center justify-center gap-2 text-green-500 text-xs font-mono mt-4">
            <ShieldCheck size={14} /> PROCESSED BY STRIPE
          </div>
        </div>
      </div>
    </div>
  );
};

const SuccessPage: React.FC = () => {
  const { clearCart } = useAppContext();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="min-h-screen pt-32 text-center px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-6">
        <Check size={40} />
      </div>
      <h1 className="text-4xl font-term font-bold text-white mb-4">PAYMENT SUCCESSFUL</h1>
      <p className="text-gray-400 mb-8 font-mono">Your assets have been transferred to your vault.</p>
      <Link to="/" className="px-8 py-3 bg-cyber-blue text-black font-bold font-mono rounded hover:bg-white transition">
        RETURN TO MARKETPLACE
      </Link>
    </div>
  );
};

const CancelPage: React.FC = () => (
  <div className="min-h-screen pt-32 text-center px-4">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 text-red-500 mb-6">
      <X size={40} />
    </div>
    <h1 className="text-4xl font-term font-bold text-white mb-4">PAYMENT CANCELLED</h1>
    <p className="text-gray-400 mb-8 font-mono">The transaction was cancelled. No charges were made.</p>
    <Link to="/checkout" className="px-8 py-3 bg-cyber-neon text-black font-bold font-mono rounded hover:bg-white transition">
      RETURN TO CHECKOUT
    </Link>
  </div>
);

const Login: React.FC = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (role: 'user' | 'admin') => {
    login(role);
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-cyber-panel border border-cyber-border p-8 rounded-lg shadow-blue-strong relative z-10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-term font-bold text-white mb-2 tracking-wide">IDENTIFICATION</h1>
          <p className="text-cyber-blue text-sm font-mono">Select protocol level to proceed</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('user')}
            className="w-full py-4 bg-transparent border border-neutral-600 hover:border-cyber-blue text-white font-mono rounded transition flex items-center justify-center gap-3 group"
          >
            <UserIcon className="group-hover:text-cyber-blue transition" />
            STANDARD_USER
          </button>

          <button
            onClick={() => handleLogin('admin')}
            className="w-full py-4 bg-transparent border border-cyber-neon/30 hover:bg-cyber-neon/10 text-cyber-neon font-mono rounded transition flex items-center justify-center gap-3"
          >
            <LayoutDashboard />
            ADMINISTRATOR
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-gray-600 font-mono">
          SECURE CONNECTION :: ENCRYPTED
        </div>
      </div>
    </div>
  );
};

// Terms and Privacy Pages
const TermsPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto">
    <h1 className="text-4xl ansi-shadow-text mb-8">TERMS OF SERVICE</h1>
    <div className="prose prose-invert prose-sm max-w-none font-sans space-y-6 text-gray-300">
      <p><strong>Last Updated:</strong> December 2025</p>
      <h2 className="text-xl text-cyber-blue font-term">1. Acceptance of Terms</h2>
      <p>By accessing and using CLDCDE.CC, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
      <h2 className="text-xl text-cyber-blue font-term">2. Digital Products</h2>
      <p>All products sold on this marketplace are digital assets including plugins, MCPs, skills, prompts, and workflows. Upon purchase, you receive a non-exclusive, non-transferable license to use the products.</p>
      <h2 className="text-xl text-cyber-blue font-term">3. Refund Policy</h2>
      <p>Due to the digital nature of our products, all sales are final. If you experience technical issues, contact support@cldcde.cc.</p>
      <h2 className="text-xl text-cyber-blue font-term">4. Intellectual Property</h2>
      <p>All products remain the intellectual property of their respective creators. Redistribution or resale is prohibited.</p>
      <Link to="/" className="inline-flex items-center gap-2 text-cyber-blue hover:text-white transition mt-8">← Back to Marketplace</Link>
    </div>
  </div>
);

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto">
    <h1 className="text-4xl ansi-shadow-text mb-8">PRIVACY POLICY</h1>
    <div className="prose prose-invert prose-sm max-w-none font-sans space-y-6 text-gray-300">
      <p><strong>Last Updated:</strong> December 2025</p>
      <h2 className="text-xl text-cyber-blue font-term">1. Information We Collect</h2>
      <p>We collect email addresses for account creation and order fulfillment. API keys are stored locally in your browser and never transmitted to our servers.</p>
      <h2 className="text-xl text-cyber-blue font-term">2. How We Use Your Data</h2>
      <p>Your email is used for order confirmations and product delivery. We do not sell or share your information with third parties.</p>
      <h2 className="text-xl text-cyber-blue font-term">3. Cookies</h2>
      <p>We use essential cookies for cart functionality and session management. No tracking cookies are used.</p>
      <h2 className="text-xl text-cyber-blue font-term">4. Security</h2>
      <p>All transactions are encrypted. API keys stored in localStorage are never transmitted to our servers.</p>
      <Link to="/" className="inline-flex items-center gap-2 text-cyber-blue hover:text-white transition mt-8">← Back to Marketplace</Link>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSDKOpen, setIsSDKOpen] = useState(false);
  const [isStackOpen, setIsStackOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const login = (role: 'user' | 'admin') => {
    setUser({
      id: role === 'admin' ? 'A-001' : 'U-1337',
      name: role === 'admin' ? 'Admin_X' : 'Neo_User',
      email: 'user@cldcde.cc',
      role
    });
  };

  const logout = () => setUser(null);

  // Show preloader on initial load
  if (isLoading) {
    return <Preloader onLoaded={() => setIsLoading(false)} minDuration={7680} />;
  }

  return (
    <ThemeProvider>
      <AppContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, user, login, logout, isCartOpen, setIsCartOpen, isSDKOpen, setIsSDKOpen, isStackOpen, setIsStackOpen }}>
        <Router>
          <AppContent
            isSDKOpen={isSDKOpen}
            setIsSDKOpen={setIsSDKOpen}
            isStackOpen={isStackOpen}
            setIsStackOpen={setIsStackOpen}
            isCommandPaletteOpen={isCommandPaletteOpen}
            setIsCommandPaletteOpen={setIsCommandPaletteOpen}
            addToCart={addToCart}
          />
        </Router>
      </AppContext.Provider>
    </ThemeProvider>
  );
};

// Separate component to access theme context
interface AppContentProps {
  isSDKOpen: boolean;
  setIsSDKOpen: (v: boolean) => void;
  isStackOpen: boolean;
  setIsStackOpen: (v: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (v: boolean) => void;
  addToCart: (product: Product) => void;
}

const AppContent: React.FC<AppContentProps> = ({
  isSDKOpen,
  setIsSDKOpen,
  isStackOpen,
  setIsStackOpen,
  isCommandPaletteOpen,
  setIsCommandPaletteOpen,
  addToCart,
}) => {
  const { isGold } = useTheme();
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  // Auto-show newsletter popup after 5 seconds for new visitors
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('cldcde_newsletter_seen');
    const isSubscribed = localStorage.getItem('cldcde_newsletter_subscribed');

    if (!hasSeenPopup && !isSubscribed) {
      const timer = setTimeout(() => {
        setIsNewsletterOpen(true);
        localStorage.setItem('cldcde_newsletter_seen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={`min-h-screen selection:bg-luxury-primary/30 selection:text-luxury-text font-sans relative transition-colors duration-300 bg-luxury-bg text-luxury-text`}>
      {/* Grid pattern as fixed background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none luxury-grid-pattern" />

      <Navbar />
      <CartDrawer />
      <SDKPanel isOpen={isSDKOpen} onClose={() => setIsSDKOpen(false)} />
      <StackBuilder isOpen={isStackOpen} onClose={() => setIsStackOpen(false)} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenSDK={() => setIsSDKOpen(true)}
        onOpenStack={() => setIsStackOpen(true)}
        addToCart={addToCart}
      />
      <AIChat />
      <NewsletterPopup isOpen={isNewsletterOpen} onClose={() => setIsNewsletterOpen(false)} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>

      {/* Footer */}
      <footer className="border-t border-luxury-border bg-luxury-surface py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-term text-3xl font-bold text-luxury-text mb-4 tracking-widest">
            CLD<span className="luxury-gradient-text">CDE</span>
          </p>
          <p className="text-luxury-text-secondary text-sm font-mono mb-6">
            &copy; 2024 CLDCDE.CC<br />
            PREMIUM ASSETS FOR THE DIGITAL FRONTIER
          </p>
          <div className="flex justify-center gap-6 text-luxury-text-muted text-sm">
            <Link to="/terms" className="hover:text-luxury-primary transition">TERMS</Link>
            <Link to="/privacy" className="hover:text-luxury-primary transition">PRIVACY</Link>
            <a href="mailto:support@cldcde.cc" className="hover:text-luxury-primary transition">SUPPORT</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
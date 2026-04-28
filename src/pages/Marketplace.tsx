import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, ExternalLink, Filter, Sparkles, MapPin } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getProductSuggestions } from '../services/aiService';

const Marketplace: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userCountry, setUserCountry] = useState('السعودية'); // Default

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // If empty, add some mock products for demo
      let finalProducts = data;
      if (data.length === 0) {
        finalProducts = [
          { id: '1', name: 'Professional Chef Knife', price: 120, category: 'Knives', imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800' } as any,
          { id: '2', name: 'Cast Iron Skillet', price: 85, category: 'Cookware', imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=800' } as any,
          { id: '3', name: 'Digital Kitchen Scale', price: 25, category: 'Tools', imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800' } as any,
          { id: '4', name: 'Arabic Coffee Pot (Dallah)', price: 45, category: 'Traditional', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800' } as any,
        ];
        setProducts(finalProducts);
      } else {
        setProducts(data);
      }
      setLoading(false);
      
      // Auto-generate AI suggestions based on country
      handleGetAISuggestions(finalProducts);
    };
    fetchProducts();
  }, []);

  const handleGetAISuggestions = async (currentProducts: any[]) => {
    setIsGenerating(true);
    try {
      const data = await getProductSuggestions(userCountry, currentProducts);
      setAiSuggestions(data.recommendations);
    } catch (error) {
      console.error("AI Suggestions error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="flex justify-between items-end px-1">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-4xl md:text-6xl font-serif">{t('market')}</h1>
          <p className="text-xs md:text-base opacity-50 font-medium uppercase tracking-widest">Premium Kitchenware</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden md:flex items-center gap-2 bg-white border border-[#3D2B1F]/5 px-4 py-2 rounded-xl shadow-sm">
            <MapPin size={16} className="text-[#C5A028]" />
            <input 
              type="text" 
              value={userCountry}
              onChange={(e) => setUserCountry(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none w-24"
              placeholder="البلد..."
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-[#3D2B1F]/5 px-4 py-2 rounded-xl hover:bg-[#3D2B1F] hover:text-white transition-all shadow-sm">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Filter</span>
          </button>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#3D2B1F] text-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C5A028] rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif">اقتراحات ذكية لك في {userCountry}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isGenerating ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 animate-pulse h-32" />
              ))
            ) : aiSuggestions.length > 0 ? (
              aiSuggestions.map((sug, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <h4 className="text-[#C5A028] font-bold text-lg mb-2 group-hover:scale-105 transition-transform origin-right">{sug.productName}</h4>
                  <p className="text-xs opacity-60 leading-relaxed">{sug.reason}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm opacity-40">جاري تحضير اقتراحات مخصصة لبلدك...</p>
            )}
          </div>
          
          <button 
            onClick={() => handleGetAISuggestions(products)}
            className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-40 hover:opacity-100 transition-all"
          >
            تحديث الاقتراحات الذكية
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
        {products.map((product, idx) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group"
          >
            <div className="relative aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden bg-white mb-3 md:mb-4 border border-[#3D2B1F]/5 shadow-sm">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
              <button className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-[#3D2B1F] text-white p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-xl md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all active:scale-90">
                <ShoppingCart size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
            <div className="space-y-0.5 md:space-y-1 px-1">
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">{product.category}</span>
          <h3 className="text-sm md:text-lg font-serif line-clamp-1">{product.name}</h3>
              <p className="text-[#C5A028] font-bold text-sm md:text-base">${product.price}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;

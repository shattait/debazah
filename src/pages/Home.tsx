import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, History, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recipeService, userService } from '../services/dbService';
import { seedDatabase } from '../services/seedService';
import { UserContext } from '../App';
import RecipeCard from '../components/RecipeCard';

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(UserContext);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<any[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeOrigin, setActiveOrigin] = useState('all');
  const isRtl = i18n.language === 'ar';

  const categories = ['all', 'video', 'meals', 'salads', 'desserts', 'grills'];
  const origins = ['all', 'khaliji', 'shami', 'egyptian', 'european', 'asian', 'global'];

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = recipeService.subscribeToRecipes(
      (data) => {
        setRecipes(data);
        setLoading(false);
        if (data.length < 10) {
          seedDatabase();
        }
      },
      (err) => {
        console.error("Home recipes error:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const viewed = await userService.getViewedRecipes(user.uid);
        setRecentRecipes(viewed);
        const favs = await userService.getFavoriteRecipes(user.uid);
        setFavoriteRecipes(favs);
      };
      fetchUserData();
    } else {
      setRecentRecipes([]);
      setFavoriteRecipes([]);
    }
  }, [user?.viewedRecipes?.length, user?.favorites?.length, user?.uid]);

  const filteredRecipes = recipes.filter(r => {
    const isApproved = r.status === 'approved' || !r.status || user?.role === 'admin';
    if (!isApproved) return false;

    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || 
                           (activeCategory === 'video' ? !!r.videoUrl : (
                             r.category?.toLowerCase() === activeCategory || 
                             r.category === t(`category_${activeCategory}`)
                           ));
    
    const matchesOrigin = activeOrigin === 'all' || 
                         r.origin?.toLowerCase() === activeOrigin.toLowerCase() ||
                         r.origin === t(`origin_${activeOrigin}`);

    return matchesSearch && matchesCategory && matchesOrigin;
  });

  return (
    <div className="space-y-12 md:space-y-20 pb-20">
      {/* Hero */}
      <section className="relative h-[50vh] md:h-[70vh] rounded-[3rem] overflow-hidden bg-[#3D2B1F] text-white flex items-center shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1920" 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 px-6 md:px-20 max-w-3xl space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-5xl md:text-8xl font-serif leading-none tracking-tight">
              {t('app_name')}
            </h1>
            <p className="text-sm md:text-2xl uppercase tracking-[0.4em] font-bold text-[#C5A028]">
              {t('premium_tagline')}
            </p>
          </motion.div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-6' : 'left-6'} opacity-40 group-focus-within:text-[#C5A028] transition-colors`} size={24} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className={`w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl py-4 md:py-6 ${isRtl ? 'pr-16 pl-8' : 'pl-16 pr-8'} focus:outline-none focus:ring-2 focus:ring-[#C5A028] transition-all text-lg`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Sections - Recently Viewed */}
      {recentRecipes.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-1">
            <History className="text-[#C5A028]" />
            <h2 className="text-2xl md:text-3xl font-serif">{isRtl ? 'عدت مجدداً؟ آخر ما شاهدت' : 'Back again? Recently viewed'}</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {recentRecipes.map((recipe, idx) => (
              <div key={`recent-${recipe.id}`} className="min-w-[280px] md:min-w-[320px]">
                <RecipeCard recipe={recipe} index={idx} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      {favoriteRecipes.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-1">
            <Heart className="text-red-500" fill="currentColor" />
            <h2 className="text-2xl md:text-3xl font-serif">{isRtl ? 'مفضلاتك المختارة' : 'Your Favorites'}</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {favoriteRecipes.map((recipe, idx) => (
              <div key={`fav-${recipe.id}`} className="min-w-[280px] md:min-w-[320px]">
                <RecipeCard recipe={recipe} index={idx} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-[#F5F5F0]/80 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0 space-y-4">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {origins.map((origin) => (
            <button 
              key={origin} 
              onClick={() => setActiveOrigin(origin)}
              className={`whitespace-nowrap px-8 py-3 rounded-2xl border transition-all text-sm font-bold shadow-sm ${activeOrigin === origin ? 'bg-[#3D2B1F] text-white border-[#3D2B1F]' : 'bg-white border-[#3D2B1F]/5 text-[#3D2B1F]/60 hover:border-[#3D2B1F]/20'}`}
            >
              {origin === 'all' ? (isRtl ? 'جميع المطابخ' : 'All Origins') : t(`origin_${origin}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-8 py-3 rounded-2xl border transition-all text-sm font-bold shadow-sm ${activeCategory === cat ? 'bg-[#C5A028] text-white border-[#C5A028]' : 'bg-[#C5A028]/5 border-[#C5A028]/10 text-[#C5A028] hover:bg-[#C5A028]/20'}`}
            >
              {cat === 'all' ? (isRtl ? 'جميع الأصناف' : 'All Categories') : t(`category_${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <section className="space-y-8">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-3xl md:text-4xl font-serif">{t('popular_recipes')}</h2>
          <span className="text-xs font-bold opacity-30 uppercase tracking-widest">{filteredRecipes.length} {isRtl ? 'وصفة' : 'recipes'}</span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[4/5] bg-white rounded-[2rem] border border-[#3D2B1F]/5 animate-pulse" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-[#3D2B1F]/5 space-y-6">
            <p className="text-gray-400 font-serif text-2xl">{t('no_recipes_found')}</p>
            <button onClick={() => setSearchQuery('')} className="text-[#C5A028] font-bold underline">مسح الفلاتر</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRecipes.map((recipe, idx) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={idx} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Play, 
  Clock, 
  Users, 
  ChefHat, 
  Store, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  Wand2, 
  Edit3, 
  Crown, 
  ShoppingBag, 
  ExternalLink, 
  AlertTriangle, 
  ChevronDown, 
  LogIn,
  Heart,
  History as LucideHistory
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getIngredientAlternatives, getShoppingSuggestions } from '../services/aiService';
import { recipeService, userService } from '../services/dbService';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContext } from '../App';
import { toast } from 'sonner';

const RecipeDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useContext(UserContext);
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chef, setChef] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any>(null);
  const [shoppingSuggestions, setShoppingSuggestions] = useState<any>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [selectedShoppingIngredient, setSelectedShoppingIngredient] = useState<string | null>(null);
  const [showFullShoppingList, setShowFullShoppingList] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const isRtl = i18n.language === 'ar';

  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isFavorite = user?.favorites?.includes(id);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول لحفظ الوصفات");
      return;
    }
    try {
      await userService.toggleFavorite(user.uid, id!);
      toast.success(isFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
    } catch (error) {
      toast.error("فشل تحديث المفضلة");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط!");
    }
  };

  const isPremiumUser = user?.subscription === 'premium' || isAdmin;
  const hasReachedLimit = user && !isPremiumUser && (user.viewedRecipes || []).length >= 3 && !(user.viewedRecipes || []).includes(id);
  const isLocked = (recipe?.isPremium && !isPremiumUser) || hasReachedLimit;
  const isNotLoggedIn = !user;

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecipe(data);
        if (data.chefId) {
          const chefProfile = await userService.getUserProfile(data.chefId);
          setChef(chefProfile);
        }

        // Track view if user is logged in
        if (user && !isLocked && !isAdmin) {
          await userService.trackRecipeView(user.uid, id);
        }

        // Fetch reviews
        const reviewData = await recipeService.getReviews(id);
        setReviews(reviewData || []);
      }
      setLoading(false);
    };
    fetchRecipe();
  }, [id, user, isLocked, isAdmin]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("يرجى تسجيل الدخول للتقييم");
      return;
    }
    if (!newReview.comment.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewObj = {
        userId: user.uid,
        userName: user.displayName || 'User',
        userPhoto: user.photoURL,
        rating: newReview.rating,
        comment: newReview.comment
      };
      await recipeService.addReview(id!, reviewObj);
      setReviews([reviewObj, ...reviews]);
      setNewReview({ rating: 5, comment: '' });
      toast.success("تمت إضافة تقييمك بنجاح!");
    } catch (error) {
      toast.error("فشل إضافة التقييم");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGetAlternatives = async (ingredient: string) => {
    if (isLocked || isNotLoggedIn) {
      toast.error(t('subscription_required'));
      return;
    }
    setSelectedIngredient(ingredient);
    setAlternatives(null);
    const data = await getIngredientAlternatives(ingredient, 'Saudi Arabia');
    setAlternatives(data.alternatives);
  };

  const handleGetShoppingSuggestions = async (ingredient: string) => {
    if (isLocked || isNotLoggedIn) {
      toast.error(t('subscription_required'));
      return;
    }
    setSelectedShoppingIngredient(ingredient);
    setShoppingSuggestions(null);
    const data = await getShoppingSuggestions([ingredient], 'Saudi Arabia');
    setShoppingSuggestions(data.suggestions[0]);
  };

  const handleGetFullShoppingList = async () => {
    if (isLocked || isNotLoggedIn) {
      toast.error(t('subscription_required'));
      return;
    }
    setShowFullShoppingList(true);
    setShoppingSuggestions(null);
    const ingredientNames = recipe.ingredients.map((i: any) => i.name);
    const data = await getShoppingSuggestions(ingredientNames, 'Saudi Arabia');
    setShoppingSuggestions(data.suggestions);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!recipe) return <div className="h-screen flex items-center justify-center">Recipe not found.</div>;

  const showContent = !(isNotLoggedIn || isLocked);

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-20">
      {/* Floating Buttons */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-auto md:top-24 md:start-12 z-40 flex md:flex-col items-center gap-4 bg-white/80 backdrop-blur-2xl p-2 md:p-3 rounded-full shadow-2xl border border-[#3D2B1F]/10">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 rounded-full hover:bg-[#3D2B1F]/5 transition-all"
          title="رجوع"
        >
          {isRtl ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        <div className="w-px h-6 md:w-8 md:h-px bg-[#3D2B1F]/10" />
        <button 
          onClick={handleToggleFavorite}
          className={`p-3 rounded-full transition-all ${isFavorite ? 'text-red-500 bg-red-50' : 'text-[#3D2B1F]/60'}`}
          title="حفظ في المفضلة"
        >
          <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button 
          onClick={handleShare}
          className="p-3 rounded-full text-[#3D2B1F]/60 hover:bg-[#3D2B1F]/5 transition-all"
          title="مشاركة"
        >
          <ExternalLink size={24} />
        </button>
        {isAdmin && (
          <Link 
            to="/admin" 
            state={{ editRecipe: { id, ...recipe } }}
            className="p-3 rounded-full text-[#C5A028] hover:bg-[#C5A028]/10 transition-all"
            title="تعديل"
          >
            <Edit3 size={24} />
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="space-y-6 md:space-y-8 text-center px-4 pt-12 md:pt-4">
        {isAdmin && recipe.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl flex items-center justify-center gap-3 text-yellow-800 mb-8">
            <AlertTriangle size={20} />
            <span className="text-sm font-bold">هذه الوصفة قيد المراجعة ولم تنشر للجمهور بعد</span>
            <button 
              onClick={async () => {
                await recipeService.updateRecipe(id!, { status: 'approved' });
                setRecipe({ ...recipe, status: 'approved' });
                toast.success("تم اعتماد الوصفة!");
              }}
              className="bg-yellow-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-yellow-700 transition-all"
            >
              اعتماد الآن
            </button>
          </div>
        )}
        <div className="flex flex-col items-center gap-2">
          {recipe.isPremium && (
            <span className="bg-[#C5A028] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Crown size={10} />
              {t('premium')}
            </span>
          )}
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-40 font-bold"
          >
            {recipe.category || 'Recipe'}
          </motion.span>
        </div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-serif leading-tight"
          >
            {recipe.title}
          </motion.h1>

          <div className="flex flex-wrap justify-center gap-2">
            {recipe.origin && (
              <span className="bg-gray-100 text-[#3D2B1F]/60 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-200">
                {t(`origin_${recipe.origin.toLowerCase()}`)}
              </span>
            )}
            <span className="bg-gray-100 text-[#3D2B1F]/60 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-200">
              {recipe.category || 'Recipe'}
            </span>
          </div>

          <div className="flex justify-center gap-6 md:gap-8 opacity-50 text-[10px] md:text-sm font-bold uppercase tracking-widest">
            {recipe.prepTime && (
              <div className="flex items-center gap-1.5" title="وقت التحضير">
                <Clock size={14} className="text-[#C5A028]" />
                <span>تحضير: {recipe.prepTime}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5" title="وقت الطهي">
              <Clock size={14} />
              <span>طهي: {recipe.cookTime || '30 MIN'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{recipe.servings || "4"} {isRtl ? 'أشخاص' : 'SERV'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wand2 size={14} className="text-[#C5A028]" />
              <span>{recipe.difficulty || (isRtl ? 'متوسط' : 'Medium')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChefHat size={14} />
              <span>{recipe.chefName || 'Chef'}</span>
            </div>
          </div>
      </div>

      {/* Video/Image Hero - App Style */}
      <div className="relative aspect-square md:aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-[#3D2B1F] shadow-2xl group">
        {!showContent ? (
          <div className="relative w-full h-full">
            <img 
              src={recipe.imageUrls?.[0] || `https://picsum.photos/seed/${id}/1200/800`} 
              alt={recipe.title} 
              className="w-full h-full object-cover blur-md opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white p-6 text-center">
              {isNotLoggedIn ? (
                <>
                  <LogIn size={48} className="text-[#C5A028] mb-4" />
                  <h2 className="text-2xl font-serif mb-2">سجل دخولك لمشاهدة الوصفة</h2>
                  <p className="text-sm opacity-80 mb-6">سجل الدخول مجاناً لمشاهدة حتى ٣ وصفات، أو اشترك للوصول غير المحدود</p>
                  <Link to="/login" className="bg-[#C5A028] text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-all">
                    تسجيل الدخول / إنشاء حساب
                  </Link>
                </>
              ) : hasReachedLimit ? (
                <>
                  <AlertTriangle size={48} className="text-[#C5A028] mb-4" />
                  <h2 className="text-2xl font-serif mb-2">لقد وصلت لحدث المشاهدة المجاني</h2>
                  <p className="text-sm opacity-80 mb-6">لقد شاهدت ٣ وصفات مجانية. اشترك في الباقة السنوية (١٠ دولار فقط) لمشاهدة جميع الوصفات.</p>
                  <Link to="/subscriptions" className="bg-[#C5A028] text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-all">
                    اشترك الآن بـ ١٠$ سنوياً
                  </Link>
                </>
              ) : (
                <>
                  <Crown size={48} className="text-[#C5A028] mb-4" />
                  <h2 className="text-2xl font-serif mb-2">هذه الوصفة حصرية للمشتركين</h2>
                  <p className="text-sm opacity-80 mb-6">اشترك الآن للوصول إلى كامل المكونات وخطوات التحضير بالفيديو</p>
                  <Link to="/subscriptions" className="bg-[#C5A028] text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-all">
                    اشترك الآن
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : recipe.videoUrl && !videoError ? (
          <div className="relative w-full h-full">
            {recipe.videoUrl.includes('youtube.com') || recipe.videoUrl.includes('youtu.be') ? (
              <iframe 
                src={`https://www.youtube.com/embed/${recipe.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#&?]*)/)?.[1] || recipe.videoUrl.split('/').pop()}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <video 
                  id="recipe-video"
                  src={recipe.videoUrl} 
                  poster={recipe.imageUrls?.[0]}
                  controls={isPlaying}
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setVideoError(true)}
                  onWaiting={() => setVideoLoading(true)}
                  onPlaying={() => setVideoLoading(false)}
                  onLoadStart={() => setVideoLoading(true)}
                  onCanPlay={() => setVideoLoading(false)}
                />
                <AnimatePresence>
                  {!isPlaying && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all cursor-pointer z-10"
                      onClick={() => {
                        const video = document.getElementById('recipe-video') as HTMLVideoElement;
                        if (video) video.play();
                      }}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-16 h-16 md:w-24 md:h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30 shadow-2xl"
                      >
                        {videoLoading ? (
                          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Play size={32} fill="currentColor" className={isRtl ? "mr-1" : "ml-1"} />
                        )}
                      </motion.div>
                      
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                        <p className="text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                          {t('video')}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img 
              src={recipe.imageUrls?.[0] || `https://picsum.photos/seed/${id}/1200/800`} 
              alt={recipe.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {!showContent && (
        <div className="px-4 py-8 bg-white rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-4">
          <h2 className="text-xl font-bold">نبذة عن الوصفة</h2>
          <p className="text-[#3D2B1F]/70 font-serif text-lg leading-relaxed">
            {recipe.description}
          </p>
          <div className="pt-4 border-t border-gray-50 flex gap-8 opacity-50 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><Clock size={14} className="text-[#C5A028]" /><span>تحضير: {recipe.prepTime || '-'}</span></div>
            <div className="flex items-center gap-1.5"><Clock size={14} /><span>طهي: {recipe.cookTime || '30 MIN'}</span></div>
            <div className="flex items-center gap-1.5"><ChevronDown size={14} /><span>{recipe.category}</span></div>
          </div>
        </div>
      )}

      {showContent && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 px-4">
          {/* Ingredients */}
          <div className="md:col-span-4 space-y-6 md:space-y-8">
            {/* Chef Info Card */}
            {chef && (
              <div className="bg-white p-6 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <img src={chef.photoURL || `https://ui-avatars.com/api/?name=${chef.displayName}`} className="w-12 h-12 rounded-full object-cover" alt={chef.displayName} />
                  <div>
                    <h4 className="font-bold text-sm">{chef.displayName}</h4>
                    <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">شيف معتمد</p>
                  </div>
                </div>
                <div className="flex justify-between text-center pt-2 border-t border-gray-50">
                  <div>
                    <p className="text-xs font-bold text-[#C5A028]">{chef.rating || 4.8}</p>
                    <p className="text-[8px] opacity-40 font-bold uppercase">التقييم</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold">{chef.followersCount || '2.4K'}</p>
                    <p className="text-[8px] opacity-40 font-bold uppercase">متابع</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold">{chef.recipesCount || 12}</p>
                    <p className="text-[8px] opacity-40 font-bold uppercase">وصفة</p>
                  </div>
                </div>
                <button className="w-full bg-[#3D2B1F]/5 text-[#3D2B1F] py-2 rounded-xl text-xs font-bold hover:bg-[#3D2B1F] hover:text-white transition-all">
                  متابعة الشيف
                </button>
              </div>
            )}

            {/* Affiliate Marketplace Section */}
            <div className="space-y-4 pt-4">
              <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-40">تسوّق المكونات</h4>
              <div className="grid gap-3">
                <a href="https://amazon.sa" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-[#F8F8F5] p-4 rounded-2xl hover:scale-[1.02] transition-all border border-transparent hover:border-[#F3A847]">
                  <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="w-12 h-4 opacity-60" alt="Amazon" />
                    <span className="text-xs font-medium">احصل على المكونات من أمازون</span>
                  </div>
                  <ExternalLink size={14} className="opacity-40" />
                </a>
                <a href="https://noon.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-[#F8F8F5] p-4 rounded-2xl hover:scale-[1.02] transition-all border border-transparent hover:border-[#FEE000]">
                  <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/de/Noon_Logo.svg" className="w-12 h-4 opacity-60" alt="Noon" />
                    <span className="text-xs font-medium">تسوق من نون</span>
                  </div>
                  <ExternalLink size={14} className="opacity-40" />
                </a>
              </div>
            </div>

            {/* AI Engine Sidebar */}
            <div className="bg-[#C5A028]/5 p-6 rounded-[2rem] border border-[#C5A028]/20 space-y-4">
              <div className="flex items-center gap-2 text-[#C5A028]">
                <Wand2 size={18} />
                <h4 className="text-xs font-bold uppercase tracking-widest">محرك دبيازة الذكي</h4>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className="w-full text-right p-3 bg-white rounded-xl text-[10px] font-bold hover:bg-white/80 transition-all flex items-center justify-between"
                >
                  <span>اقتراح البدائل الذكية</span>
                  <ChevronDown size={14} className={`transition-transform ${showAlternatives ? 'rotate-180' : ''}`} />
                </button>
                
                {showAlternatives && (
                  <div className="bg-white/40 p-3 rounded-xl space-y-2">
                    <p className="text-[10px] opacity-60">اضغط على أي مكون في القائمة لتبديله...</p>
                  </div>
                )}

                <button 
                  onClick={() => setShowShoppingList(!showShoppingList)}
                  className="w-full text-right p-3 bg-white rounded-xl text-[10px] font-bold hover:bg-white/80 transition-all flex items-center justify-between"
                >
                  <span>إنشاء قائمة تسوق ذكية</span>
                  <ShoppingBag size={14} />
                </button>
              </div>
            </div>

            <h3 className="text-xl md:text-2xl font-serif border-b border-[#3D2B1F]/5 pb-4">{t('ingredients')}</h3>
            <ul className="space-y-5">
              {recipe.ingredients.map((ing: any, idx: number) => (
                <li key={idx} className="group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-lg">{ing.name}</span>
                    <span className="text-sm opacity-40 font-bold">{ing.amount}</span>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleGetAlternatives(ing.name)}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#C5A028] font-bold hover:opacity-70 transition-all"
                    >
                      <Wand2 size={10} />
                      {t('smart_suggest')}
                    </button>
                    <button 
                      onClick={() => handleGetShoppingSuggestions(ing.name)}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-blue-500 font-bold hover:opacity-70 transition-all"
                    >
                      <ShoppingBag size={10} />
                      {t('where_to_buy')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button 
              onClick={handleGetFullShoppingList}
              className="w-full bg-[#3D2B1F] text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-[#C5A028] transition-all shadow-xl"
            >
              <ShoppingBag size={20} />
              {t('generate_shopping_list')}
            </button>

            {/* AI Alternatives Panel */}
            <AnimatePresence>
              {selectedIngredient && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#3D2B1F] text-white p-6 rounded-[2rem] space-y-5 shadow-2xl mt-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{t('alternatives')}</h4>
                    <button onClick={() => setSelectedIngredient(null)} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full">×</button>
                  </div>
                  {alternatives ? (
                    <div className="space-y-5">
                      {alternatives.map((alt: any, i: number) => (
                        <div key={i} className="space-y-2 border-b border-white/5 pb-4 last:border-0">
                          <p className="font-serif text-xl text-[#C5A028]">{alt.name}</p>
                          <p className="text-xs opacity-50 leading-relaxed">{alt.reason}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {alt.stores.map((s: string, j: number) => (
                              <span key={j} className="text-[9px] font-bold uppercase tracking-tighter bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Store size={10} />
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 gap-3">
                      <div className="w-8 h-8 border-2 border-[#C5A028] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] uppercase tracking-widest opacity-40">جاري التحضير...</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shopping Suggestions Panel */}
            <AnimatePresence>
              {(selectedShoppingIngredient || showFullShoppingList) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-[#3D2B1F]/5 p-6 rounded-[2rem] space-y-5 shadow-2xl mt-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                      {showFullShoppingList ? t('full_shopping_list') : t('where_to_buy')}
                    </h4>
                    <button 
                      onClick={() => {
                        setSelectedShoppingIngredient(null);
                        setShowFullShoppingList(false);
                      }} 
                      className="w-6 h-6 flex items-center justify-center bg-[#3D2B1F]/5 rounded-full"
                    >
                      ×
                    </button>
                  </div>
                  
                  {shoppingSuggestions ? (
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pe-2 no-scrollbar">
                      {(showFullShoppingList ? (Array.isArray(shoppingSuggestions) ? shoppingSuggestions : [shoppingSuggestions]) : [shoppingSuggestions]).map((item: any, i: number) => (
                        <div key={i} className="space-y-3 border-b border-[#3D2B1F]/5 pb-4 last:border-0">
                          <p className="font-serif text-lg text-[#3D2B1F]">{item.ingredient}</p>
                          <div className="grid gap-3">
                            {item.stores.map((store: any, j: number) => (
                              <div key={j} className="flex justify-between items-center bg-[#F8F8F5] p-3 rounded-xl">
                                <div className="space-y-1">
                                  <p className="text-sm font-bold">{store.name}</p>
                                  <p className="text-[10px] opacity-40 uppercase tracking-widest">{store.priceRange}</p>
                                </div>
                                <a 
                                  href={`https://www.google.com/search?q=${encodeURIComponent(store.name + ' ' + item.ingredient)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-white rounded-lg text-[#C5A028] hover:bg-[#C5A028] hover:text-white transition-all"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] uppercase tracking-widest opacity-40">جاري البحث عن المتاجر...</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Steps */}
          <div className="md:col-span-8 space-y-6 md:space-y-8">
            <h3 className="text-xl md:text-2xl font-serif border-b border-[#3D2B1F]/5 pb-4">{t('steps')}</h3>
            <div className="space-y-10">
              {recipe.steps.map((step: string, idx: number) => (
                <div key={idx} className="flex gap-6 md:gap-10">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl md:text-5xl font-serif opacity-10 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                    <div className="w-px h-full bg-[#3D2B1F]/5" />
                  </div>
                  <p className="text-lg md:text-xl leading-relaxed pt-1 md:pt-3">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {showContent && (
        <section className="px-4 space-y-8 md:space-y-12">
          <div className="border-t border-[#3D2B1F]/5 pt-8 md:pt-12">
            <h3 className="text-2xl md:text-3xl font-serif mb-8">{isRtl ? 'آراء وتجارب' : 'Reviews & Experiences'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Review Form */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-4">
                  <p className="text-xs font-bold opacity-40 uppercase tracking-widest">شاركنا رأيك</p>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={`transition-colors ${star <= newReview.rating ? 'text-[#C5A028]' : 'text-gray-200'}`}
                        >
                          <Heart size={20} fill={star <= newReview.rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder={isRtl ? 'اكتب تجربتك مع هذه الوصفة...' : 'Share your experience...'}
                      className="w-full bg-[#f8f8f5] border-0 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#C5A028] min-h-[100px] resize-none"
                    />
                    <button 
                      type="submit"
                      disabled={submittingReview || !newReview.comment.trim()}
                      className="w-full bg-[#3D2B1F] text-white py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {submittingReview ? 'جاري الإرسال...' : (isRtl ? 'نشر التقييم' : 'Post Review')}
                    </button>
                  </form>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar">
                {reviews.length > 0 ? reviews.map((review, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img 
                          src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`} 
                          alt={review.userName} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold">{review.userName}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Heart 
                                key={star} 
                                size={8} 
                                className={star <= review.rating ? 'text-[#C5A028]' : 'text-gray-200'} 
                                fill={star <= review.rating ? "currentColor" : "none"} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] opacity-30 font-bold uppercase tracking-tighter">
                        {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed opacity-70 italic">"{review.comment}"</p>
                  </motion.div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4 py-12">
                    <LucideHistory size={48} />
                    <p className="text-sm font-bold uppercase tracking-widest">{isRtl ? 'لا توجد تقييمات بعد. كن أول من يشارك!' : 'No reviews yet. Be the first!'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default RecipeDetail;

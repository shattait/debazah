import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Wand2, Edit3, XCircle, RefreshCw, CreditCard, CheckCircle2, AlertCircle, Play, ExternalLink } from 'lucide-react';
import { recipeService, userService, affiliateService } from '../services/dbService';
import { auth } from '../firebase';
import { UserContext } from '../App';
import { generateRecipeInsights, generateRecipeFromPrompt } from '../services/aiService';
import { seedDatabase } from '../services/seedService';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = React.useContext(UserContext);
  const location = useLocation();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('وجبات');
  const [ingredients, setIngredients] = useState([{ name: '', amount: '' }]);
  const [steps, setSteps] = useState(['']);
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [origin, setOrigin] = useState('Global');
  const [chefs, setChefs] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAffiliates();
    }
  }, [user]);

  const fetchAffiliates = async () => {
    const data = await userService.listUsers();
    setAffiliates(data?.filter((u: any) => u.affiliateData?.isAffiliate) || []);
  };

  const handleToggleAffiliateStatus = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await affiliateService.updateAffiliateStatus(uid, newStatus);
    toast.success(`تم تحديث حالة المسوق إلى ${newStatus}`);
    fetchAffiliates();
  };
  const [activeTab, setActiveTab] = useState<'recipes' | 'chefs' | 'profile' | 'referrals' | 'ai' | 'affiliates'>('recipes');
  const [bio, setBio] = useState(user?.bio || '');
  const [paypalEmail, setPaypalEmail] = useState(user?.paypalEmail || '');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [paymentStatus, setPaymentStatus] = useState<{ stripeConfigured: boolean; paypalConfigured: boolean } | null>(null);

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setPaypalEmail(user.paypalEmail || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      if (auth.currentUser?.uid) {
        await userService.updateUserProfile(auth.currentUser.uid, { bio, paypalEmail });
        toast.success("تم تحديث الملف الشخصي بنجاح!");
      }
    } catch (error) {
      toast.error("فشل تحديث الملف الشخصي.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = recipeService.subscribeToRecipes((data) => {
      setRecipes(data);
    });
    fetchChefs();
    fetchPaymentStatus();
    if (user?.role === 'admin') {
      fetchReferrals();
    }
    return () => unsubscribe();
  }, []);

  const handleMarkPaid = async (refId: string) => {
    if (window.confirm('هل أنت متأكد من تحويل حالة هذه المستحقات إلى "تم الدفع"؟')) {
      await affiliateService.markReferralAsPaid(refId);
      fetchReferrals();
    }
  };

  const fetchReferrals = async () => {
    const data = await affiliateService.listAllReferrals();
    setReferrals(data || []);
  };

  const fetchChefs = async () => {
    if (user?.role === 'admin') {
      const data = await userService.listChefs();
      setChefs(data || []);
    }
  };

  const fetchPaymentStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setPaymentStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment status", error);
    }
  };

  const handleGenerateAIRecipe = async () => {
    if (auth.currentUser?.uid) {
      const profile = await userService.getUserProfile(auth.currentUser.uid);
      if (profile?.role !== 'admin') {
        toast.error("عذراً، هذه الميزة حصرية للمسؤولين فقط");
        return;
      }
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate a creative and delicious professional recipe in Arabic. 
      Return the response in JSON format with the following structure:
      {
        "title": "Recipe Title",
        "description": "Short description mentioning it's a professional recipe",
        "category": "One of: وجبات, سلطات, حلا, مشويات",
        "origin": "One of: Khaliji, Shami, Egyptian, European, Asian, Global",
        "ingredients": [{"name": "ingredient", "amount": "quantity"}],
        "steps": ["step 1", "step 2"],
        "isPremium": true,
        "videoUrl": "A placeholder youtube link like https://www.youtube.com/watch?v=recipe-id or a relevant one if you know it",
        "imageSearchTerm": "English keywords for finding a matching food image"
      }`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const generatedData = JSON.parse(response.text);
      
      setTitle(generatedData.title);
      setDescription(generatedData.description);
      setCategory(generatedData.category || 'وجبات');
      setOrigin(generatedData.origin || 'Global');
      setPrepTime(generatedData.prepTime || '');
      setCookTime(generatedData.cookTime || '');
      setIngredients(generatedData.ingredients || [{ name: '', amount: '' }]);
      setSteps(generatedData.steps || ['']);
      setIsPremium(generatedData.isPremium || false);
      setVideoUrl(generatedData.videoUrl || 'https://www.youtube.com/watch?v=q66fXlJ8v6M'); // Default to a cooking lesson if AI fails to provide
      
      if (generatedData.imageSearchTerm) {
        const seed = encodeURIComponent(generatedData.imageSearchTerm);
        setImageUrl(`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800`); // High quality default or generated
      }
      
      toast.success("تم توليد الوصفة بالذكاء الاصطناعي بنجاح!");
    } catch (error) {
      console.error("Error generating AI recipe:", error);
      toast.error("فشل ابتكار الوصفة.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleGenerateFromVideo = async () => {
    if (!aiPrompt) {
      toast.error("يرجى إدخال رابط الفيديو أو وصف مختصر");
      return;
    }
    setIsGenerating(true);
    try {
      const data = await generateRecipeFromPrompt(aiPrompt);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setCategory(data.category || 'وجبات');
      setOrigin(data.origin || 'Global');
      setPrepTime(data.prepTime || '');
      setCookTime(data.cookTime || '');
      setIngredients(data.ingredients || [{ name: '', amount: '' }]);
      setSteps(data.steps || ['']);
      
      const ytId = getYouTubeId(aiPrompt);
      if (ytId) {
        setVideoUrl(aiPrompt);
        setImageUrl(`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`);
      } else if (aiPrompt.includes('http')) {
        setVideoUrl(aiPrompt);
      }
      
      toast.success("تم استخراج بيانات الوصفة باللغة العربية بنجاح!");
    } catch (error) {
      toast.error("فشل استخراج البيانات من الفيديو");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const state = location.state as any;
    if (state?.editRecipe) {
      const recipe = state.editRecipe;
      setEditingId(recipe.id);
      setTitle(recipe.title);
      setDescription(recipe.description || '');
      setCategory(recipe.category || 'وجبات');
      setIngredients(recipe.ingredients || [{ name: '', amount: '' }]);
      setSteps(recipe.steps || ['']);
      setPrepTime(recipe.prepTime || '');
      setCookTime(recipe.cookTime || '');
      setImageUrl(recipe.imageUrls?.[0] || '');
      setVideoUrl(recipe.videoUrl || '');
      setIsPremium(recipe.isPremium || false);
    }
  }, [location]);

  const handleAddIngredient = () => setIngredients([...ingredients, { name: '', amount: '' }]);
  const handleAddStep = () => setSteps([...steps, '']);

  const handleApprove = async (id: string) => {
    try {
      await recipeService.updateRecipe(id, { status: 'approved' });
      toast.success("تمت الموافقة على الوصفة بنجاح!");
    } catch (error) {
      toast.error("فشل الموافقة على الوصفة.");
    }
  };

  const handleEdit = (recipe: any) => {
    setEditingId(recipe.id);
    setTitle(recipe.title);
    setDescription(recipe.description || '');
    setCategory(recipe.category || 'وجبات');
    setIngredients(recipe.ingredients || [{ name: '', amount: '' }]);
    setSteps(recipe.steps || ['']);
    setImageUrl(recipe.imageUrls?.[0] || '');
    setVideoUrl(recipe.videoUrl || '');
    setIsPremium(recipe.isPremium || false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('وجبات');
    setIngredients([{ name: '', amount: '' }]);
    setSteps(['']);
    setPrepTime('');
    setCookTime('');
    setImageUrl('');
    setVideoUrl('');
    setIsPremium(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    try {
      await recipeService.deleteRecipe(id);
      toast.success("Recipe deleted");
    } catch (error) {
      toast.error("Failed to delete recipe");
    }
  };

  const handleSave = async () => {
    if (!title || ingredients.some(i => !i.name) || steps.some(s => !s)) {
      toast.error("Please fill all required fields");
      return;
    }

    if (isPremium && user?.role === 'chef') {
      const freeRecipesCount = recipes.filter(r => r.chefId === user.uid && !r.isPremium && r.status === 'approved').length;
      if (freeRecipesCount < 3) {
        toast.error("عذراً، يجب عليك نشر 3 وصفات مجانية (Free) ومعتمدة على الأقل قبل إضافة وصفات مميزة (Premium).");
        return;
      }
    }

    setLoading(true);
    try {
      const recipeData = {
        title,
        description,
        category,
        origin,
        prepTime,
        cookTime,
        ingredients,
        steps,
        videoUrl,
        isPremium,
        chefId: auth.currentUser?.uid,
        chefName: auth.currentUser?.displayName,
        imageUrls: imageUrl ? [imageUrl] : ["https://picsum.photos/seed/recipe/800/1000"],
        status: user?.role === 'admin' ? 'approved' : 'pending'
      };

      if (editingId) {
        await recipeService.updateRecipe(editingId, recipeData);
        toast.success("تم تحديث الوصفة بنجاح!");
      } else {
        await recipeService.addRecipe(recipeData);
        toast.success(user?.role === 'admin' ? "تمت إضافة الوصفة بنجاح!" : "تم إرسال الوصفة للمراجعة من قبل المسؤول.");
      }
      handleCancelEdit();
    } catch (error) {
      toast.error(editingId ? "Failed to update recipe" : "Failed to add recipe");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIImage = () => {
    if (!title) {
      toast.error("يرجى إدخال عنوان الوصفة أولاً لتوليد صورة مناسبة");
      return;
    }
    const seed = encodeURIComponent(title.trim());
    const aiImageUrl = `https://picsum.photos/seed/${seed}/800/1000`;
    setImageUrl(aiImageUrl);
    toast.success("تم توليد صورة مقترحة بناءً على العنوان!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for selection
        toast.error("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 10 ميجابايت.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Compress if looks too big
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Quality 0.7 usually keeps it under 500kb even for 1000x1000
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImageUrl(dataUrl);
          toast.success("تم رفع الصورة وضغطها بنجاح!");
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIInsights = async () => {
    if (!title || ingredients.length === 0) return;
    toast.promise(generateRecipeInsights(title, ingredients.map(i => i.name)), {
      loading: 'جاري تحليل وصفتك...',
      success: (data) => {
        setDescription(prev => `${prev}\n\nرؤى الشيف: ${data.nutritionalInfo}\n\nنصائح: ${data.tips.join(", ")}`);
        return 'تمت إضافة الرؤى إلى الوصف!';
      },
      error: 'فشل الحصول على رؤى الشيف'
    });
  };

  const handleUpdateChefStatus = async (chefId: string, stats: any) => {
    await userService.updateChefStats(chefId, stats);
    toast.success("تم تحديث بيانات الشيف!");
    fetchChefs();
  };

  const handleRefreshSeed = async () => {
    if (!window.confirm("هل تريد إعادة تحميل الوصفات الافتراضية؟ سيؤدي ذلك إلى إضافة الوصفات المفقودة.")) return;
    setLoading(true);
    try {
      await seedDatabase(true);
      toast.success("تم تحديث الوصفات بنجاح!");
    } catch (error) {
      toast.error("فشل تحديث الوصفات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif">
            {editingId ? 'تعديل الوصفة' : t('admin_dashboard')}
          </h1>
          {user?.role === 'chef' && (
            <p className="text-sm opacity-50">أهلاً بك أيها الشيف المتميز! واصل الإبداع.</p>
          )}
        </div>
        <div className="flex gap-2">
          {!editingId && (
            <button 
              onClick={handleRefreshSeed}
              className="flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-500 hover:text-white transition-all"
            >
              <RefreshCw size={16} />
              <span>تحديث الوصفات</span>
            </button>
          )}
          {editingId && (
            <button 
              onClick={handleCancelEdit}
              className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all"
            >
              <XCircle size={16} />
              <span>إلغاء</span>
            </button>
          )}
          <button 
            onClick={handleAIInsights}
            className="flex items-center gap-2 bg-[#C5A028]/10 text-[#C5A028] px-4 py-2 rounded-full text-sm font-bold hover:bg-[#C5A028] hover:text-white transition-all"
          >
            <Wand2 size={16} />
            <span>Chef's Insights</span>
          </button>
          <button 
            onClick={handleGenerateAIRecipe}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-[#3D2B1F] text-white px-4 py-2 rounded-full text-sm font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Wand2 size={16} />
            )}
            <span>{isGenerating ? 'جاري الابتكار...' : 'ابتكار وصفة جديدة'}</span>
          </button>
        </div>
      </div>

      {user?.role === 'chef' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">الأرباح الحالية</p>
            <p className="text-3xl font-serif">${user.earnings || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">المتابعون</p>
            <p className="text-3xl font-serif">{user.followersCount || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">عدد الوصفات</p>
            <p className="text-3xl font-serif">{user.recipesCount || 0}</p>
          </div>
        </div>
      )}

        <div className="flex gap-4 border-b border-[#3D2B1F]/10 pb-4">
          <button 
            onClick={() => setActiveTab('recipes')}
            className={`text-sm font-bold pb-2 transition-all border-b-2 ${activeTab === 'recipes' ? 'border-[#C5A028] text-[#C5A028]' : 'border-transparent opacity-40'}`}
          >إدارة الوصفات</button>
          {user?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('chefs')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 ${activeTab === 'chefs' ? 'border-[#C5A028] text-[#C5A028]' : 'border-transparent opacity-40'}`}
            >إدارة الطهاة</button>
          )}
          {user?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('affiliates')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 ${activeTab === 'affiliates' ? 'border-[#C5A028] text-[#C5A028]' : 'border-transparent opacity-40'}`}
            >إدارة المسوقين (الأفليت)</button>
          )}
          {user?.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('referrals')}
              className={`text-sm font-bold pb-2 transition-all border-b-2 ${activeTab === 'referrals' ? 'border-[#C5A028] text-[#C5A028]' : 'border-transparent opacity-40'}`}
            >التحويلات المالية</button>
          )}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`text-sm font-bold pb-2 transition-all border-b-2 ${activeTab === 'profile' ? 'border-[#C5A028] text-[#C5A028]' : 'border-transparent opacity-40'}`}
          >الملف الشخصي</button>
        </div>

      {activeTab === 'recipes' && (
        <div className="space-y-8 bg-white p-8 rounded-3xl border border-[#3D2B1F]/5 shadow-sm">
          {/* AI Extraction Section */}
          <section className="bg-[#C5A028]/5 p-6 rounded-2xl border border-[#C5A028]/20 space-y-4">
            <div className="flex items-center gap-3 text-[#C5A028]">
              <Play size={20} />
              <h3 className="font-bold">استخراج الوصفة من فيديو أو وصف</h3>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="رابط فيديو يوتيوب أو وصف لمحتوى الفيديو..." 
                className="flex-1 bg-white border border-[#C5A028]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A028]/30"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button 
                onClick={handleGenerateFromVideo}
                disabled={isGenerating}
                className="bg-[#C5A028] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-md disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                <span className="hidden md:inline">استخراج</span>
              </button>
            </div>
            <p className="text-[10px] opacity-50">الصقي رابط يوتيوب وسنقوم باستخراج المكونات والخطوات والوقت تلقائياً.</p>
          </section>
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-widest font-bold opacity-50">Basic Info</label>
            <input 
              type="text" 
              placeholder="Recipe Title" 
              className="w-full text-3xl font-serif border-b border-[#3D2B1F]/10 py-2 focus:outline-none focus:border-[#C5A028]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea 
              placeholder="Description" 
              className="w-full min-h-[150px] border border-[#3D2B1F]/10 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-[#C5A028]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-40">وقت التحضير</label>
                <input 
                  type="text" 
                  placeholder="مثلاً: 15 دقيقة" 
                  className="w-full bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2 text-sm"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-40">وقت الطهي</label>
                <input 
                  type="text" 
                  placeholder="مثلاً: 45 دقيقة" 
                  className="w-full bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2 text-sm"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">صورة الوصفة (رابط أو رفع)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="https://example.com/image.jpg" 
                      className="flex-1 bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2 text-sm"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    <button 
                      onClick={handleGenerateAIImage}
                      className="p-2 bg-[#C5A028]/10 text-[#C5A028] rounded-lg hover:bg-[#C5A028] hover:text-white transition-all"
                      title="توليد صورة بالذكاء الاصطناعي"
                    >
                      <Wand2 size={18} />
                    </button>
                  </div>

                  {/* YouTube Snapshots */}
                  {videoUrl && getYouTubeId(videoUrl) && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold opacity-40">لقطات مقترحة من الفيديو:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3].map(id => (
                          <button 
                            key={id}
                            onClick={() => setImageUrl(`https://img.youtube.com/vi/${getYouTubeId(videoUrl)}/${id === 0 ? 'maxresdefault' : id}.jpg`)}
                            className="aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-[#C5A028] transition-all bg-gray-100"
                          >
                            <img 
                              src={`https://img.youtube.com/vi/${getYouTubeId(videoUrl)}/${id === 0 ? 'mqdefault' : id}.jpg`} 
                              alt={`Snapshot ${id}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg cursor-pointer transition-all text-xs font-bold text-[#3D2B1F]/60">
                      <Plus size={14} />
                      <span>رفع من الجهاز (Max 1MB)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {imageUrl && (
                      <button 
                        onClick={() => setImageUrl('')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="حذف الصورة"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {imageUrl && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-[#3D2B1F]/10">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">فيديو الوصفة (رابط)</label>
                <input 
                  type="text" 
                  placeholder="https://example.com/video.mp4" 
                  className="w-full bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2 text-sm"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold opacity-40">التصنيف</label>
                <select 
                  className="bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="وجبات">{t('category_meals')}</option>
                  <option value="سلطات">{t('category_salads')}</option>
                  <option value="حلا">{t('category_desserts')}</option>
                  <option value="مشويات">{t('category_grills')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold opacity-40">المنطقة (Origin)</label>
                <select 
                  className="bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                >
                  <option value="Khaliji">{t('origin_khaliji')}</option>
                  <option value="Shami">{t('origin_shami')}</option>
                  <option value="Egyptian">{t('origin_egyptian')}</option>
                  <option value="European">{t('origin_european')}</option>
                  <option value="Asian">{t('origin_asian')}</option>
                  <option value="Global">{t('origin_global')}</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="w-4 h-4 accent-[#C5A028]" />
                <span className="text-sm font-medium">{t('premium')}</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase tracking-widest font-bold opacity-50">{t('ingredients')}</label>
              <button onClick={handleAddIngredient} className="text-[#C5A028] hover:underline text-xs font-bold">+ Add</button>
            </div>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Name" 
                  className="flex-1 bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2"
                  value={ing.name}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[idx].name = e.target.value;
                    setIngredients(newIngs);
                  }}
                />
                <input 
                  type="text" 
                  placeholder="Amount" 
                  className="w-32 bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2"
                  value={ing.amount}
                  onChange={(e) => {
                    const newIngs = [...ingredients];
                    newIngs[idx].amount = e.target.value;
                    setIngredients(newIngs);
                  }}
                />
                <button 
                  onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase tracking-widest font-bold opacity-50">{t('steps')}</label>
              <button onClick={handleAddStep} className="text-[#C5A028] hover:underline text-xs font-bold">+ Add</button>
            </div>
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <span className="pt-2 opacity-30 font-serif">{idx + 1}</span>
                <textarea 
                  placeholder="Step description" 
                  className="flex-1 bg-gray-50 border border-[#3D2B1F]/10 rounded-lg px-4 py-2 min-h-[60px]"
                  value={step}
                  onChange={(e) => {
                    const newSteps = [...steps];
                    newSteps[idx] = e.target.value;
                    setSteps(newSteps);
                  }}
                />
                <button 
                  onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                  className="p-2 text-red-400 hover:text-red-600 mt-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#3D2B1F] text-white py-4 rounded-2xl font-bold hover:bg-[#C5A028] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {loading ? 'Saving...' : editingId ? 'تحديث الوصفة' : 'نشر الوصفة'}
          </button>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-8 bg-white p-8 rounded-3xl border border-[#3D2B1F]/5 shadow-sm">
          <div className="space-y-6">
            <h2 className="text-2xl font-serif">إعدادات الشيف</h2>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-40">الاسم التعريفي (Bio)</label>
              <textarea 
                placeholder="أخبر جمهورك عنك وعن شغفك بالطهي..."
                className="w-full min-h-[120px] border border-[#3D2B1F]/10 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-[#C5A028]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-40">بريد PayPal الإلكتروني (لاستلام الأرباح 70%)</label>
              <input 
                type="email"
                placeholder="example@paypal.com"
                className="w-full border border-[#3D2B1F]/10 rounded-xl p-4 focus:outline-none focus:ring-1 focus:ring-[#C5A028]"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
              <p className="text-[10px] text-gray-400">سيتم تحويل أرباحك تلقائياً عند وصولها لـ $50.</p>
            </div>

            <button 
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full bg-[#3D2B1F] text-white py-4 rounded-2xl font-bold hover:bg-[#C5A028] transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'تحديث البيانات'}
            </button>
          </div>
        </div>
      )}

      {/* Chef Management */}
      {activeTab === 'chefs' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif">قائمة الطهاة</h2>
          <div className="grid gap-4">
            {chefs.map(chef => (
              <div key={chef.uid} className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                    <img src={chef.photoURL || `https://ui-avatars.com/api/?name=${chef.displayName}`} alt={chef.displayName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold">{chef.displayName}</h3>
                    <div className="flex gap-3 text-[10px] uppercase font-bold opacity-40">
                      <span>التقييم: {chef.rating || 0}</span>
                      <span>الأرباح: ${chef.earnings || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpdateChefStatus(chef.uid, { rating: (chef.rating || 0) + 1 })}
                    className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-bold"
                  >+ تقييم</button>
                  <button 
                    onClick={() => handleUpdateChefStatus(chef.uid, { earnings: (chef.earnings || 0) + 10 })}
                    className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold"
                  >+ $10 ربح</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals Management */}
      {activeTab === 'affiliates' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-[#3D2B1F]">إدارة مسوقي النظام</h2>
          <div className="grid gap-4">
            {affiliates.length > 0 ? affiliates.map(af => (
              <div key={af.uid} className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 flex justify-between items-center shadow-sm">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-[#C5A028]/10 flex items-center justify-center font-bold text-[#C5A028]">
                    {af.displayName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {af.displayName}
                      <span className={`text-[8px] px-2 py-0.5 rounded-full ${af.affiliateData?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {af.affiliateData?.status === 'active' ? 'نشط' : 'موقف'}
                      </span>
                    </h3>
                    <div className="flex gap-3 text-[10px] uppercase font-bold opacity-40">
                      <span>{af.affiliateData?.country || 'N/A'}</span>
                      <span>{af.paypalEmail}</span>
                      <span>الزيارات: {af.affiliateData?.clicks || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleAffiliateStatus(af.uid, af.affiliateData?.status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${af.affiliateData?.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}
                  >
                    {af.affiliateData?.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 opacity-40">لا يوجد مسوقين مسجلين حالياً.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif">تقرير العمولات والإحالات</h2>
          <div className="grid gap-4">
            {referrals.length > 0 ? referrals.map(ref => (
              <div key={ref.id} className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#C5A028]/10 flex items-center justify-center text-[#C5A028]">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">عمولة إحالة جديدة</h3>
                    <div className="flex gap-3 text-[10px] uppercase font-bold opacity-40">
                      <span>المسوق: {ref.referrerId}</span>
                      <span>المبلغ: ${ref.amount}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${ref.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {ref.status === 'paid' ? 'تم الدفع' : 'قيد الانتظار'}
                  </span>
                  {ref.status === 'pending' && (
                    <button 
                      onClick={() => handleMarkPaid(ref.id)}
                      className="text-[10px] bg-[#3D2B1F] text-white px-3 py-1 rounded-full hover:bg-[#C5A028] transition-all"
                    >تأكيد الدفع</button>
                  )}
                  <p className="text-[10px] opacity-40 mt-1">{new Date(ref.createdAt?.toDate()).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-12 opacity-40">لا توجد إحالات مسجلة حالياً.</p>
            )}
          </div>
        </div>
      )}

      {/* Recipe Management List */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-serif">إدارة الوصفات الحالية</h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white shadow-sm text-[#3D2B1F]' : 'text-[#3D2B1F]/40'}`}
            >الكل</button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'pending' ? 'bg-white shadow-sm text-yellow-600' : 'text-[#3D2B1F]/40'}`}
            >قيد الانتظار</button>
            <button 
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'approved' ? 'bg-white shadow-sm text-green-600' : 'text-[#3D2B1F]/40'}`}
            >المعتمدة</button>
          </div>
        </div>

        <div className="grid gap-4">
          {recipes
            .filter(r => filterStatus === 'all' || r.status === filterStatus)
            .map(recipe => (
            <div key={recipe.id} className="bg-white p-6 rounded-2xl border border-[#3D2B1F]/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <img 
                    src={recipe.imageUrls?.[0] || `https://picsum.photos/seed/${recipe.id}/200/200`} 
                    alt={recipe.title} 
                    className="w-24 h-24 rounded-2xl object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  {recipe.videoUrl && (
                    <div className="absolute -top-2 -right-2 bg-[#C5A028] text-white p-2 rounded-full border-2 border-white shadow-lg">
                      <Play size={10} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold">{recipe.title}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs opacity-40 uppercase tracking-widest">{recipe.category}</p>
                    {recipe.status === 'pending' ? (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">قيد المراجعة</span>
                    ) : (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">منشورة</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Link 
                  to={`/recipe/${recipe.id}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all text-xs font-bold"
                >
                  <ExternalLink size={14} />
                  معاينة
                </Link>
                {user?.role === 'admin' && recipe.status === 'pending' && (
                  <button 
                    onClick={() => handleApprove(recipe.id)}
                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                    title="موافقة"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleEdit(recipe)}
                  className="p-2 bg-gray-50 text-gray-400 hover:text-[#C5A028] hover:bg-[#C5A028]/5 rounded-lg transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(recipe.id)}
                  className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Integration Section */}
      <div className="space-y-6 pt-12 border-t border-[#3D2B1F]/10">
        <div className="flex items-center gap-3">
          <CreditCard className="text-[#C5A028]" size={28} />
          <h2 className="text-2xl font-serif">إعدادات الدفع (Stripe)</h2>
        </div>
        
        <div className="grid gap-6">
          {/* Stripe Card */}
          <div className="bg-white p-6 rounded-3xl border border-[#3D2B1F]/5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Stripe</h3>
              {paymentStatus?.stripeConfigured ? (
                <span className="flex items-center gap-1 text-green-500 text-xs font-bold uppercase">
                  <CheckCircle2 size={14} />
                  متصل
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase">
                  <AlertCircle size={14} />
                  غير مهيأ
                </span>
              )}
            </div>
            <p className="text-sm opacity-60">
              يستخدم Stripe لمعالجة بطاقات الائتمان والاشتراكات الشهرية.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">API Endpoint:</p>
              <code className="block bg-gray-50 p-3 rounded-xl text-xs overflow-x-auto">
                POST /api/stripe/create-checkout
              </code>
            </div>
          </div>
        </div>

        <div className="bg-[#C5A028]/5 p-6 rounded-3xl border border-[#C5A028]/10">
          <h4 className="font-bold mb-2">تعليمات الإعداد:</h4>
          <ul className="text-sm space-y-2 opacity-80 list-disc list-inside">
            <li>قم بإضافة مفاتيح API الخاصة بك في لوحة "Secrets" في AI Studio.</li>
            <li>المفاتيح المطلوبة: <code className="bg-white/50 px-1 rounded">STRIPE_SECRET_KEY</code> و <code className="bg-white/50 px-1 rounded">STRIPE_PUBLISHABLE_KEY</code>.</li>
            <li>تأكد من تفعيل وضع "Live" في حسابك عند النشر الفعلي.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

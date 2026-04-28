import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChefHat, 
  ShoppingBag, 
  Crown, 
  PlusCircle, 
  Globe, 
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { userService, affiliateService } from './services/dbService';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { seedDatabase } from './services/seedService';
import { APP_DOMAIN } from './constants';
import './i18n';

// Pages
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import Marketplace from './pages/Marketplace';
import AdminDashboard from './pages/AdminDashboard';
import Subscriptions from './pages/Subscriptions';
import Legal from './pages/Legal';
import Login from './pages/Login';
import AffiliateDashboard from './pages/AffiliateDashboard';

// User Context
export const UserContext = createContext<{
  user: any | null;
  loading: boolean;
}>({ user: null, loading: true });

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRefresh, setShowRefresh] = useState(false);
  const location = useLocation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const ref = query.get('ref');
    const pathRef = location.pathname.startsWith('/r/') ? location.pathname.split('/r/')[1] : null;
    const finalRef = ref || pathRef;
    
    if (finalRef) {
      sessionStorage.setItem('referralCode', finalRef);
      affiliateService.trackClick(finalRef);
      // Clean URL if path-based ref
      if (pathRef) {
        window.history.replaceState({}, '', '/');
      }
    }
  }, [location.search, location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowRefresh(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firestore is offline. Check configuration.");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      seedDatabase();
    }
  }, [user?.role]);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRtl, i18n.language]);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (firebaseUser) {
        try {
          // Initial check/creation
          let profile = await userService.getUserProfile(firebaseUser.uid);
          if (!profile) {
            const isFirst = await userService.isFirstUser();
            const isAdminEmail = firebaseUser.email === 'mrsalaam1@gmail.com';
            const referredBy = sessionStorage.getItem('referralCode');
            const newProfile = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: (isFirst || isAdminEmail) ? 'admin' : 'user',
              subscription: (isFirst || isAdminEmail) ? 'premium' : 'free',
              referredBy: referredBy || null
            };
            await userService.createUserProfile(firebaseUser.uid, newProfile);
            profile = newProfile;
          }
          setUser({ ...firebaseUser, ...profile, emailVerified: firebaseUser.emailVerified });

          // Start real-time listener
          profileUnsubscribe = userService.subscribeToUserProfile(firebaseUser.uid, (updatedProfile) => {
            setUser((prev: any) => prev ? { ...prev, ...updatedProfile, emailVerified: auth.currentUser?.emailVerified } : null);
          });
        } catch (error) {
          console.error("Failed to load user profile", error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const toggleLanguage = () => {
    const langs = ['ar', 'en', 'fr', 'es', 'zh'];
    const currentIndex = langs.indexOf(i18n.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    i18n.changeLanguage(nextLang);
  };

  const navItems = [
    { path: '/', icon: ChefHat, label: t('recipes') },
    { path: '/market', icon: ShoppingBag, label: t('market') },
    { path: '/subscriptions', icon: Crown, label: t('subscriptions') },
    { path: '/affiliate', icon: Globe, label: t('affiliate'), roles: ['user', 'chef', 'admin'] },
    { path: '/admin', icon: PlusCircle, label: t('add_recipe'), roles: ['chef', 'admin'] },
  ];

  return (
    <UserContext.Provider value={{ user, loading }}>
      <div className={`min-h-screen bg-[#F8F8F5] text-[#3D2B1F] font-sans selection:bg-[#C5A028]/20 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Desktop Navigation */}
        <nav className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#3D2B1F]/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-3">
                <img 
                  src="https://i.imgur.com/zF9MSpy.png" 
                  alt="دبيازة Logo" 
                  className="w-10 h-10 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-2xl font-bold tracking-tight font-serif">{t('app_name')}</span>
              </Link>

              <div className="flex items-center gap-8">
                {navItems.filter(item => !item.roles || item.roles.includes(user?.role)).map(item => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`text-sm font-bold transition-colors ${location.pathname === item.path ? 'text-[#C5A028]' : 'text-[#3D2B1F]/60 hover:text-[#3D2B1F]'}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button onClick={toggleLanguage} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Globe size={20} />
                </button>
                
                {user ? (
                  <div className="flex items-center gap-3 ps-4 border-s border-[#3D2B1F]/10">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold leading-none">{user.displayName}</span>
                      <span className={`text-[9px] uppercase tracking-tighter font-black ${user.subscription === 'premium' ? 'text-[#C5A028]' : 'text-[#3D2B1F]/40'}`}>
                        {user.subscription === 'premium' ? t('premium') : t('free_plan')}
                      </span>
                    </div>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full ring-2 ring-[#C5A028]/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#3D2B1F] text-white flex items-center justify-center text-xs font-bold">
                        {user.displayName?.charAt(0)}
                      </div>
                    )}
                    <button onClick={handleLogout} className="text-sm font-semibold hover:text-[#C5A028] transition-colors">{t('logout')}</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-bold text-[#3D2B1F]/60 hover:text-[#3D2B1F] transition-colors">
                      {t('login')}
                    </Link>
                    <Link to="/login" className="bg-[#3D2B1F] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#C5A028] transition-all active:scale-95 shadow-lg shadow-[#3D2B1F]/10">
                      {t('register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#3D2B1F]/5 px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://i.imgur.com/zF9MSpy.png" 
              alt="دبيازة Logo" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold font-serif">{t('app_name')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleLanguage} className="p-2 bg-gray-100 rounded-full">
              <Globe size={18} />
            </button>
            {user && (
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
          {loading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
              <div className="w-12 h-12 border-4 border-[#C5A028]/20 border-t-[#C5A028] rounded-full animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-sm font-serif opacity-40">جاري التحميل...</p>
                {showRefresh && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-xs bg-[#3D2B1F] text-white px-4 py-2 rounded-full font-bold animate-fade-in"
                  >
                    إعادة تحميل الصفحة
                  </button>
                )}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#3D2B1F]/5 pb-safe">
          <div className="flex justify-around items-center h-16 px-4">
            {navItems.filter(item => !item.roles || item.roles.includes(user?.role)).map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className="flex flex-col items-center gap-1 min-w-[64px]"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#C5A028] text-white shadow-lg shadow-[#C5A028]/20' : 'text-[#3D2B1F]/40'}`}>
                    <Icon size={22} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-[#C5A028]' : 'text-[#3D2B1F]/40'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Desktop Footer */}
        <footer className="bg-[#3D2B1F] text-[#C5A028] py-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex flex-col items-center md:items-start gap-6">
                <Link to="/" className="flex gap-3 items-center group">
                  <img 
                    src="https://i.imgur.com/zF9MSpy.png" 
                    alt="دبيازة Logo" 
                    className="w-16 h-16 object-contain transition-transform group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col">
                    <span className="text-4xl font-serif font-bold tracking-tighter drop-shadow-sm">{t('app_name')}</span>
                    <span className="text-[10px] uppercase tracking-[0.4em] opacity-70 font-bold -mt-1">{t('premium_tagline')}</span>
                  </div>
                </Link>
                <div className="flex flex-col items-center md:items-start gap-2">
                  <Link to="/market" className="text-xs font-bold hover:text-white underline underline-offset-4 decoration-[#C5A028]/30">
                    {t('shop_with_us')}
                  </Link>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest leading-loose text-center md:text-start">
                    {t('footer_copyright')}<br/>
                    {t('footer_pioneers')}
                  </p>
                </div>
              </div>
            
            <div className="flex gap-8 text-sm font-bold uppercase tracking-widest opacity-80">
              <Link to="/legal#privacy" className="hover:text-white transition-colors">{t('privacy_policy')}</Link>
              <Link to="/legal#terms" className="hover:text-white transition-colors">{t('terms_of_use')}</Link>
            </div>
          </div>
        </footer>
      </div>
    </UserContext.Provider>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/market" element={<Marketplace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/affiliate" element={<AffiliateDashboard />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Layout>
    </Router>
  );
}

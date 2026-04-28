import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Globe, 
  Copy, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ExternalLink, 
  ChevronRight, 
  Info,
  CheckCircle2,
  Gift,
  Share2,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserContext } from '../App';
import { affiliateService, userService } from '../services/dbService';
import { toast } from 'sonner';

const AffiliateDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const isRtl = i18n.language === 'ar';

  const [country, setCountry] = useState('Saudi Arabia');
  const [pEmail, setPEmail] = useState('');

  useEffect(() => {
    if (user?.affiliateData?.isAffiliate) {
      const fetchStats = async () => {
        const data = await affiliateService.getReferralStats(user.uid);
        setStats(data || []);
      };
      fetchStats();
    }
  }, [user]);

  const handleJoin = async () => {
    if (!user) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }
    if (!pEmail || !pEmail.includes('@')) {
      toast.error(isRtl ? 'يرجى إدخال بريد بايبال صحيح' : 'Please enter a valid PayPal email');
      return;
    }
    setLoading(true);
    try {
      await affiliateService.joinProgram(user.uid, country, pEmail);
      toast.success(isRtl ? 'مرحباً بك في نظام الأفليت!' : 'Welcome to the Affiliate Program!');
    } catch (error) {
      toast.error(isRtl ? 'حدث خطأ ما' : 'Something went wrong');
    }
    setLoading(false);
  };

  const copyLink = () => {
    const link = `https://depiaza.com/r/${user.uid}`;
    navigator.clipboard.writeText(link);
    toast.success(isRtl ? 'تم نسخ الرابط المختصر بنجاح' : 'Shortened link copied!');
  };

  const handleUpdatePaypal = async (email: string) => {
    if (!user) return;
    try {
      await userService.updateUserProfile(user.uid, { paypalEmail: email });
      toast.success(isRtl ? 'تم تحديث بريد بايبال بنجاح' : 'PayPal email updated successfully!');
    } catch (error) {
      toast.error(isRtl ? 'فشل التحديد' : 'Update failed');
    }
  };

  if (!user?.affiliateData?.isAffiliate) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-[#C5A028]/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Gift className="text-[#C5A028]" size={40} />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold">
            {isRtl ? 'شاركينا النجاح.. واربحي معنا' : 'Share the success.. and earn with us'}
          </h1>
          <p className="text-[#3D2B1F]/60 max-w-2xl mx-auto text-lg leading-relaxed">
            {isRtl 
              ? 'انضمي إلى برنامج دبيازة للتسويق بالعمولة واحصلي على عمولة 10% عن كل مشترك جديد. دبيازة مجتمع لعشاق الطبخ الراقي.'
              : 'Join the Debazah affiliate program and earn a 10% commission for every new subscriber. Join our elite community.'}
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-[#3D2B1F]/5 shadow-xl space-y-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-serif text-center">{isRtl ? 'استكمال الطلب' : 'Complete Application'}</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-40">{isRtl ? 'الدولة' : 'Country'}</label>
              <select 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#F8F8F5] p-4 rounded-2xl border border-[#3D2B1F]/5 focus:outline-none focus:ring-2 focus:ring-[#C5A028]/20"
              >
                {['Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Oman', 'Bahrain', 'Egypt', 'USA', 'UK', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-40">{isRtl ? 'بريد PayPal (إلزامي)' : 'PayPal Email (Required)'}</label>
              <input 
                type="email"
                placeholder="yours@email.com"
                value={pEmail}
                onChange={(e) => setPEmail(e.target.value)}
                className="w-full bg-[#F8F8F5] p-4 rounded-2xl border border-[#3D2B1F]/5 focus:outline-none focus:ring-2 focus:ring-[#C5A028]/20"
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex gap-3 text-xs text-yellow-800 leading-relaxed">
              <Info size={16} className="shrink-0" />
              <p>{isRtl ? 'يجب أن يكون حساب بايبال مفعلاً لاستلام المستحقات المالية.' : 'Your PayPal account must be active to receive payments.'}</p>
            </div>

            <button 
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-[#3D2B1F] text-white py-5 rounded-2xl font-bold hover:bg-[#C5A028] hover:translate-y-[-2px] transition-all shadow-xl flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRtl ? 'بدء العمل كشريك رسمي' : 'Start working as official partner'}
                  <ChevronRight size={20} className={isRtl ? 'rotate-180' : ''} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-[#3D2B1F]/5">
          {[
            { icon: Users, title: isRtl ? '10% عمولة' : '10% Commission', desc: isRtl ? 'على كل اشتراك سنوي جديد' : 'On every new yearly subscription' },
            { icon: DollarSign, title: isRtl ? 'سحب فوري' : 'Instant Payout', desc: isRtl ? 'عند الوصول للحد الأدنى $50' : 'When reaching $50 minimum' },
            { icon: Globe, title: isRtl ? 'نطاق دولي' : 'Global Reach', desc: isRtl ? 'سوقي حول العالم بأي لغة' : 'Market worldwide in any language' }
          ].map((feature, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-14 h-14 bg-[#3D2B1F]/5 rounded-2xl flex items-center justify-center text-[#C5A028] mx-auto">
                <feature.icon size={28} />
              </div>
              <h3 className="font-bold text-lg">{feature.title}</h3>
              <p className="text-sm opacity-50">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const affiliateData = user.affiliateData;
  const isPaused = affiliateData?.status === 'paused';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Paused Alert */}
      {isPaused && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-center justify-between text-red-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Info size={20} />
            </div>
            <div>
              <h3 className="font-bold">{isRtl ? 'الحساب معلق مؤقتاً' : 'Account Temporarily Paused'}</h3>
              <p className="text-xs opacity-70">{isRtl ? 'يرجى التواصل مع الإدارة لمزيد من التفاصيل.' : 'Please contact administration for more details.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm ${isPaused ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold">{isRtl ? 'لوحة تحكم المسوقة' : 'Affiliate Dashboard'}</h1>
            <span className="bg-[#C5A028]/10 text-[#C5A028] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Partner</span>
          </div>
          <p className="text-sm opacity-40 font-bold uppercase tracking-widest">
            {isRtl ? 'برنامج دبيازة للشركاء الدولي' : 'Debazah Global Partners Program'}
          </p>
        </div>
        <div className="flex bg-[#F8F8F5] p-2 rounded-2xl border border-[#3D2B1F]/5 w-full md:w-auto">
          <div className={`px-4 py-1.5 rounded-xl text-xs font-bold leading-none flex flex-col justify-center ${isRtl ? 'border-l' : 'border-r'} border-[#3D2B1F]/10`}>
            <span className="opacity-40 uppercase text-[8px] mb-0.5">{isRtl ? 'حالة الحساب' : 'Status'}</span>
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 size={10} />
              {isRtl ? 'نشط' : 'Active'}
            </span>
          </div>
          <div className="px-4 py-1.5 rounded-xl text-xs font-bold flex flex-col justify-center">
            <span className="opacity-40 uppercase text-[8px] mb-0.5">{isRtl ? 'كود التسويق' : 'Referral Code'}</span>
            <span>{user.uid.slice(0, 8)}</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { icon: DollarSign, label: isRtl ? 'اجمالي الأرباح' : 'Total Earnings', value: `$${affiliateData.totalEarnings || 0}`, color: 'text-green-600' },
          { icon: TrendingUp, label: isRtl ? 'أرباح معلقة' : 'Pending', value: `$${affiliateData.pendingEarnings || 0}`, color: 'text-[#C5A028]' },
          { icon: Copy, label: isRtl ? 'الزيارات' : 'Total Clicks', value: affiliateData.clicks || 0, color: 'text-blue-500' },
          { icon: Users, label: isRtl ? 'التحويلات' : 'Conversions', value: affiliateData.conversions || 0, color: 'text-purple-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-4">
            <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-3xl font-serif font-bold">{stat.value}</p>
              <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Link & Tools */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-[#3D2B1F] text-white p-8 rounded-[3rem] space-y-6 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-bold">{isRtl ? 'رابط التسويق المخصص' : 'Your Referral Link'}</h3>
              <p className="text-sm opacity-60">
                {isRtl 
                  ? 'شاركي هذا الرابط مع صديقاتك أو متابعيك على وسائل التواصل الاجتماعي' 
                  : 'Share this link with your friends or followers on social media'}
              </p>
              <div className="flex gap-2 bg-white/10 p-2 rounded-2xl border border-white/10">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://depiaza.com/r/${user.uid}`}
                  className="bg-transparent flex-1 px-4 text-sm font-medium focus:outline-none"
                />
                <button 
                  onClick={copyLink}
                  className="bg-[#C5A028] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all text-xs"
                >
                  <Copy size={14} />
                  {isRtl ? 'نسخ الرابط' : 'Copy'}
                </button>
              </div>
            </div>
          </section>

          {/* Publishing Tools / Promotional Tools */}
          <section className="bg-white p-8 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{isRtl ? 'أدوات النشر والترويج' : 'Publishing & Promotional Tools'}</h3>
              <span className="text-[10px] font-bold uppercase py-1 px-3 bg-blue-50 text-blue-600 rounded-full">New</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-[#F8F8F5] rounded-3xl border border-[#3D2B1F]/5 space-y-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#C5A028]">
                  <Share2 size={20} />
                </div>
                <h4 className="font-bold text-sm">{isRtl ? 'كود النشر للمواقع (Embed)' : 'Embed Code for Websites'}</h4>
                <p className="text-[10px] opacity-60 leading-relaxed">
                  {isRtl ? 'انسخي هذا الكود وضعيه في موقعك ليظهر بنر دبيازة الاحترافي' : 'Copy this code to display the professional Debazah banner on your site'}
                </p>
                <div className="bg-white p-3 rounded-xl border border-[#3D2B1F]/10 font-mono text-[8px] overflow-hidden whitespace-nowrap opacity-50">
                  {`<a href="https://depiaza.com/r/${user.uid}"><img src="https://depiaza.com/banner.png"/></a>`}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`<a href="https://depiaza.com/r/${user.uid}"><img src="https://depiaza.com/banner.png" alt="Debazah App"/></a>`);
                    toast.success(isRtl ? 'تم نسخ كود النشر' : 'Embed code copied!');
                  }}
                  className="w-full py-2 bg-white border border-[#3D2B1F]/10 rounded-xl text-[10px] font-bold hover:bg-[#3D2B1F] hover:text-white transition-all shadow-sm"
                >
                  {isRtl ? 'نسخ الكود' : 'Copy HTML'}
                </button>
              </div>
              
              <div className="p-6 bg-[#F8F8F5] rounded-3xl border border-[#3D2B1F]/5 space-y-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#C5A028]">
                  <ExternalLink size={20} />
                </div>
                <h4 className="font-bold text-sm">{isRtl ? 'تغريدة جاهزة' : 'Ready to Tweet'}</h4>
                <p className="text-[10px] opacity-60 leading-relaxed">
                  {isRtl ? 'تغريدة مصممة خصيصاً لجذب المهتمين عالمياً ومحلياً' : 'A tweet specifically designed to attract global and local interested parties'}
                </p>
                <div className="bg-white p-3 rounded-xl border border-[#3D2B1F]/10 text-[10px]">
                  {isRtl 
                    ? `هل تبحث عن وصفات احترافية من حول العالم؟ انضم لدبيازة الآن واستكشف عالم الطهي! https://depiaza.com/r/${user.uid}`
                    : `Looking for professional recipes from around the world? Join Debazah now and explore! https://depiaza.com/r/${user.uid}`}
                </div>
                <button 
                  onClick={() => {
                    const text = isRtl 
                      ? `هل تبحث عن وصفات احترافية من حول العالم؟ انضم لدبيازة الآن واستكشف عالم الطهي! https://depiaza.com/r/${user.uid}`
                      : `Looking for professional recipes around the world? Join Debazah! https://depiaza.com/r/${user.uid}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
                  }}
                  className="w-full py-2 bg-[#C5A028] text-white rounded-xl text-[10px] font-bold hover:scale-105 transition-all shadow-md"
                >
                  {isRtl ? 'نشر على X' : 'Share on X'}
                </button>
              </div>
            </div>
          </section>

          <div className="bg-white p-8 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-6">
            <h3 className="text-xl font-bold">{isRtl ? 'العمليات الأخيرة والتحويلات' : 'Recent Conversions'}</h3>
            {stats.length > 0 ? (
              <div className="space-y-4">
                {stats.map((ref, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-[#F8F8F5] rounded-2xl transition-all hover:translate-x-1">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#C5A028] shadow-sm">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{isRtl ? 'تحويل ناجح (اشتراك)' : 'Successful Conversion'}</p>
                        <p className="text-[10px] opacity-40 uppercase font-bold">{new Date(ref.createdAt?.toDate()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+${ref.amount}</p>
                      <p className="text-[10px] opacity-40 font-bold uppercase">{ref.status === 'pending' ? (isRtl ? 'قيد المراجعة' : 'Pending') : (isRtl ? 'مدفوع' : 'Paid')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <TrendingUp size={32} />
                </div>
                <p className="text-sm opacity-40">{isRtl ? 'لا توجد تحويلات حتى الآن. ابدئي بمشاركة رابطك!' : 'No conversions yet. Start sharing your link!'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info & PayPal Payouts */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-[#3D2B1F]/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-[#C5A028]">
              <DollarSign size={18} />
              <h3 className="font-bold">{isRtl ? 'إعدادات الدفع (PayPal)' : 'PayPal Payout Settings'}</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase opacity-40 ml-1">{isRtl ? 'بريد بايبال للمستحقات' : 'PayPal Payout Email'}</label>
                <div className="relative">
                  <input 
                    type="email" 
                    defaultValue={user.paypalEmail || ''}
                    placeholder="email@paypal.com"
                    onBlur={(e) => handleUpdatePaypal(e.target.value)}
                    className="w-full bg-[#F8F8F5] border border-[#3D2B1F]/5 p-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A028]/50"
                  />
                </div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs text-blue-800 leading-relaxed">
                  {isRtl 
                    ? 'يتم تحويل الأرباح تلقائياً عند وصول رصيدك إلى 50 دولار للمواطنين في الدول المعتمدة بايبال.'
                    : 'Earnings are transferred automatically when your balance reaches $50 for users in PayPal supported countries.'}
                </p>
              </div>
              <button 
                disabled={affiliateData?.pendingEarnings < 50}
                className="w-full bg-[#3D2B1F] text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl"
              >
                <CreditCard size={18} />
                {isRtl ? 'سحب الرصيد الآن' : 'Withdraw Balance'}
              </button>
            </div>
          </div>

          <div className="bg-[#C5A028]/5 p-8 rounded-[2rem] border border-[#C5A028]/20 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">{isRtl ? 'نصائح لزيادة الأرباح' : 'Affiliate Success Tips'}</h4>
            <ul className="space-y-4">
              {[
                { text: isRtl ? 'شاركي وصفاتك المفضلة من المنطقة' : 'Share recipes from specific regions', icon: Globe },
                { text: isRtl ? 'استخدمي خاصية "منشن" في تويتر' : 'Use mentions on X/social media', icon: Share2 },
                { text: isRtl ? 'اكتبي مراجعات صادقة في الواتساب' : 'Write honest reviews in groups', icon: Users }
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs leading-relaxed">
                  <div className="p-1.5 bg-[#C5A028]/10 text-[#C5A028] rounded-lg h-fit">
                    <tip.icon size={12} />
                  </div>
                  {tip.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;

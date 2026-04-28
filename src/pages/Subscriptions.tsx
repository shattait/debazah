import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Star, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { userService, affiliateService } from '../services/dbService';
import { UserContext } from '../App';

const Subscriptions: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(UserContext);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    const handleSuccess = async () => {
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');
      
      if (success && user) {
        // In a real app, you'd verify the session ID from Stripe here
        // For this demo, we'll assume success if the param is present
        try {
          const planId = searchParams.get('planId') || 'premium';
          const subscriptionType = planId === 'pro_chef' ? 'pro_chef' : 'premium';
          
          await userService.updateUserSubscription(user.uid, subscriptionType);
          
          // Record affiliate referral if applicable
          if (user.referredBy) {
            const commission = 1.0; // 10% of $10 plan for simple demo
            await affiliateService.recordReferral(user.referredBy, user.uid, commission);
            console.log("Recorded referral conversion for", user.referredBy);
          }

          toast.success("تم الاشتراك بنجاح! استمتع بكافة مميزات دبيازة.");
          // Clear params
          setSearchParams({});
        } catch (error) {
          console.error("Failed to update subscription", error);
        }
      }
      
      if (canceled) {
        toast.error("تم إلغاء عملية الدفع.");
        setSearchParams({});
      }
    };

    handleSuccess();
  }, [searchParams, user, setSearchParams]);

  const plans = [
    {
      id: 'free',
      name: t('plan_free'),
      price: '0',
      features: [t('feature_500_recipes'), t('feature_basic_suggestions'), t('feature_marketplace_access')],
      color: 'bg-gray-100',
      icon: <Star className="text-gray-400" />
    },
    {
      id: 'premium',
      name: t('plan_premium'),
      price: '10',
      features: [t('feature_exclusive_recipes'), t('feature_ai_alternatives'), t('feature_video_guides'), t('feature_priority_support'), t('feature_no_ads'), "Access to all secret Chef recipes"],
      color: 'bg-[#C5A028]/10 border-[#C5A028]',
      icon: <Crown className="text-[#C5A028]" />,
      popular: true,
      period: t('per_month') === '/ month' ? '/ year' : '/ سنة'
    },
    {
      id: 'chef',
      name: "برنامج الطهاة",
      price: 'Free',
      features: ["انشر وصفاتك الخاصة", "حقق أرباحاً 70% من المبيعات", "تحليلات متقدمة", "لوحة تحكم كاملة"],
      color: 'bg-[#3D2B1F] text-white',
      icon: <Zap className="text-yellow-400" />,
      cta: "ابدأ كـ شيف"
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً لإتمام عملية الاشتراك");
      return;
    }

    if (planId === 'free') {
      toast.info("أنت مشترك بالفعل في الخطة المجانية");
      return;
    }

    if (planId === 'chef') {
      try {
        await userService.applyForChef(user.uid);
        toast.success("مبروك! لقد أصبحت شيف في دبيازة. يمكنك الآن إضافة وصفاتك من لوحة التحكم.");
      } catch (error) {
        toast.error("فشل إرسال طلب الانضمام كشيف.");
      }
      return;
    }

    setLoadingPlan(planId);
    try {
      console.log("Starting checkout for plan:", planId);
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl: `https://depiaza.com/subscriptions?success=true`,
          cancelUrl: `https://depiaza.com/subscriptions?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        console.log("Stripe URL received:", data.url);
        setCheckoutUrl(data.url);
        // Do NOT try window.top.location.href as it's blocked by browser security in iframes
        // Instead, we'll let the user click the new "Complete Payment" button
        toast.success("تم تجهيز فاتورة الدفع، يرجى الضغط على الزر للمتابعة");
      } else {
        throw new Error('لم يتم استلام رابط الدفع من الخادم');
      }
    } catch (error: any) {
      console.error("Stripe error:", error);
      toast.error(`عذراً، حدث خطأ: ${error.message}`);
      setLoadingPlan(null); // Only reset on error
    }
    // Removed finally { setLoadingPlan(null); } to keep the button visible
  };

  return (
    <div className="space-y-16 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-serif">{t('subscriptions')}</h1>
        <p className="max-w-2xl mx-auto opacity-60">{t('subscription_tagline')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, idx) => (
          <motion.div 
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative p-8 rounded-3xl border border-[#3D2B1F]/5 flex flex-col gap-8 ${plan.color}`}
          >
            {plan.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C5A028] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                {t('most_popular')}
              </span>
            )}
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                {plan.icon}
              </div>
              <div className="text-right">
                <p className="text-3xl font-serif">${plan.price}</p>
                <p className="text-xs opacity-50 uppercase tracking-widest">{plan.id === 'premium' ? (isRtl ? '/ سنوياً' : '/ year') : t('per_month')}</p>
              </div>
            </div>
            <div className="text-left space-y-4 flex-1">
              <h3 className="text-2xl font-serif">{plan.name}</h3>
              <ul className="space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm opacity-80">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => checkoutUrl && loadingPlan === plan.id ? null : handleSubscribe(plan.id)}
              disabled={loadingPlan !== null && loadingPlan !== plan.id}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${plan.id === 'pro_chef' ? 'bg-white text-[#3D2B1F] hover:bg-[#C5A028] hover:text-white' : 'bg-[#3D2B1F] text-white hover:bg-[#C5A028]'}`}
            >
              {loadingPlan === plan.id ? (
                checkoutUrl ? t('complete_payment') : <Loader2 className="animate-spin" size={20} />
              ) : (
                t('get_started')
              )}
            </button>

            {checkoutUrl && loadingPlan === plan.id && (
              <motion.a 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                href={checkoutUrl} 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl font-bold bg-[#C5A028] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#C5A028]/20"
              >
                <CreditCard size={20} />
                إتمام عملية الدفع الآن
              </motion.a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Subscriptions;

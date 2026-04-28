import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Legal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="relative h-[30vh] md:h-[40vh] rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-[#3D2B1F] text-white flex items-center justify-center text-center p-6">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-[#C5A028] rounded-2xl flex items-center justify-center mx-auto shadow-xl"
          >
            <Shield size={32} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif"
          >
            {t('legal')}
          </motion.h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 px-4">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 space-y-4 sticky top-24 h-fit">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all mb-8"
          >
            {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {isRtl ? 'العودة' : 'Back'}
          </button>
          
          <a href="#privacy" className="block p-4 rounded-2xl bg-white border border-[#3D2B1F]/5 hover:border-[#C5A028] transition-all group">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#C5A028]" />
              <span className="font-bold">{t('privacy_policy')}</span>
            </div>
          </a>
          
          <a href="#terms" className="block p-4 rounded-2xl bg-white border border-[#3D2B1F]/5 hover:border-[#C5A028] transition-all group">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[#C5A028]" />
              <span className="font-bold">{t('terms_of_use')}</span>
            </div>
          </a>
        </div>

        {/* Content */}
        <div className="md:col-span-8 space-y-20">
          {/* Privacy Policy */}
          <section id="privacy" className="space-y-6">
            <h2 className="text-3xl font-serif border-b border-[#3D2B1F]/5 pb-4">{t('privacy_policy')}</h2>
            <div className="prose prose-lg max-w-none text-[#3D2B1F]/70 leading-relaxed space-y-4">
              {isRtl ? (
                <>
                  <p>نحن في دبيازة نولي أهمية قصوى لخصوصيتك. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">1. المعلومات التي نجمعها</h3>
                  <p>نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب، مثل اسمك وبريدك الإلكتروني وصورتك الشخصية من خلال تسجيل الدخول عبر جوجل.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">2. كيف نستخدم معلوماتك</h3>
                  <p>نستخدم معلوماتك لتخصيص تجربتك، وتحسين خدماتنا، والتواصل معك بشأن تحديثات التطبيق أو العروض الخاصة.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">3. حماية البيانات</h3>
                  <p>نحن نستخدم تقنيات تشفير متقدمة لحماية بياناتك من الوصول غير المصرح به.</p>
                </>
              ) : (
                <>
                  <p>At Debazah, we prioritize your privacy. This policy outlines how we collect, use, and protect your personal information.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">1. Information We Collect</h3>
                  <p>We collect information you provide directly to us when creating an account, such as your name, email, and profile picture via Google Login.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">2. How We Use Your Information</h3>
                  <p>We use your information to personalize your experience, improve our services, and communicate with you about app updates or special offers.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">3. Data Protection</h3>
                  <p>We use advanced encryption technologies to protect your data from unauthorized access.</p>
                </>
              )}
            </div>
          </section>

          {/* Terms of Use */}
          <section id="terms" className="space-y-6">
            <h2 className="text-3xl font-serif border-b border-[#3D2B1F]/5 pb-4">{t('terms_of_use')}</h2>
            <div className="prose prose-lg max-w-none text-[#3D2B1F]/70 leading-relaxed space-y-4">
              {isRtl ? (
                <>
                  <p>باستخدامك لتطبيق دبيازة، فإنك توافق على الالتزام بالشروط التالية:</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">1. استخدام المحتوى</h3>
                  <p>جميع الوصفات والمحتوى المتوفر في التطبيق مخصص للاستخدام الشخصي فقط. لا يجوز إعادة توزيع المحتوى أو بيعه دون إذن مسبق.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">2. الحسابات والاشتراكات</h3>
                  <p>أنت مسؤول عن الحفاظ على سرية حسابك. الاشتراكات المميزة مخصصة لمستخدم واحد فقط.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">3. إخلاء المسؤولية ومسؤولية الشيف</h3>
                  <p>نحن نسعى لتقديم معلومات دقيقة، ولكننا لا نتحمل المسؤولية عن أي نتائج غير متوقعة ناتجة عن اتباع الوصفات أو استخدام بدائل المكونات.</p>
                  <p>يتحمل الشيف (ناشر الوصفة) المسؤولية الكاملة عن دقة وصحة المحتوى المنشور، بما في ذلك الصور والفيديوهات والمكونات، والتأكد من عدم انتهاك حقوق الملكية الفكرية للآخرين.</p>
                </>
              ) : (
                <>
                  <p>By using the Debazah app, you agree to comply with the following terms:</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">1. Content Usage</h3>
                  <p>All recipes and content available in the app are for personal use only. Content may not be redistributed or sold without prior permission.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">2. Accounts and Subscriptions</h3>
                  <p>You are responsible for maintaining the confidentiality of your account. Premium subscriptions are for a single user only.</p>
                  <h3 className="text-xl font-bold text-[#3D2B1F]">3. Disclaimer and Chef Responsibility</h3>
                  <p>We strive to provide accurate information, but we are not responsible for any unexpected results from following recipes or using ingredient alternatives.</p>
                  <p>The Chef (recipe publisher) bears full responsibility for the accuracy and validity of the published content, including images, videos, and ingredients, and ensuring no infringement of third-party intellectual property rights.</p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Legal;

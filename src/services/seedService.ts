import { recipeService } from './dbService';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const sampleRecipes = [
  // --- KHALIJI ---
  {
    title: "كبسة دجاج سعودية احترافية 🇸🇦",
    description: "الكبسة السعودية التقليدية مع الأرز البسمتي والدجاج المتبل بالبهارات الخليجية الأصيلة.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Khaliji",
    ingredients: [
      { name: "دجاج", amount: "1 حبة" },
      { name: "أرز بسمتي", amount: "3 أكواب" },
      { name: "بهارات كبسة", amount: "2 ملعقة كبيرة" }
    ],
    steps: ["سلق الدجاج", "تحمير الدجاج", "طبخ الأرز بالمرق"],
    imageUrls: ["https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=1-SaudiKabsa",
    isPremium: false,
    status: 'approved',
    prepTime: "20 min",
    cookTime: "45 min",
    servings: "4-6"
  },
  {
    title: "جريش نجدي بالطريقة الأصلية",
    description: "القمح المجروش المطهو مع الدجاج واللبن والسمن والليمون الأسود على الطريقة الوجدية.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Khaliji",
    ingredients: [
      { name: "جريش", amount: "2 كوب" },
      { name: "دجاج", amount: "1 كيلو" }
    ],
    steps: ["نقع الجريش", "طبخه مع اللبن", "الهرس جيدا"],
    imageUrls: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=2-JareeshRecipe",
    isPremium: true,
    status: 'approved',
    prepTime: "30 min",
    cookTime: "120 min",
    servings: "4-6"
  },

  // --- SHAMI ---
  {
    title: "شاورما دجاج شامية 🇸🇾",
    description: "أسرار شاورما الدجاج الشامية بتتبيلة خل التفاح والزبادي والثومية الشهيرة.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Shami",
    ingredients: [
      { name: "صدور دجاج", amount: "1 كيلو" },
      { name: "زبادي وثوم", amount: "كمية" }
    ],
    steps: ["نقع الدجاج", "الشواء بالفرن", "التقطيع لشرائح رقيقة"],
    imageUrls: ["https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=6-Shawarma",
    isPremium: false,
    status: 'approved',
    prepTime: "15 min",
    cookTime: "30 min",
    servings: "4"
  },
  {
    title: "مقلوبة فلسطينية",
    description: "الدجاج والباذنجان المصفف مع الأرز، تقلب عند التقديم لتشكل لوحة فنية.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Shami",
    ingredients: [
      { name: "دجاج", amount: "1 حبة" },
      { name: "باذنجان مقلي", amount: "2 حبة" }
    ],
    steps: ["سلق الدجاج", "رص المكونات", "القلب عند التقديم"],
    imageUrls: ["https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=8-Maqluba",
    isPremium: false,
    status: 'approved',
    prepTime: "25 min",
    cookTime: "60 min",
    servings: "5"
  },

  // --- EGYPTIAN ---
  {
    title: "كشري مصري أصلي 🇪🇬",
    description: "الطبق الشعبي الأول في مصر، أرز وعدس ومعكرونة مع صلصة الطماطم والدقة.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Egyptian",
    ingredients: [
      { name: "أرز وعدس", amount: "كمية" },
      { name: "بصل محمر", amount: "كمية" }
    ],
    steps: ["سلق المكونات", "تحضير الصلصة", "التقديم بالطبقات"],
    imageUrls: ["https://images.unsplash.com/photo-1562158074-67232230076a?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=11-Koshari",
    isPremium: false,
    status: 'approved',
    prepTime: "20 min",
    cookTime: "40 min",
    servings: "4"
  },
  {
    title: "ملوخية بالدجاج",
    description: "الملوخية الخضراء المصرية مع الطشة بالثوم والكسبرة، تقدم مع الأرز والدجاج.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Egyptian",
    ingredients: [
      { name: "ملوخية خضراء", amount: "500 جرام" },
      { name: "ثوم وكسبرة", amount: "كمية" }
    ],
    steps: ["تجهيز الملوخية", "الطشة الشهيرة", "التقديم مع الدجاج"],
    imageUrls: ["https://images.unsplash.com/photo-1547928576-a4a33237eceb?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=12-Molokhia",
    isPremium: true,
    status: 'approved',
    prepTime: "15 min",
    cookTime: "25 min",
    servings: "4"
  },

  // --- EUROPEAN ---
  {
    title: "باستا ألفريدو إيطالية 🇪🇺",
    description: "السر الإيطالي لصلصة ألفريدو الكريمية بجبن البارميزان والدجاج.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "European",
    ingredients: [
      { name: "باستا", amount: "500 جرام" },
      { name: "كريمة وبارميزان", amount: "كمية" }
    ],
    steps: ["سلق الباستا", "تحضير الصوص", "الدمج والتقديم"],
    imageUrls: ["https://images.unsplash.com/photo-1645112481338-3562e9998b04?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=16-Alfredo",
    isPremium: false,
    status: 'approved',
    prepTime: "10 min",
    cookTime: "20 min",
    servings: "2-3"
  },

  // --- ASIAN ---
  {
    title: "سوشي ياباني 🇯🇵",
    description: "دليل كامل لصنع السوشي في المنزل بتكلفة بسيطة ونكهة احترافية.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Asian",
    ingredients: [
      { name: "أرز سوشي", amount: "1 كوب" },
      { name: "روبيان وسمك", amount: "كمية" }
    ],
    steps: ["تحضير الأرز", "الفرد على النوري", "اللف والتقطيع"],
    imageUrls: ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=22-Sushi",
    isPremium: true,
    status: 'approved',
    prepTime: "40 min",
    cookTime: "20 min",
    servings: "2"
  },

  // --- GLOBAL ---
  {
    title: "برجر احترافي منزلي 🌍",
    description: "طريقة صنع برجر المطاعم في المنزل بلحم بقري طازج وجبن ذائب.",
    category: "وجبات",
    chefId: "system",
    chefName: "الشيف دبيازة",
    origin: "Global",
    ingredients: [
      { name: "لحم بقري مفروم", amount: "500 جرام" },
      { name: "خبز برجر", amount: "4 حبات" }
    ],
    steps: ["تشكيل اللحم", "شواء اللحم", "تجهيز الساندوتش"],
    imageUrls: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800"],
    videoUrl: "https://www.youtube.com/watch?v=26-Burger",
    isPremium: false,
    status: 'approved',
    prepTime: "15 min",
    cookTime: "15 min",
    servings: "4"
  }
];

export const seedDatabase = async (force = false) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'recipes'));
    if (!querySnapshot.empty && !force) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database with high quality recipes...');
    for (const recipe of sampleRecipes) {
      await recipeService.addRecipe(recipe);
    }
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

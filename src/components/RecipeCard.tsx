import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, Crown, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserContext } from '../App';
import { userService } from '../services/dbService';
import { toast } from 'sonner';

interface RecipeCardProps {
  recipe: any;
  index?: number;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index = 0 }) => {
  const { user } = useContext(UserContext);
  const isFavorite = user?.favorites?.includes(recipe.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("يرجى تسجيل الدخول لحفظ الوصفات");
      return;
    }
    try {
      await userService.toggleFavorite(user.uid, recipe.id);
      toast.success(isFavorite ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
    } catch (error) {
      toast.error("فشل تحديث المفضلة");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <Link to={`/recipe/${recipe.id}`}>
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-4 shadow-sm border border-[#3D2B1F]/5">
          <img
            src={recipe.imageUrls?.[0] || `https://picsum.photos/seed/${recipe.id}/800/1000`}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex gap-2">
              {recipe.isPremium && (
                <div className="bg-[#C5A028] text-white p-2 rounded-xl shadow-xl backdrop-blur-md">
                  <Crown size={14} />
                </div>
              )}
              {recipe.videoUrl && (
                <div className="bg-white/20 backdrop-blur-md text-white p-2 rounded-xl shadow-xl">
                  <Play size={14} fill="currentColor" />
                </div>
              )}
            </div>
            
            <button 
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white shadow-lg' : 'bg-white/20 text-white hover:bg-white hover:text-red-500'}`}
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="flex gap-4 text-white/80 text-[10px] font-bold uppercase tracking-widest mb-2">
                <span className="flex items-center gap-1"><Clock size={12} /> {recipe.cookTime || '20m'}</span>
                <span className="flex items-center gap-1"><Users size={12} /> {recipe.servings || '2-4'}</span>
              </div>
              <h3 className="text-white text-xl font-serif mb-2">{recipe.title}</h3>
              <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">{recipe.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1 px-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{recipe.category || 'General'}</span>
            <span className="text-[10px] font-bold text-[#C5A028]">{recipe.origin}</span>
          </div>
          <h3 className="text-lg font-serif group-hover:text-[#C5A028] transition-colors line-clamp-1">{recipe.title}</h3>
        </div>
      </Link>
    </motion.div>
  );
};

export default RecipeCard;

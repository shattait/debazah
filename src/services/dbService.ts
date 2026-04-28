import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { db, auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const recipeService = {
  async addRecipe(recipeData: any) {
    const path = 'recipes';
    try {
      return await addDoc(collection(db, path), {
        ...recipeData,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateRecipe(recipeId: string, recipeData: any) {
    const path = `recipes/${recipeId}`;
    try {
      const docRef = doc(db, 'recipes', recipeId);
      await updateDoc(docRef, {
        ...recipeData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteRecipe(recipeId: string) {
    const path = `recipes/${recipeId}`;
    try {
      const docRef = doc(db, 'recipes', recipeId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeToRecipes(callback: (recipes: any[]) => void, errorCallback?: (error: any) => void) {
    const path = 'recipes';
    return onSnapshot(collection(db, path), (snapshot) => {
      const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(recipes);
    }, (error) => {
      if (errorCallback) {
        errorCallback(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    });
  },

  async addReview(recipeId: string, review: { userId: string, userName: string, userPhoto?: string, rating: number, comment: string }) {
    const path = `recipes/${recipeId}/reviews`;
    try {
      const reviewsCol = collection(db, 'recipes', recipeId, 'reviews');
      await addDoc(reviewsCol, {
        ...review,
        createdAt: Timestamp.now()
      });

      const recipeRef = doc(db, 'recipes', recipeId);
      const recipeSnap = await getDoc(recipeRef);
      if (recipeSnap.exists()) {
        const data = recipeSnap.data();
        const oldRating = data.rating || 0;
        const totalReviews = data.reviewsCount || 0;
        const newRating = ((oldRating * totalReviews) + review.rating) / (totalReviews + 1);
        
        await updateDoc(recipeRef, {
          rating: Number(newRating.toFixed(1)),
          reviewsCount: totalReviews + 1
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getReviews(recipeId: string) {
    const path = `recipes/${recipeId}/reviews`;
    try {
      const q = query(collection(db, 'recipes', recipeId, 'reviews'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};

export const userService = {
  async getUserProfile(uid: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.warn("User profile fetch failed", uid, error);
      return null; // Return null silently for UI to handle
    }
  },

  async createUserProfile(uid: string, profile: any) {
    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, 'users', uid), {
        ...profile,
        uid,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async isFirstUser() {
    const path = 'users';
    try {
      const q = query(collection(db, path), limit(1));
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error) {
      console.warn("Could not check if first user", error);
      return false;
    }
  },

  async updateChefStats(uid: string, stats: { rating?: number; followersCount?: number; recipesCount?: number; earnings?: number }) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...stats,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async listChefs() {
    const path = 'users';
    try {
      const q = query(collection(db, path), where('role', '==', 'chef'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async listUsers() {
    const path = 'users';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async updateUserSubscription(uid: string, subscription: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        subscription,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateUserProfile(uid: string, data: any) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async applyForChef(uid: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        role: 'chef',
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async registerWithEmail(email: string, pass: string, name: string, role: string = 'user') {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Send standard firebase verification email
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn("Verification email failed to send", e);
    }

    const referredBy = sessionStorage.getItem('referralCode');
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: name,
      role: role,
      isPremium: false,
      viewedRecipes: [],
      referredBy: referredBy || null,
      createdAt: Timestamp.now()
    });

    if (referredBy) {
      // Record conversion if needed immediately or just link them
      // For now we just link them. Commissions can be paid on subscription.
    }

    return user;
  },

  async loginWithEmail(email: string, pass: string) {
    return await signInWithEmailAndPassword(auth, email, pass);
  },

  async logout() {
    return await signOut(auth);
  },

  async resendVerification() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  },

  async resetPassword(email: string) {
    return await sendPasswordResetEmail(auth, email);
  },

  async trackRecipeView(uid: string, recipeId: string) {
    const docRef = doc(db, 'users', uid);
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    const viewed = data.viewedRecipes || [];
    if (!viewed.includes(recipeId)) {
      await updateDoc(docRef, {
        viewedRecipes: arrayUnion(recipeId)
      });
    }
  },

  async toggleFavorite(uid: string, recipeId: string) {
    const docRef = doc(db, 'users', uid);
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    const favorites = data.favorites || [];
    const isFavorite = favorites.includes(recipeId);

    if (isFavorite) {
      await updateDoc(docRef, {
        favorites: favorites.filter((id: string) => id !== recipeId)
      });
    } else {
      await updateDoc(docRef, {
        favorites: arrayUnion(recipeId)
      });
    }
    return !isFavorite;
  },

  async getFavoriteRecipes(uid: string) {
    const docRef = doc(db, 'users', uid);
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) return [];

    const favoritesIds = userDoc.data().favorites || [];
    if (favoritesIds.length === 0) return [];

    const recipes: any[] = [];
    for (const id of favoritesIds) {
      const rDoc = await getDoc(doc(db, 'recipes', id));
      if (rDoc.exists()) {
        recipes.push({ id: rDoc.id, ...rDoc.data() });
      }
    }
    return recipes;
  },

  async getViewedRecipes(uid: string) {
    const docRef = doc(db, 'users', uid);
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) return [];

    // Return last 10 viewed
    const viewedIds = (userDoc.data().viewedRecipes || []).slice(-10).reverse();
    if (viewedIds.length === 0) return [];

    const recipes: any[] = [];
    for (const id of viewedIds) {
      const rDoc = await getDoc(doc(db, 'recipes', id));
      if (rDoc.exists()) {
        recipes.push({ id: rDoc.id, ...rDoc.data() });
      }
    }
    return recipes;
  },

  subscribeToUserProfile(uid: string, callback: (profile: any) => void) {
    const path = `users/${uid}`;
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  }
};

export const affiliateService = {
  async joinProgram(uid: string, country: string, paypalEmail: string) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        "affiliateData.isAffiliate": true,
        "affiliateData.status": 'active',
        "affiliateData.referralCode": uid,
        "affiliateData.country": country,
        "affiliateData.totalEarnings": 0,
        "affiliateData.pendingEarnings": 0,
        "affiliateData.clicks": 0,
        "affiliateData.conversions": 0,
        "paypalEmail": paypalEmail,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateAffiliateStatus(uid: string, status: 'active' | 'paused') {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        "affiliateData.status": status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async trackClick(referralCode: string) {
    const path = `users/${referralCode}`;
    try {
      const docRef = doc(db, 'users', referralCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.affiliateData?.isAffiliate && data.affiliateData?.status !== 'paused') {
          await updateDoc(docRef, {
            "affiliateData.clicks": (data.affiliateData.clicks || 0) + 1
          });
        }
      }
    } catch (error) {
      console.warn("Could not track affiliate click", error);
    }
  },

  async recordReferral(referrerId: string, referredId: string, commissionAmount: number) {
    const path = 'referrals';
    try {
      await addDoc(collection(db, path), {
        referrerId,
        referredUserId: referredId,
        amount: commissionAmount,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      const referrerRef = doc(db, 'users', referrerId);
      const referrerSnap = await getDoc(referrerRef);
      if (referrerSnap.exists()) {
        const data = referrerSnap.data();
        await updateDoc(referrerRef, {
          "affiliateData.conversions": (data.affiliateData?.conversions || 0) + 1,
          "affiliateData.pendingEarnings": (data.affiliateData?.pendingEarnings || 0) + commissionAmount
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getReferralStats(uid: string) {
    const path = 'referrals';
    try {
      const q = query(collection(db, path), where('referrerId', '==', uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async markReferralAsPaid(referralId: string) {
    const path = `referrals/${referralId}`;
    try {
      const docRef = doc(db, 'referrals', referralId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const refData = docSnap.data();
        if (refData.status === 'pending') {
          await updateDoc(docRef, { 
            status: 'paid',
            updatedAt: Timestamp.now()
          });

          // Move pending to total earnings for the referrer
          const referrerRef = doc(db, 'users', refData.referrerId);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
            const userData = referrerSnap.data();
            await updateDoc(referrerRef, {
              "affiliateData.pendingEarnings": (userData.affiliateData?.pendingEarnings || 0) - refData.amount,
              "affiliateData.totalEarnings": (userData.affiliateData?.totalEarnings || 0) + refData.amount
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async listAllReferrals() {
    const path = 'referrals';
    try {
      const q = query(collection(db, path), limit(100)); // limit for safety
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};

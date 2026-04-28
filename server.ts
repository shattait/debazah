import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";
import fs from "fs";

// Firebase
import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth as getClientAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = fs.existsSync(firebaseConfigPath) 
  ? JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8")) 
  : null;

// Initialize Firebase Client (for server-side auth proxy)
const clientApp = firebaseConfig ? initializeClientApp(firebaseConfig) : null;
const clientAuth = clientApp ? getClientAuth(clientApp) : null;
const db = clientApp ? getFirestore(clientApp, firebaseConfig.firestoreDatabaseId) : null;

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes for Flutter ---

  // 1. Auth Endpoint
  app.post("/api/auth/login", async (req, res) => {
    if (!clientAuth) return res.status(500).json({ error: "Firebase not configured" });
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db!, "users", user.uid));
      const profile = userDoc.exists() ? userDoc.data() : null;

      res.json({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        token: await user.getIdToken(),
        profile
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  // 2. Recipes Endpoint
  app.get("/api/recipes", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    
    try {
      const querySnapshot = await getDocs(collection(db, "recipes"));
      const recipes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.json(recipes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    
    try {
      const recipeDoc = await getDoc(doc(db, "recipes", req.params.id));
      if (!recipeDoc.exists()) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json({ id: recipeDoc.id, ...recipeDoc.data() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Products/Marketplace Endpoint
  app.get("/api/products", async (req, res) => {
    if (!db) return res.status(500).json({ error: "Firebase not configured" });
    
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If empty, return the mock data for current demo
      if (products.length === 0) {
        return res.json([
          { id: '1', name: 'Professional Chef Knife', price: 120, category: 'Knives', imageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800' },
          { id: '2', name: 'Cast Iron Skillet', price: 85, category: 'Cookware', imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=800' },
          { id: '3', name: 'Digital Kitchen Scale', price: 25, category: 'Tools', imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800' },
          { id: '4', name: 'Arabic Coffee Pot (Dallah)', price: 45, category: 'Traditional', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800' },
        ]);
      }

      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Stripe API ---
  app.post("/api/stripe/create-checkout", async (req, res) => {
    console.log("Received Stripe checkout request:", req.body);
    if (!stripe) {
      console.error("Stripe error: STRIPE_SECRET_KEY is missing");
      return res.status(500).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to Secrets." });
    }
    try {
      const { planId, successUrl, cancelUrl } = req.body;
      console.log(`Creating session for plan: ${planId}`);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: planId === "premium" ? "باقة ديبازة المميزة" : "باقة الشيف المحترف",
                description: planId === "premium" ? "وصول كامل للوصفات والمميزات الذكية" : "إمكانية نشر الوصفات وتحقيق أرباح",
              },
              unit_amount: planId === "premium" ? 999 : 2499,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${successUrl}&planId=${planId}`,
        cancel_url: cancelUrl,
      });
      console.log("Stripe session created successfully:", session.id);
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe session creation failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Health Check ---
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      stripeConfigured: !!stripe
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

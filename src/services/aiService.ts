import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getIngredientAlternatives(ingredient: string, country: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest 3 alternative ingredients for "${ingredient}" available in ${country}. Also suggest local stores or types of stores where they can be found. Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          alternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING },
                stores: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
}

export async function getShoppingSuggestions(ingredients: string[], country: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `For each of these ingredients: ${ingredients.join(", ")}, suggest 2-3 specific local stores or major retailers in ${country} where they can be purchased. Also provide a price estimate (low, medium, high) and a direct link or search query. Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ingredient: { type: Type.STRING },
                stores: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      priceRange: { type: Type.STRING },
                      searchLink: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateRecipeInsights(recipeTitle: string, ingredients: string[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide nutritional insights and cooking tips for a recipe titled "${recipeTitle}" with ingredients: ${ingredients.join(", ")}. Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nutritionalInfo: { type: Type.STRING },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
          difficulty: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
}

export async function getProductSuggestions(country: string, availableProducts: any[]) {
  const productList = availableProducts.map(p => `${p.name} (${p.category})`).join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the user's location (${country}) and these available products in our store: ${productList}, suggest 3 specific products that would be most relevant or popular. Provide a reason for each recommendation based on local culture or kitchen needs. Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateRecipeFromPrompt(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract/Translate a detailed recipe from the following description or video context: "${prompt}". 
    IMPORTANT: ALL generated fields (title, description, ingredients, steps) MUST be in Arabic language.
    The extraction must include: title, description, category, origin (Khaliji, Shami, Egyptian, European, Asian, or Global), 
    prepTime, cookTime, a list of ingredients (with name and amount), and a list of step-by-step instructions. 
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          origin: { type: Type.STRING },
          prepTime: { type: Type.STRING },
          cookTime: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING }
              }
            }
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
}

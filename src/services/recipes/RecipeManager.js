/**
 * Recipe Manager
 * Manages recipes, food costing, and menu engineering
 */

class RecipeManager {
  constructor() {
    this.recipes = new Map(); // recipeId -> recipe object
    this.ingredients = new Map(); // ingredientId -> ingredient object
    this.storageKey = 'recipe_data';
    this.listeners = new Set();
    this.loadRecipes();
  }

  /**
   * Load recipes from localStorage
   */
  loadRecipes() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        data.recipes?.forEach(recipe => this.recipes.set(recipe.id, recipe));
        data.ingredients?.forEach(ingredient => this.ingredients.set(ingredient.id, ingredient));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  }

  /**
   * Save recipes to localStorage
   */
  saveRecipes() {
    try {
      const data = {
        recipes: Array.from(this.recipes.values()),
        ingredients: Array.from(this.ingredients.values())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  }

  /**
   * Add ingredient
   */
  addIngredient(ingredientData) {
    const ingredient = {
      id: ingredientData.id || `ING-${Date.now()}`,
      name: ingredientData.name,
      unit: ingredientData.unit || 'kg', // kg, g, l, ml, pcs
      costPerUnit: ingredientData.costPerUnit || 0,
      supplier: ingredientData.supplier || '',
      category: ingredientData.category || '',
      isActive: ingredientData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.ingredients.set(ingredient.id, ingredient);
    this.saveRecipes();
    this.emit('ingredient_added', ingredient);
    
    return ingredient;
  }

  /**
   * Update ingredient
   */
  updateIngredient(ingredientId, updates) {
    const ingredient = this.ingredients.get(ingredientId);
    if (!ingredient) {
      throw new Error(`Ingredient ${ingredientId} not found`);
    }

    const updatedIngredient = {
      ...ingredient,
      ...updates,
      id: ingredientId,
      updatedAt: new Date().toISOString()
    };

    this.ingredients.set(ingredientId, updatedIngredient);
    this.saveRecipes();
    this.emit('ingredient_updated', updatedIngredient);
    
    return updatedIngredient;
  }

  /**
   * Delete ingredient
   */
  deleteIngredient(ingredientId) {
    this.ingredients.delete(ingredientId);
    this.saveRecipes();
    this.emit('ingredient_deleted', { ingredientId });
    return { success: true };
  }

  /**
   * Add recipe
   */
  addRecipe(recipeData) {
    const recipe = {
      id: recipeData.id || `REC-${Date.now()}`,
      name: recipeData.name,
      menuItemId: recipeData.menuItemId || null, // Link to menu item
      ingredients: recipeData.ingredients || [], // [{ingredientId, quantity, unit}]
      instructions: recipeData.instructions || '',
      preparationTime: recipeData.preparationTime || 0,
      portionSize: recipeData.portionSize || 1,
      category: recipeData.category || '',
      isActive: recipeData.isActive !== false,
      version: 1,
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calculate initial food cost
    recipe.foodCost = this.calculateRecipeCost(recipe);
    recipe.profitMargin = this.calculateProfitMargin(recipe, recipeData.sellingPrice || 0);

    this.recipes.set(recipe.id, recipe);
    this.saveRecipes();
    this.emit('recipe_added', recipe);
    
    return recipe;
  }

  /**
   * Update recipe
   */
  updateRecipe(recipeId, updates) {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      throw new Error(`Recipe ${recipeId} not found`);
    }

    // Save version if ingredients changed
    if (updates.ingredients && JSON.stringify(updates.ingredients) !== JSON.stringify(recipe.ingredients)) {
      recipe.versions.push({
        version: recipe.version,
        ingredients: recipe.ingredients,
        foodCost: recipe.foodCost,
        savedAt: new Date().toISOString()
      });
      recipe.version++;
    }

    const updatedRecipe = {
      ...recipe,
      ...updates,
      id: recipeId,
      foodCost: this.calculateRecipeCost({ ...recipe, ...updates }),
      updatedAt: new Date().toISOString()
    };

    if (updates.sellingPrice !== undefined) {
      updatedRecipe.profitMargin = this.calculateProfitMargin(updatedRecipe, updates.sellingPrice);
    }

    this.recipes.set(recipeId, updatedRecipe);
    this.saveRecipes();
    this.emit('recipe_updated', updatedRecipe);
    
    return updatedRecipe;
  }

  /**
   * Delete recipe
   */
  deleteRecipe(recipeId) {
    this.recipes.delete(recipeId);
    this.saveRecipes();
    this.emit('recipe_deleted', { recipeId });
    return { success: true };
  }

  /**
   * Calculate recipe cost
   */
  calculateRecipeCost(recipe) {
    let totalCost = 0;

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = this.ingredients.get(recipeIngredient.ingredientId);
      if (ingredient) {
        const unitCost = ingredient.costPerUnit;
        const quantity = recipeIngredient.quantity;
        totalCost += unitCost * quantity;
      }
    }

    return totalCost;
  }

  /**
   * Calculate profit margin
   */
  calculateProfitMargin(recipe, sellingPrice) {
    if (!sellingPrice || sellingPrice === 0) return 0;
    const foodCost = this.calculateRecipeCost(recipe);
    const margin = ((sellingPrice - foodCost) / sellingPrice) * 100;
    return Math.max(0, margin);
  }

  /**
   * Get cost variance (compare with standard cost)
   */
  getCostVariance(recipeId, actualCost) {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return null;

    const standardCost = recipe.foodCost;
    const variance = actualCost - standardCost;
    const variancePercent = standardCost > 0 ? (variance / standardCost) * 100 : 0;

    return {
      standardCost,
      actualCost,
      variance,
      variancePercent
    };
  }

  /**
   * Get recipe by ID
   */
  getRecipe(recipeId) {
    return this.recipes.get(recipeId);
  }

  /**
   * Get recipe by menu item ID
   */
  getRecipeByMenuItem(menuItemId) {
    return Array.from(this.recipes.values()).find(r => r.menuItemId === menuItemId);
  }

  /**
   * Get all recipes
   */
  getAllRecipes() {
    return Array.from(this.recipes.values());
  }

  /**
   * Get all ingredients
   */
  getAllIngredients() {
    return Array.from(this.ingredients.values());
  }

  /**
   * Get menu engineering insights
   */
  getMenuEngineeringInsights(salesData) {
    // salesData format: [{ menuItemId, quantitySold, revenue }]
    const insights = [];

    for (const recipe of this.recipes.values()) {
      if (!recipe.menuItemId) continue;

      const sales = salesData.find(s => s.menuItemId === recipe.menuItemId);
      if (!sales) continue;

      const foodCostPercentage = (recipe.foodCost / (sales.revenue / sales.quantitySold)) * 100;
      const contributionMargin = (sales.revenue / sales.quantitySold) - recipe.foodCost;
      const totalContribution = contributionMargin * sales.quantitySold;

      insights.push({
        menuItemId: recipe.menuItemId,
        name: recipe.name,
        quantitySold: sales.quantitySold,
        revenue: sales.revenue,
        foodCost: recipe.foodCost,
        foodCostPercentage,
        contributionMargin,
        totalContribution,
        profitMargin: recipe.profitMargin,
        category: recipe.category
      });
    }

    // Sort by total contribution (highest first)
    insights.sort((a, b) => b.totalContribution - a.totalContribution);

    return insights;
  }

  /**
   * Get high-margin items (profit margin > 70%)
   */
  getHighMarginItems() {
    return this.getAllRecipes().filter(r => r.profitMargin > 70);
  }

  /**
   * Get low-margin items (profit margin < 30%)
   */
  getLowMarginItems() {
    return this.getAllRecipes().filter(r => r.profitMargin < 30 && r.profitMargin > 0);
  }

  /**
   * Get recipe versions
   */
  getRecipeVersions(recipeId) {
    const recipe = this.recipes.get(recipeId);
    return recipe?.versions || [];
  }

  /**
   * Restore recipe version
   */
  restoreRecipeVersion(recipeId, versionNumber) {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      throw new Error(`Recipe ${recipeId} not found`);
    }

    const version = recipe.versions.find(v => v.version === versionNumber);
    if (!version) {
      throw new Error(`Version ${versionNumber} not found`);
    }

    return this.updateRecipe(recipeId, {
      ingredients: version.ingredients,
      foodCost: version.foodCost
    });
  }

  /**
   * Get ingredient usage across recipes
   */
  getIngredientUsage(ingredientId) {
    const usage = [];

    for (const recipe of this.recipes.values()) {
      const recipeIngredient = recipe.ingredients.find(i => i.ingredientId === ingredientId);
      if (recipeIngredient) {
        usage.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          quantity: recipeIngredient.quantity,
          unit: recipeIngredient.unit
        });
      }
    }

    return usage;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const recipes = this.getAllRecipes();
    const ingredients = this.getAllIngredients();

    return {
      totalRecipes: recipes.length,
      activeRecipes: recipes.filter(r => r.isActive).length,
      totalIngredients: ingredients.length,
      activeIngredients: ingredients.filter(i => i.isActive).length,
      averageFoodCostPercentage: recipes.length > 0 
        ? recipes.reduce((sum, r) => sum + (r.foodCost / 100), 0) / recipes.length 
        : 0,
      highMarginItems: this.getHighMarginItems().length,
      lowMarginItems: this.getLowMarginItems().length
    };
  }

  /**
   * Event listener management
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

// Singleton instance
let recipeManagerInstance = null;

export function getRecipeManager() {
  if (!recipeManagerInstance) {
    recipeManagerInstance = new RecipeManager();
  }
  return recipeManagerInstance;
}

export default RecipeManager;

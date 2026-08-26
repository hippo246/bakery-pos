// Recipe Cost Calculation System

export const RecipeStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft'
};

export const CostType = {
  INGREDIENT: 'ingredient',
  LABOR: 'labor',
  OVERHEAD: 'overhead',
  PACKAGING: 'packaging'
};

class RecipeCostManager {
  constructor() {
    this.recipes = [];
    this.costHistory = [];
    this.loadFromStorage();
  }

  // Load recipes from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedRecipes = localStorage.getItem('recipes');
        const storedHistory = localStorage.getItem('cost_history');
        
        if (storedRecipes) {
          this.recipes = JSON.parse(storedRecipes);
        }
        if (storedHistory) {
          this.costHistory = JSON.parse(storedHistory);
        }
      }
    } catch (error) {
      console.error('Error loading recipe data:', error);
    }
  }

  // Save recipes to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('recipes', JSON.stringify(this.recipes));
        localStorage.setItem('cost_history', JSON.stringify(this.costHistory));
      }
    } catch (error) {
      console.error('Error saving recipe data:', error);
    }
  }

  // Create new recipe
  createRecipe(recipeData) {
    const recipe = {
      id: this.generateId(),
      ...recipeData,
      status: recipeData.status || RecipeStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ingredients: recipeData.ingredients || [],
      laborCost: recipeData.laborCost || 0,
      overheadCost: recipeData.overheadCost || 0,
      packagingCost: recipeData.packagingCost || 0,
      totalCost: 0,
      costPerServing: 0,
      profitMargin: 0,
      foodCostPercentage: 0
    };

    // Calculate costs
    const calculatedCosts = this.calculateRecipeCosts(recipe);
    Object.assign(recipe, calculatedCosts);

    this.recipes.push(recipe);
    this.saveToStorage();
    
    return recipe;
  }

  // Update recipe
  updateRecipe(recipeId, updates) {
    const index = this.recipes.findIndex(r => r.id === recipeId);
    if (index === -1) {
      throw new Error('Recipe not found');
    }

    const oldRecipe = { ...this.recipes[index] };
    this.recipes[index] = {
      ...this.recipes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Recalculate costs if ingredients or costs changed
    if (updates.ingredients || updates.laborCost !== undefined || 
        updates.overheadCost !== undefined || updates.packagingCost !== undefined) {
      const calculatedCosts = this.calculateRecipeCosts(this.recipes[index]);
      Object.assign(this.recipes[index], calculatedCosts);
    }

    // Record cost change
    this.recordCostChange(oldRecipe, this.recipes[index]);

    this.saveToStorage();
    return this.recipes[index];
  }

  // Delete recipe
  deleteRecipe(recipeId) {
    const index = this.recipes.findIndex(r => r.id === recipeId);
    if (index === -1) {
      throw new Error('Recipe not found');
    }

    this.recipes.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get recipe by ID
  getRecipe(recipeId) {
    return this.recipes.find(r => r.id === recipeId);
  }

  // Get recipe by menu item
  getRecipeByMenuItem(menuItemId) {
    return this.recipes.find(r => r.menuItemId === menuItemId);
  }

  // Get all recipes
  getAllRecipes(filters = {}) {
    let filtered = [...this.recipes];

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    if (filters.menuItemId) {
      filtered = filtered.filter(r => r.menuItemId === filters.menuItemId);
    }

    return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  // Calculate recipe costs
  calculateRecipeCosts(recipe) {
    const ingredientCost = recipe.ingredients.reduce((sum, ing) => {
      return sum + (ing.quantity * ing.unitCost);
    }, 0);

    const totalCost = ingredientCost + 
                     (recipe.laborCost || 0) + 
                     (recipe.overheadCost || 0) + 
                     (recipe.packagingCost || 0);

    const servings = recipe.servings || 1;
    const costPerServing = totalCost / servings;

    const sellingPrice = recipe.sellingPrice || 0;
    const profitMargin = sellingPrice > 0 ? ((sellingPrice - costPerServing) / sellingPrice) * 100 : 0;
    const foodCostPercentage = sellingPrice > 0 ? (costPerServing / sellingPrice) * 100 : 0;

    return {
      ingredientCost,
      totalCost,
      costPerServing,
      profitMargin,
      foodCostPercentage
    };
  }

  // Add ingredient to recipe
  addIngredient(recipeId, ingredient) {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const newIngredient = {
      id: this.generateId(),
      ...ingredient,
      addedAt: new Date().toISOString()
    };

    recipe.ingredients.push(newIngredient);
    return this.updateRecipe(recipeId, { ingredients: recipe.ingredients });
  }

  // Update ingredient in recipe
  updateIngredient(recipeId, ingredientId, updates) {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }

    const index = recipe.ingredients.findIndex(ing => ing.id === ingredientId);
    if (index === -1) {
      throw new Error('Ingredient not found in recipe');
    }

    recipe.ingredients[index] = {
      ...recipe.ingredients[index],
      ...updates
    };

    return this.updateRecipe(recipeId, { ingredients: recipe.ingredients });
  }

  // Remove ingredient from recipe
  removeIngredient(recipeId, ingredientId) {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }

    recipe.ingredients = recipe.ingredients.filter(ing => ing.id !== ingredientId);
    return this.updateRecipe(recipeId, { ingredients: recipe.ingredients });
  }

  // Record cost change for tracking
  recordCostChange(oldRecipe, newRecipe) {
    const change = {
      id: this.generateId(),
      recipeId: oldRecipe.id,
      recipeName: oldRecipe.name,
      oldCost: oldRecipe.costPerServing,
      newCost: newRecipe.costPerServing,
      changeAmount: newRecipe.costPerServing - oldRecipe.costPerServing,
      changePercentage: oldRecipe.costPerServing > 0 
        ? ((newRecipe.costPerServing - oldRecipe.costPerServing) / oldRecipe.costPerServing) * 100 
        : 0,
      timestamp: new Date().toISOString(),
      changedBy: 'system'
    };

    this.costHistory.push(change);
    
    // Keep only last 1000 cost changes
    if (this.costHistory.length > 1000) {
      this.costHistory = this.costHistory.slice(-1000);
    }
  }

  // Get cost history for a recipe
  getCostHistory(recipeId) {
    return this.costHistory.filter(h => h.recipeId === recipeId);
  }

  // Get recipes with high food cost percentage
  getHighCostRecipes(threshold = 40) {
    return this.recipes.filter(r => r.foodCostPercentage > threshold && r.status === RecipeStatus.ACTIVE);
  }

  // Get recipes with low profit margin
  getLowProfitRecipes(threshold = 20) {
    return this.recipes.filter(r => r.profitMargin < threshold && r.status === RecipeStatus.ACTIVE);
  }

  // Get cost breakdown by type
  getCostBreakdown(recipeId) {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) return null;

    const ingredientCost = recipe.ingredients.reduce((sum, ing) => {
      return sum + (ing.quantity * ing.unitCost);
    }, 0);

    return {
      ingredient: ingredientCost,
      labor: recipe.laborCost || 0,
      overhead: recipe.overheadCost || 0,
      packaging: recipe.packagingCost || 0,
      total: recipe.totalCost,
      percentages: {
        ingredient: recipe.totalCost > 0 ? (ingredientCost / recipe.totalCost) * 100 : 0,
        labor: recipe.totalCost > 0 ? ((recipe.laborCost || 0) / recipe.totalCost) * 100 : 0,
        overhead: recipe.totalCost > 0 ? ((recipe.overheadCost || 0) / recipe.totalCost) * 100 : 0,
        packaging: recipe.totalCost > 0 ? ((recipe.packagingCost || 0) / recipe.totalCost) * 100 : 0
      }
    };
  }

  // Get ingredient usage across all recipes
  getIngredientUsage(ingredientId) {
    const usage = [];
    
    this.recipes.forEach(recipe => {
      const ingredient = recipe.ingredients.find(ing => ing.ingredientId === ingredientId);
      if (ingredient) {
        usage.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          unitCost: ingredient.unitCost
        });
      }
    });

    return usage;
  }

  // Calculate menu item cost from recipe
  calculateMenuItemCost(menuItemId) {
    const recipe = this.getRecipeByMenuItem(menuItemId);
    if (!recipe) {
      return null;
    }

    return {
      costPerServing: recipe.costPerServing,
      totalCost: recipe.totalCost,
      foodCostPercentage: recipe.foodCostPercentage,
      profitMargin: recipe.profitMargin
    };
  }

  // Get cost analysis report
  getCostAnalysisReport() {
    const activeRecipes = this.recipes.filter(r => r.status === RecipeStatus.ACTIVE);
    
    const totalIngredientCost = activeRecipes.reduce((sum, r) => sum + r.ingredientCost, 0);
    const totalLaborCost = activeRecipes.reduce((sum, r) => sum + (r.laborCost || 0), 0);
    const totalOverheadCost = activeRecipes.reduce((sum, r) => sum + (r.overheadCost || 0), 0);
    const totalPackagingCost = activeRecipes.reduce((sum, r) => sum + (r.packagingCost || 0), 0);
    const totalCost = activeRecipes.reduce((sum, r) => sum + r.totalCost, 0);

    const avgFoodCostPercentage = activeRecipes.length > 0 
      ? activeRecipes.reduce((sum, r) => sum + r.foodCostPercentage, 0) / activeRecipes.length 
      : 0;

    const avgProfitMargin = activeRecipes.length > 0 
      ? activeRecipes.reduce((sum, r) => sum + r.profitMargin, 0) / activeRecipes.length 
      : 0;

    return {
      summary: {
        totalRecipes: activeRecipes.length,
        totalCost,
        avgFoodCostPercentage,
        avgProfitMargin
      },
      costBreakdown: {
        ingredient: totalIngredientCost,
        labor: totalLaborCost,
        overhead: totalOverheadCost,
        packaging: totalPackagingCost
      },
      highCostRecipes: this.getHighCostRecipes(),
      lowProfitRecipes: this.getLowProfitRecipes(),
      recentCostChanges: this.costHistory.slice(-10).reverse()
    };
  }

  // Generate unique ID
  generateId() {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export recipes as CSV
  exportToCSV() {
    const headers = ['ID', 'Name', 'Menu Item ID', 'Servings', 'Total Cost', 'Cost Per Serving', 'Selling Price', 'Food Cost %', 'Profit Margin %', 'Status'];
    const rows = this.recipes.map(r => [
      r.id,
      r.name,
      r.menuItemId || 'N/A',
      r.servings,
      r.totalCost.toFixed(2),
      r.costPerServing.toFixed(2),
      r.sellingPrice || 'N/A',
      r.foodCostPercentage.toFixed(2),
      r.profitMargin.toFixed(2),
      r.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Update ingredient costs in all recipes (when supplier prices change)
  updateIngredientCosts(ingredientId, newUnitCost) {
    let updated = 0;

    this.recipes.forEach(recipe => {
      const ingredient = recipe.ingredients.find(ing => ing.ingredientId === ingredientId);
      if (ingredient && ingredient.unitCost !== newUnitCost) {
        ingredient.unitCost = newUnitCost;
        updated++;
      }
    });

    if (updated > 0) {
      // Recalculate all affected recipes
      this.recipes.forEach(recipe => {
        const calculatedCosts = this.calculateRecipeCosts(recipe);
        Object.assign(recipe, calculatedCosts);
      });
      this.saveToStorage();
    }

    return updated;
  }
}

// Singleton instance
let recipeCostManager = null;

export const getRecipeCostManager = () => {
  if (!recipeCostManager) {
    recipeCostManager = new RecipeCostManager();
  }
  return recipeCostManager;
};

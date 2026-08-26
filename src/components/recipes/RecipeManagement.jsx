import React, { useState, useEffect } from 'react';
import { getRecipeManager } from '../../services/recipes/RecipeManager.js';

export default function RecipeManagement({ menuItems, inventory, onNavigate, darkMode = true }) {
  const recipeManager = getRecipeManager();
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [showMenuEngineering, setShowMenuEngineering] = useState(false);
  const [menuEngineeringData, setMenuEngineeringData] = useState([]);
  const [screenSize, setScreenSize] = useState('large');

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Load recipes and ingredients from RecipeManager
    setRecipes(recipeManager.getAllRecipes());
    setIngredients(recipeManager.getAllIngredients());

    // Add event listener for real-time updates
    const removeListener = recipeManager.addListener((event, data) => {
      if (event === 'recipe_added' || event === 'recipe_updated' || event === 'recipe_deleted') {
        setRecipes(recipeManager.getAllRecipes());
      }
      if (event === 'ingredient_added' || event === 'ingredient_updated' || event === 'ingredient_deleted') {
        setIngredients(recipeManager.getAllIngredients());
      }
    });

    return () => removeListener();
  }, [recipeManager]);

  const saveRecipes = (newRecipes) => {
    setRecipes(newRecipes);
    localStorage.setItem('bakerypos_recipes', JSON.stringify(newRecipes));
  };

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setShowForm(true);
  };

  const handleAddIngredient = () => {
    setEditingIngredient(null);
    setShowIngredientForm(true);
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setShowIngredientForm(true);
  };

  const handleSaveRecipe = (recipeData) => {
    if (editingRecipe) {
      recipeManager.updateRecipe(editingRecipe.id, recipeData);
    } else {
      recipeManager.addRecipe(recipeData);
    }
    setShowForm(false);
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = (recipeId) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      recipeManager.deleteRecipe(recipeId);
    }
  };

  const handleSaveIngredient = (ingredientData) => {
    if (editingIngredient) {
      recipeManager.updateIngredient(editingIngredient.id, ingredientData);
    } else {
      recipeManager.addIngredient(ingredientData);
    }
    setShowIngredientForm(false);
    setEditingIngredient(null);
  };

  const handleDeleteIngredient = (ingredientId) => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      recipeManager.deleteIngredient(ingredientId);
    }
  };

  const handleMenuEngineering = () => {
    // Read actual orders from localStorage or props to build real sales analysis metrics
    const ordersList = JSON.parse(localStorage.getItem('bakerypos_orders') || '[]');
    const actualSalesData = recipes.map(r => {
      let qty = 0;
      let rev = 0;
      ordersList.forEach(ord => {
        if (ord.status === 'COMPLETED') {
          ord.items?.forEach(item => {
            if (item.name === r.name || item.id === r.menuItemId) {
              qty += (item.qty || item.quantity || 1);
              rev += (item.price || 0) * (item.qty || item.quantity || 1);
            }
          });
        }
      });
      // Fallback to minimal positive value if there are zero sales so the math still works
      return {
        menuItemId: r.menuItemId,
        quantitySold: qty || 1,
        revenue: rev || (r.foodCost * 2.5)
      };
    });
    
    const insights = recipeManager.getMenuEngineeringInsights(actualSalesData);
    setMenuEngineeringData(insights);
    setShowMenuEngineering(true);
  };

  const stats = recipeManager.getStatistics();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: darkMode ? '#1a1a2e' : '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Content */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto', background: darkMode ? '#14142a' : '#f9fafb' }}>
        {showForm ? (
          <RecipeForm
            recipe={editingRecipe}
            inventory={inventory}
            menuItems={menuItems}
            onSave={handleSaveRecipe}
            onCancel={() => {
              setShowForm(false);
              setEditingRecipe(null);
            }}
          />
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: darkMode ? '#252538' : '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>Total Recipes</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>{stats.totalRecipes}</div>
              </div>
              <div style={{
                background: darkMode ? '#252538' : '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>Active Recipes</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{stats.activeRecipes}</div>
              </div>
              <div style={{
                background: darkMode ? '#252538' : '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>Ingredients</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>{stats.totalIngredients}</div>
              </div>
              <div style={{
                background: darkMode ? '#252538' : '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>High Margin Items</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{stats.highMarginItems}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={handleAddRecipe}
                style={{
                  padding: '12px 24px',
                  background: '#111827',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1f2937';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#111827';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                + Create Recipe
              </button>
              <button
                onClick={handleAddIngredient}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#4f46e5';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#6366f1';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                + Add Ingredient
              </button>
              <button
                onClick={handleMenuEngineering}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#059669';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                📊 Menu Engineering
              </button>
            </div>

            {/* Recipes List */}
            <div style={{
              background: darkMode ? '#252538' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              padding: '20px',
              marginBottom: '24px',
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '16px' }}>
                Recipe Library
              </div>
              {recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: darkMode ? '#8b8b9e' : '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: darkMode ? '#ffffff' : '#111827' }}>No recipes yet</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>Create your first recipe to get started</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {recipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onEdit={() => handleEditRecipe(recipe)}
                      onDelete={() => handleDeleteRecipe(recipe.id)}
                      onView={() => setSelectedRecipe(recipe)}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Ingredients List */}
            <div style={{
              background: darkMode ? '#252538' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              padding: '20px',
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '16px' }}>
                Ingredients Database
              </div>
              {ingredients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: darkMode ? '#8b8b9e' : '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥗</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: darkMode ? '#ffffff' : '#111827' }}>No ingredients yet</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>Add ingredients to build recipes</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Unit</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Cost/Unit</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Supplier</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map(ingredient => (
                        <tr key={ingredient.id} style={{ borderBottom: `1px solid ${darkMode ? '#252538' : '#f3f4f6'}` }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#ffffff' : '#111827', fontWeight: '500' }}>{ingredient.name}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>{ingredient.unit}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#ffffff' : '#111827', fontWeight: '600' }}>₹{ingredient.costPerUnit.toFixed(2)}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>{ingredient.supplier || '-'}</td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => handleEditIngredient(ingredient)}
                              style={{ padding: '6px 12px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginRight: '8px', transition: 'all 0.2s ease' }}
                              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteIngredient(ingredient.id)}
                              style={{ padding: '6px 12px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                              onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          darkMode={darkMode}
        />
      )}

      {/* Ingredient Form Modal */}
      {showIngredientForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', marginBottom: '20px' }}>
              {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
            </h3>
            <IngredientForm
              ingredient={editingIngredient}
              onSave={handleSaveIngredient}
              onCancel={() => {
                setShowIngredientForm(false);
                setEditingIngredient(null);
              }}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Menu Engineering Modal */}
      {showMenuEngineering && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '900px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', margin: 0 }}>
                📊 Menu Engineering Insights
              </h3>
              <button
                onClick={() => setShowMenuEngineering(false)}
                style={{ padding: '8px 12px', background: darkMode ? '#1a1a2e' : '#f3f4f6', color: darkMode ? '#ffffff' : '#111827', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#f3f4f6'}
              >
                ×
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Sold</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Revenue</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Food Cost</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Cost %</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Margin</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', textTransform: 'uppercase' }}>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {menuEngineeringData.map((item, index) => (
                    <tr key={item.menuItemId} style={{ borderBottom: index < menuEngineeringData.length - 1 ? `1px solid ${darkMode ? '#252538' : '#f3f4f6'}` : 'none' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#ffffff' : '#111827', fontWeight: '500' }}>{item.name}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>{item.quantitySold}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#ffffff' : '#111827', fontWeight: '600' }}>₹{item.revenue.toFixed(0)}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>₹{item.foodCost.toFixed(2)}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: item.foodCostPercentage > 35 ? '#ef4444' : '#10b981', fontWeight: '600' }}>{item.foodCostPercentage.toFixed(1)}%</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: item.profitMargin > 70 ? '#10b981' : item.profitMargin < 30 ? '#ef4444' : (darkMode ? '#8b8b9e' : '#8b8b9e'), fontWeight: '600' }}>{item.profitMargin.toFixed(1)}%</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: darkMode ? '#ffffff' : '#111827', fontWeight: '600' }}>₹{item.totalContribution.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IngredientForm({ ingredient, onSave, onCancel, darkMode = true }) {
  const [name, setName] = useState(ingredient?.name || '');
  const [unit, setUnit] = useState(ingredient?.unit || 'kg');
  const [costPerUnit, setCostPerUnit] = useState(ingredient?.costPerUnit || '');
  const [supplier, setSupplier] = useState(ingredient?.supplier || '');
  const [category, setCategory] = useState(ingredient?.category || '');
  const [isActive, setIsActive] = useState(ingredient?.isActive !== false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      unit,
      costPerUnit: parseFloat(costPerUnit) || 0,
      supplier,
      category,
      isActive
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#8b8b9e' : '#111827', marginBottom: '8px' }}>
            Ingredient Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              outline: 'none'
            }}
            placeholder="e.g., All-Purpose Flour"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#8b8b9e' : '#111827', marginBottom: '8px' }}>
            Unit *
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              outline: 'none'
            }}
          >
            <option value="kg">Kilogram (kg)</option>
            <option value="g">Gram (g)</option>
            <option value="l">Liter (l)</option>
            <option value="ml">Milliliter (ml)</option>
            <option value="pcs">Pieces (pcs)</option>
            <option value="dozen">Dozen</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#8b8b9e' : '#111827', marginBottom: '8px' }}>
            Cost per Unit *
          </label>
          <input
            type="number"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
            required
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              outline: 'none'
            }}
            placeholder="e.g., 45.00"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#8b8b9e' : '#111827', marginBottom: '8px' }}>
            Supplier
          </label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              outline: 'none'
            }}
            placeholder="e.g., Local Supplier"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#8b8b9e' : '#111827', marginBottom: '8px' }}>
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '8px',
              fontSize: '14px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              outline: 'none'
            }}
            placeholder="e.g., Dry Goods"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <label style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#111827' }}>Active Ingredient</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            background: darkMode ? '#1a1a2e' : '#f3f4f6',
            color: darkMode ? '#ffffff' : '#111827',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#e5e7eb'}
          onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#f3f4f6'}
        >
          Cancel        </button>
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            background: '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#4f46e5';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#6366f1';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {ingredient ? 'Update' : 'Add'} Ingredient
        </button>
      </div>
    </form>
  );
}

function StatCard({ label, value, icon, darkMode = true }) {
  return (
    <div style={{
      background: darkMode ? '#252538' : '#ffffff',
      border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '16px',
      flex: 1,
      minWidth: '150px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, onEdit, onDelete, onView, darkMode = true }) {
  return (
    <div style={{
      background: darkMode ? '#252538' : '#f9fafb',
      border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = darkMode ? '0 8px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)';
    }}>
      <div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '4px' }}>
          {recipe.name}
        </div>
        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px' }}>
          {recipe.ingredients?.length || 0} ingredients • {recipe.portions || 1} portions
        </div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
          Total Cost: ₹{recipe.totalCost?.toFixed(2) || '0.00'} • Cost/Portion: ₹{recipe.costPerPortion?.toFixed(2) || '0.00'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onView}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#1a1a2e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#111827',
            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#ffffff'}
        >
          View
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#1a1a2e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#111827',
            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#ffffff'}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#1a1a2e' : '#ffffff',
            color: '#dc2626',
            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = darkMode ? '#252538' : '#fef2f2';
            e.target.style.borderColor = darkMode ? '#dc2626' : '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = darkMode ? '#1a1a2e' : '#ffffff';
            e.target.style.borderColor = darkMode ? '#2d2d44' : '#d1d5db';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function RecipeForm({ recipe, inventory, menuItems, onSave, onCancel, darkMode = true }) {
  const [name, setName] = useState(recipe?.name || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [portions, setPortions] = useState(recipe?.portions || 1);
  const [ingredients, setIngredients] = useState(recipe?.ingredients || []);
  const [instructions, setInstructions] = useState(recipe?.instructions || '');
  const [category, setCategory] = useState(recipe?.category || '');
  const [active, setActive] = useState(recipe?.active !== false);

  const addIngredient = () => {
    setIngredients([...ingredients, { inventoryId: '', quantity: 1, unit: 'g' }]);
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const calculateCost = () => {
    let totalCost = 0;
    ingredients.forEach(ing => {
      const invItem = inventory.find(i => i.id === ing.inventoryId);
      if (invItem) {
        const unitCost = invItem.cost || 0;
        const quantity = ing.quantity || 0;
        totalCost += unitCost * quantity;
      }
    });
    return totalCost;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalCost = calculateCost();
    const costPerPortion = portions > 0 ? totalCost / portions : 0;
    
    onSave({
      name,
      description,
      portions,
      ingredients,
      instructions,
      category,
      active,
      totalCost,
      costPerPortion,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div style={{
      background: darkMode ? '#252538' : '#ffffff',
      borderRadius: '8px',
      border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '24px' }}>
        {recipe ? 'Edit Recipe' : 'Create New Recipe'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            Recipe Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            placeholder="e.g., Chocolate Croissant"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Brief description of the recipe"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="">Select category</option>
            <option value="Bakery">Bakery</option>
            <option value="Pastry">Pastry</option>
            <option value="Cake">Cake</option>
            <option value="Beverage">Beverage</option>
            <option value="Savory">Savory</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            Number of Portions *
          </label>
          <input
            type="number"
            value={portions}
            onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
            required
            min="1"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0' }}>
              Ingredients
            </label>
            <button
              type="button"
              onClick={addIngredient}
              style={{
                padding: '8px 16px',
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#1f2937';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#111827';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              + Add Ingredient
            </button>
          </div>
          {ingredients.map((ing, index) => (
            <div key={index} style={{
              background: darkMode ? '#1a1a2e' : '#f9fafb',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>
                    Ingredient
                  </label>
                  <select
                    value={ing.inventoryId}
                    onChange={(e) => updateIngredient(index, 'inventoryId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: darkMode ? '#252538' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select ingredient</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name} (₹{item.cost}/unit)</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: darkMode ? '#252538' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>
                    Unit
                  </label>
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: darkMode ? '#252538' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="pcs">pcs</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    style={{
                      padding: '10px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: '#dc2626',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = darkMode ? '#252538' : '#fef2f2';
                      e.target.style.borderColor = darkMode ? '#dc2626' : '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = darkMode ? '#1a1a2e' : '#ffffff';
                      e.target.style.borderColor = darkMode ? '#2d2d44' : '#d1d5db';
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Step-by-step cooking instructions"
          />
        </div>

        {/* Cost Summary */}
        <div style={{
          background: darkMode ? '#1a1a2e' : '#f0fdf4',
          border: `1px solid ${darkMode ? '#2d2d44' : '#059669'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '12px' }}>
            Cost Summary
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>Total Cost:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>₹{calculateCost().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>Cost per Portion:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>₹{(calculateCost() / portions).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0' }}>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            Active (available for use)
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#ffffff'}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1f2937';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#111827';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Save Recipe
          </button>
        </div>
      </form>
    </div>
  );
}

function RecipeDetailModal({ recipe, onClose, darkMode = true }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: darkMode ? '#252538' : '#ffffff',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>
            {recipe.name}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: darkMode ? '#1a1a2e' : '#f9fafb',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? '#252538' : '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#f9fafb'}
          >
            ✕
          </button>
        </div>

        {recipe.description && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>Description</div>
            <div style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#111827' }}>{recipe.description}</div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>Category</div>
          <div style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#111827' }}>{recipe.category || 'N/A'}</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px' }}>Portions</div>
          <div style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#111827' }}>{recipe.portions || 1}</div>
        </div>

        <div style={{
          marginBottom: '16px',
          padding: '16px',
          background: darkMode ? '#1a1a2e' : '#f0fdf4',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#2d2d44' : '#059669'}`
        }}>
          <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px' }}>Cost Information</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#111827' }}>Total Cost:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>₹{recipe.totalCost?.toFixed(2) || '0.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#111827' }}>Cost per Portion:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>₹{recipe.costPerPortion?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '12px' }}>
            Ingredients ({recipe.ingredients?.length || 0})
          </div>
          {recipe.ingredients?.map((ing, index) => (
            <div key={index} style={{
              padding: '12px',
              background: darkMode ? '#1a1a2e' : '#f9fafb',
              borderRadius: '6px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#111827' }}>
                {ing.quantity} {ing.unit} of ingredient
              </span>
            </div>
          ))}
        </div>

        {recipe.instructions && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '12px' }}>
              Instructions
            </div>
            <div style={{
              padding: '16px',
              background: darkMode ? '#1a1a2e' : '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: darkMode ? '#ffffff' : '#111827',
              whiteSpace: 'pre-wrap'
            }}>
              {recipe.instructions}
            </div>
          </div>
        )}

        <div style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#9ca3af', marginTop: '16px' }}>
          Last updated: {recipe.updatedAt ? new Date(recipe.updatedAt).toLocaleString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}

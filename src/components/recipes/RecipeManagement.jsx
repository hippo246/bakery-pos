import React, { useState, useEffect } from 'react';

export default function RecipeManagement({ menuItems, inventory, onNavigate }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

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
    // Load recipes from localStorage
    try {
      const savedRecipes = localStorage.getItem('bakerypos_recipes');
      if (savedRecipes) {
        setRecipes(JSON.parse(savedRecipes));
      }
    } catch (e) {
      console.error('Failed to load recipes:', e);
    }
  }, []);

  const saveRecipes = (newRecipes) => {
    setRecipes(newRecipes);
    localStorage.setItem('bakerypos_recipes', JSON.stringify(newRecipes));
  };

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setShowForm(true);
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteRecipe = (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      saveRecipes(recipes.filter(r => r.id !== recipeId));
    }
  };

  const handleSaveRecipe = (recipeData) => {
    if (editingRecipe) {
      saveRecipes(recipes.map(r => r.id === editingRecipe.id ? { ...recipeData, id: editingRecipe.id } : r));
    } else {
      saveRecipes([...recipes, { ...recipeData, id: Date.now() }]);
    }
    setShowForm(false);
    setEditingRecipe(null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: screenSize === 'small' ? '18px' : '20px',
              fontWeight: '600'
            }}>
              Recipe Management
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Create and manage recipes with food costing
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('menu')}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '12px' : '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto', background: '#f9fafb' }}>
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
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <StatCard label="Total Recipes" value={recipes.length} icon="📖" />
              <StatCard label="Active Recipes" value={recipes.filter(r => r.active).length} icon="✅" />
              <StatCard label="Avg Cost" value={`₹${recipes.length > 0 ? Math.round(recipes.reduce((sum, r) => sum + (r.totalCost || 0), 0) / recipes.length) : 0}`} icon="💰" />
            </div>

            {/* Add Recipe Button */}
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
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              + Create New Recipe
            </button>

            {/* Recipes List */}
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '20px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Recipe Library
              </div>
              {recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No recipes yet</div>
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
                    />
                  ))}
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
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      flex: 1,
      minWidth: '150px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, onEdit, onDelete, onView }) {
  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
          {recipe.name}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
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
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          View
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#dc2626',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function RecipeForm({ recipe, inventory, menuItems, onSave, onCancel }) {
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
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
        {recipe ? 'Edit Recipe' : 'Create New Recipe'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
            placeholder="e.g., Chocolate Croissant"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Brief description of the recipe"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
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
                cursor: 'pointer'
              }}
            >
              + Add Ingredient
            </button>
          </div>
          {ingredients.map((ing, index) => (
            <div key={index} style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Ingredient
                  </label>
                  <select
                    value={ing.inventoryId}
                    onChange={(e) => updateIngredient(index, 'inventoryId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
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
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
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
                      background: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    Unit
                  </label>
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
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
                      background: '#ffffff',
                      color: '#dc2626',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer'
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
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
          background: '#f0fdf4',
          border: '1px solid #059669',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Cost Summary
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Total Cost:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>₹{calculateCost().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Cost per Portion:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>₹{(calculateCost() / portions).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
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
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
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
              cursor: 'pointer'
            }}
          >
            Save Recipe
          </button>
        </div>
      </form>
    </div>
  );
}

function RecipeDetailModal({ recipe, onClose }) {
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
        background: '#ffffff',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            {recipe.name}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {recipe.description && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Description</div>
            <div style={{ fontSize: '14px', color: '#111827' }}>{recipe.description}</div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Category</div>
          <div style={{ fontSize: '14px', color: '#111827' }}>{recipe.category || 'N/A'}</div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Portions</div>
          <div style={{ fontSize: '14px', color: '#111827' }}>{recipe.portions || 1}</div>
        </div>

        <div style={{
          marginBottom: '16px',
          padding: '16px',
          background: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #059669'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Cost Information</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', color: '#111827' }}>Total Cost:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>₹{recipe.totalCost?.toFixed(2) || '0.00'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#111827' }}>Cost per Portion:</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>₹{recipe.costPerPortion?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Ingredients ({recipe.ingredients?.length || 0})
          </div>
          {recipe.ingredients?.map((ing, index) => (
            <div key={index} style={{
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '6px',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>
                {ing.quantity} {ing.unit} of ingredient
              </span>
            </div>
          ))}
        </div>

        {recipe.instructions && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Instructions
            </div>
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#111827',
              whiteSpace: 'pre-wrap'
            }}>
              {recipe.instructions}
            </div>
          </div>
        )}

        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
          Last updated: {recipe.updatedAt ? new Date(recipe.updatedAt).toLocaleString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}

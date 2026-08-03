// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Modifier Modal
 * Modal for selecting item modifiers/customizations
 */

import { btn } from "../../styles/theme";
import { MODIFIER_CATEGORIES, MENU_MODIFIER_MAP } from "../../data/constants.js";

function ModifierModal({ 
  isOpen, 
  onClose, 
  onApply, 
  onToggleModifier, 
  itemId, 
  menuItem, 
  selectedModifiers 
}) {
  if (!isOpen) return null;

  const applicableCategories = MENU_MODIFIER_MAP[menuItem.category] || [];
  const currentModifiers = selectedModifiers[itemId] || {};

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "var(--cafe-bg-card)",
        borderRadius: "var(--cafe-radius-lg)",
        padding: "var(--cafe-space-lg)",
        maxWidth: 500,
        width: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--cafe-space-lg)" }}>
          <div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>
              Customize {menuItem.name}
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
              Select modifiers
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", fontSize: 24, cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        {applicableCategories.map(categoryKey => {
          const category = MODIFIER_CATEGORIES[categoryKey];
          if (!category) return null;

          return (
            <div key={categoryKey} style={{ marginBottom: "var(--cafe-space-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--cafe-space-sm)" }}>
                <span style={{ fontSize: 18 }}>{category.icon}</span>
                <span style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {category.name}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--cafe-space-xs)" }}>
                {category.options.map(option => {
                  const isSelected = Array.isArray(currentModifiers[category.id.toLowerCase()])
                    ? currentModifiers[category.id.toLowerCase()].includes(option.id)
                    : currentModifiers[category.id.toLowerCase()] === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => onToggleModifier(itemId, category.id.toLowerCase(), option.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--cafe-space-sm)",
                        background: isSelected ? "var(--cafe-accent-dim)" : "var(--cafe-bg-surface)",
                        border: isSelected ? `1px solid var(--cafe-accent)` : `1px solid var(--cafe-border-light)`,
                        borderRadius: "var(--cafe-radius-sm)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "var(--cafe-font-sm)", color: isSelected ? "var(--cafe-accent)" : "var(--cafe-text-secondary)" }}>
                        {option.name}
                      </span>
                      {option.price !== 0 && (
                        <span style={{ fontSize: "var(--cafe-font-xs)", color: option.price > 0 ? "var(--cafe-success)" : "var(--cafe-warning)", fontFamily: "monospace" }}>
                          {option.price > 0 ? "+" : ""}₹{option.price}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", marginTop: "var(--cafe-space-lg)" }}>
          <button
            onClick={onClose}
            style={{ ...btn("ghost"), flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(itemId)}
            style={{ ...btn("primary"), flex: 1 }}
          >
            Apply Modifiers
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModifierModal;

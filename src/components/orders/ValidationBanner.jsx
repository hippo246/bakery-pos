// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Validation Banner
 * Displays validation errors and warnings for the current order
 */

import { alertBanner } from "../../styles/theme";

function ValidationBanner({ validationErrors, onDismiss: _onDismiss }) {
  const { errors, warnings } = validationErrors;
  
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: "var(--cafe-space-md)" }}>
      {errors.length > 0 && (
        <div style={{
          ...alertBanner("error"),
          marginBottom: warnings.length > 0 ? "var(--cafe-space-sm)" : 0
        }}>
          <div style={{ fontWeight: 700, marginBottom: "var(--cafe-space-xs)" }}>
            ⚠️ Cannot proceed - {errors.length} issue{errors.length > 1 ? 's' : ''}:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: "var(--cafe-font-sm)" }}>
            {errors.map((error, index) => (
              <li key={error.id || index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
      
      {warnings.length > 0 && (
        <div style={alertBanner("warning")}>
          <div style={{ fontWeight: 700, marginBottom: "var(--cafe-space-xs)" }}>
            ⚡ Warning - {warnings.length} issue{warnings.length > 1 ? 's' : ''}:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: "var(--cafe-font-sm)" }}>
            {warnings.map((warning, index) => (
              <li key={warning.id || index}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ValidationBanner;

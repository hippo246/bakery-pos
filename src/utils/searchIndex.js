// Search indexing utility for fast lookups

class SearchIndex {
  constructor() {
    this.index = new Map();
    this.documentMap = new Map();
  }

  // Add document to index
  addDocument(id, document, fields = []) {
    this.documentMap.set(id, document);
    
    fields.forEach(field => {
      const value = this.getFieldValue(document, field);
      if (value) {
        const tokens = this.tokenize(value);
        tokens.forEach(token => {
          if (!this.index.has(token)) {
            this.index.set(token, new Set());
          }
          this.index.get(token).add(id);
        });
      }
    });
  }

  // Remove document from index
  removeDocument(id) {
    this.documentMap.delete(id);
    this.index.forEach(set => set.delete(id));
  }

  // Search for documents
  search(query, fields = []) {
    const tokens = this.tokenize(query);
    const resultSets = tokens.map(token => this.index.get(token) || new Set());
    
    // Intersect all result sets (AND logic)
    const resultSet = resultSets.reduce((acc, set) => {
      return new Set([...acc].filter(id => set.has(id)));
    }, resultSets[0] || new Set());
    
    return Array.from(resultSet).map(id => this.documentMap.get(id));
  }

  // Get nested field value
  getFieldValue(document, field) {
    const parts = field.split('.');
    let value = document;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return value;
  }

  // Tokenize text for indexing
  tokenize(text) {
    if (typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  // Clear index
  clear() {
    this.index.clear();
    this.documentMap.clear();
  }

  // Get index statistics
  getStats() {
    return {
      totalDocuments: this.documentMap.size,
      totalTokens: this.index.size,
      avgTokensPerDoc: this.index.size / (this.documentMap.size || 1)
    };
  }
}

// Create singleton instances for different data types
export const menuSearchIndex = new SearchIndex();
export const customerSearchIndex = new SearchIndex();
export const orderSearchIndex = new SearchIndex();

// Rebuild index from data
export const rebuildMenuIndex = (menuItems) => {
  menuSearchIndex.clear();
  menuItems.forEach(item => {
    menuSearchIndex.addDocument(item.id, item, ['name', 'category', 'description']);
  });
};

export const rebuildCustomerIndex = (customers) => {
  customerSearchIndex.clear();
  customers.forEach(customer => {
    customerSearchIndex.addDocument(customer.id, customer, ['name', 'email', 'phone']);
  });
};

export const rebuildOrderIndex = (orders) => {
  orderSearchIndex.clear();
  orders.forEach(order => {
    orderSearchIndex.addDocument(order.id, order, ['customerName', 'invoiceNumber', 'status']);
  });
};

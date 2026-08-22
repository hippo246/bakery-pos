/**
 * Order Parser Service - Menu-aware order parsing from speech transcription
 * Converts natural language speech into structured order data (client-side only)
 */

class OrderParserService {
  constructor() {
    // No server dependency - client-side only
  }

  /**
   * Parse transcribed text into order structure (client-side only)
   * @param {string} text - Transcribed speech text
   * @param {Array} menuItems - Available menu items
   * @returns {Promise<Object>} Parsed order structure
   */
  async parseOrder(text, menuItems) {
    if (!text || !menuItems) {
      throw new Error('Missing text or menuItems');
    }

    // Preprocess text to clean up recognition errors
    const cleanedText = this._preprocessText(text);
    
    // Client-side parsing only (no server dependency)
    return this._parseOrderClientSide(cleanedText, menuItems);
  }

  /**
   * Preprocess text to clean up common recognition errors
   * @private
   */
  _preprocessText(text) {
    let cleaned = text.trim();
    
    // Remove common filler words and random additions (expanded list)
    const fillerWords = [
      'um', 'uh', 'like', 'you know', 'actually', 'basically',
      'just', 'really', 'very', 'kind of', 'sort of',
      'i mean', 'you see', 'well', 'so', 'but', 'and',
      'okay', 'alright', 'right', 'yeah', 'yes', 'no',
      'maybe', 'possibly', 'probably', 'literally', 'seriously',
      'honestly', 'frankly', 'basically', 'essentially'
    ];
    
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    // Remove repeated words (common recognition error)
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');
    
    // Remove random characters and symbols (keep more punctuation for better parsing)
    cleaned = cleaned.replace(/[^\w\s,.\-]/g, '');
    
    // Clean up extra spaces and punctuation
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/,\s*,/g, ','); // Remove duplicate commas
    cleaned = cleaned.replace(/,\s+/g, ', '); // Clean up comma spacing
    
    // Apply phonetic corrections for common misrecognitions
    cleaned = this._applyPhoneticCorrections(cleaned);
    
    // Final cleanup
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Apply phonetic corrections for common misrecognitions
   * @private
   */
  _applyPhoneticCorrections(text) {
    const corrections = {
      // Coffee-related - expanded
      'cappacuino': 'cappuccino',
      'capuchino': 'cappuccino',
      'cappucino': 'cappuccino',
      'cappuchino': 'cappuccino',
      'capachino': 'cappuccino',
      'capuchino': 'cappuccino',
      'cappachino': 'cappuccino',
      'cappuchino': 'cappuccino',
      'kapuchino': 'cappuccino',
      'kapuchinno': 'cappuccino',
      'cappucino': 'cappuccino',
      'cappuchinno': 'cappuccino',
      'cappuchin': 'cappuccino',
      'capucino': 'cappuccino',
      'capuchin': 'cappuccino',
      'expresso': 'espresso',
      'espreso': 'espresso',
      'expreso': 'espresso',
      'espress': 'espresso',
      'latte': 'latte',
      'latté': 'latte',
      'latt': 'latte',
      'mocha': 'mocha',
      'moka': 'mocha',
      'mocca': 'mocha',
      'americano': 'americano',
      'american': 'americano',
      'americanno': 'americano',
      'matcha': 'matcha latte',
      'matcha latte': 'matcha latte',
      'matchalatte': 'matcha latte',
      'macchiato': 'macchiato',
      'macchiato': 'macchiato',
      'flat white': 'flat white',
      'flatwhite': 'flat white',
      
      // Common misrecognitions
      'kuchh': 'cappuccino',
      'kuch': 'cappuccino',
      'are kuchh': 'cappuccino',
      'are kuch': 'cappuccino',
      ' kuchh': 'cappuccino',
      ' kuch': 'cappuccino',
      
      // Bakery items
      'croissant': 'croissant',
      'crescent': 'croissant',
      'crossant': 'croissant',
      'crossaint': 'croissant',
      'crosant': 'croissant',
      'croisant': 'croissant',
      'bagel': 'bagel',
      'begel': 'bagel',
      'baigal': 'bagel',
      'muffin': 'muffin',
      'muffen': 'muffin',
      'muffan': 'muffin',
      'muffin': 'muffin',
      'donut': 'donut',
      'doughnut': 'donut',
      'donught': 'donut',
      'pastry': 'pastry',
      'pastery': 'pastry',
      'pastri': 'pastry',
      'cake': 'cake',
      'kake': 'cake',
      'cookie': 'cookie',
      'cooky': 'cookie',
      'cookis': 'cookie',
      'bread': 'bread',
      'bred': 'bread',
      'bun': 'bun',
      'buns': 'bun',
      'sandwich': 'sandwich',
      'sandwitch': 'sandwich',
      'sandwhich': 'sandwich',
      'sundwich': 'sandwich',
      'toast': 'toast',
      'toost': 'toast',
      
      // Tea items
      'tea': 'tea',
      'tee': 'tea',
      'chai': 'tea',
      'greentea': 'green tea',
      'green tea': 'green tea',
      'grean tea': 'green tea',
      'herbal tea': 'herbal tea',
      'herbel tea': 'herbal tea',
      
      // Juice items
      'juice': 'juice',
      'juse': 'juice',
      'jus': 'juice',
      'orange juice': 'orange juice',
      'orenge juice': 'orange juice',
      'apple juice': 'apple juice',
      'aple juice': 'apple juice',
      
      // General food items
      'burger': 'burger',
      'burgr': 'burger',
      'birger': 'burger',
      'pizza': 'pizza',
      'piza': 'pizza',
      'pitsa': 'pizza',
      'pasta': 'pasta',
      'pasta': 'pasta',
      'pastaa': 'pasta',
      'noodles': 'noodles',
      'nudles': 'noodles',
      'noodls': 'noodles',
      'rice': 'rice',
      'rise': 'rice',
      'ris': 'rice',
      'curry': 'curry',
      'curri': 'curry',
      'kari': 'curry',
      
      // General
      'and': ',',
      'plus': ',',
      'with': ',',
      'also': ',',
      'then': ',',
      'next': ',',
      'after': ',',
      'want': '',
      'need': '',
      'like': '',
      'would like': '',
      'i would like': '',
      'i want': '',
      'i need': '',
      'please': '',
      'thank you': '',
      'thanks': ''
    };
    
    let corrected = text.toLowerCase();
    
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    });
    
    return corrected;
  }

  /**
   * Get real-time suggestions as user types
   * @param {string} text - Current input text
   * @param {Array} menuItems - Available menu items
   * @returns {Array} Suggested items with confidence scores
   */
  getSuggestions(text, menuItems) {
    if (!text || !menuItems || text.length < 1) {
      return [];
    }

    const lowerText = text.toLowerCase().trim();
    const menuIndex = this._buildMenuIndex(menuItems);
    const suggestions = [];

    // Get the last word being typed for more accurate suggestions
    const words = lowerText.split(/\s+/);
    const lastWord = words[words.length - 1];
    const searchText = lastWord.length >= 2 ? lastWord : lowerText;

    menuIndex.forEach(menuItem => {
      const score = this._calculateMatchScore(searchText, menuItem);
      // Lower threshold for better suggestions (0.15 instead of 0.25)
      if (score > 0.15) {
        suggestions.push({
          ...menuItem,
          matchScore: score
        });
      }
    });

    // Sort by match score and return top 8 (increased from 5)
    return suggestions
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);
  }

  /**
   * Calculate match score for fuzzy matching with phonetic similarity
   * @private
   */
  _calculateMatchScore(searchText, menuItem) {
    let bestScore = 0;

    menuItem.searchTerms.forEach(term => {
      // Try multiple matching strategies
      const levenshteinScore = this._levenshteinSimilarity(searchText, term);
      const phoneticScore = this._phoneticSimilarity(searchText, term);
      const containsScore = this._containsSimilarity(searchText, term);
      
      // Use the best score from all strategies
      const combinedScore = Math.max(levenshteinScore, phoneticScore, containsScore);
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore;
      }
    });

    return bestScore;
  }

  /**
   * Calculate phonetic similarity using soundex-like algorithm
   * @private
   */
  _phoneticSimilarity(str1, str2) {
    const sound1 = this._soundex(str1);
    const sound2 = this._soundex(str2);
    
    if (sound1 === sound2) return 0.9;
    if (sound1.startsWith(sound2) || sound2.startsWith(sound1)) return 0.7;
    
    // Check for common phonetic patterns
    const commonPatterns = this._getCommonPhoneticPatterns(str1, str2);
    return commonPatterns ? 0.6 : 0;
  }

  /**
   * Simple soundex-like algorithm for phonetic matching
   * @private
   */
  _soundex(str) {
    const s = str.toLowerCase().replace(/[^a-z]/g, '');
    if (s.length === 0) return '';
    
    const codes = {
      'a': '', 'e': '', 'i': '', 'o': '', 'u': '', 'y': '', 'h': '', 'w': '',
      'b': '1', 'f': '1', 'p': '1', 'v': '1',
      'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
      'd': '3', 't': '3',
      'l': '4',
      'm': '5', 'n': '5',
      'r': '6'
    };
    
    let result = s[0];
    let prevCode = codes[s[0]] || '';
    
    for (let i = 1; i < s.length; i++) {
      const code = codes[s[i]] || '';
      if (code !== '' && code !== prevCode) {
        result += code;
      }
      prevCode = code;
    }
    
    return result.substring(0, 4);
  }

  /**
   * Check for common phonetic patterns between strings
   * @private
   */
  _getCommonPhoneticPatterns(str1, str2) {
    const patterns = [
      ['c', 'k', 'q'], // c/k/q sounds similar
      ['f', 'ph'],    // f/ph sounds similar
      ['s', 'c', 'z'], // s/c/z sounds similar
      ['t', 'd'],     // t/d sounds similar
      ['p', 'b'],     // p/b sounds similar
      ['g', 'j'],     // g/j sounds similar
      ['m', 'n'],     // m/n sounds similar
      ['v', 'w'],     // v/w sounds similar
    ];
    
    for (const pattern of patterns) {
      const hasPattern1 = pattern.some(char => str1.includes(char));
      const hasPattern2 = pattern.some(char => str2.includes(char));
      if (hasPattern1 && hasPattern2) return true;
    }
    
    return false;
  }

  /**
   * Calculate contains similarity (substring matching)
   * @private
   */
  _containsSimilarity(searchText, term) {
    if (searchText.includes(term) || term.includes(searchText)) {
      return 0.8;
    }
    
    // Check if one is a substring of the other with some tolerance
    const longer = searchText.length > term.length ? searchText : term;
    const shorter = searchText.length > term.length ? term : searchText;
    
    if (longer.includes(shorter) && shorter.length >= 3) {
      return 0.7;
    }
    
    return 0;
  }

  /**
   * Calculate Levenshtein similarity (0-1)
   * @private
   */
  _levenshteinSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return 0;
    if (len2 === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    return 1 - (distance / maxLength);
  }

  /**
   * Client-side order parsing fallback with enhanced flexibility
   * @private
   */
  _parseOrderClientSide(text, menuItems) {
    const lowerText = text.toLowerCase();
    
    // Extract table number (more flexible patterns)
    const tablePatterns = [
      /table\s*(\d+)/i,
      /t\s*(\d+)/i,
      /for\s+table\s*(\d+)/i,
      /seat\s*(\d+)/i,
      /\b(\d+)\s*$/i  // Number at end might be table
    ];
    
    let tableNumber = null;
    for (const pattern of tablePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        tableNumber = parseInt(match[1]);
        break;
      }
    }

    // Extract quantities and items with more flexible patterns
    const items = [];
    
    // Build a searchable index of menu items
    const menuIndex = this._buildMenuIndex(menuItems);
    
    // Try multiple extraction strategies for long orders
    this._extractWithQuantityPatterns(lowerText, menuIndex, items);
    this._extractWithSimpleMatching(lowerText, menuIndex, items);
    this._extractWithWordVariations(lowerText, menuIndex, items);
    this._extractWithSmartContext(lowerText, menuIndex, items);
    this._extractWithSentenceStructure(lowerText, menuIndex, items); // New for long orders

    // Remove duplicates and sum quantities
    const uniqueItems = this._deduplicateItems(items);

    // Extract modifiers/notes
    const notes = this._extractNotes(text);

    return {
      tableNumber,
      items: uniqueItems,
      notes,
      confidence: uniqueItems.length > 0 ? 0.85 : 0.4
    };
  }

  /**
   * Build searchable menu index
   * @private
   */
  _buildMenuIndex(menuItems) {
    return menuItems.map(item => ({
      ...item,
      searchTerms: this._generateSearchTerms(item.name, item.code, item.category)
    }));
  }

  /**
   * Generate search terms for an item
   * @private
   */
  _generateSearchTerms(name, code, category) {
    const terms = [];
    
    if (name) {
      const lowerName = name.toLowerCase();
      terms.push(lowerName);
      terms.push(lowerName.replace(/\s+/g, '')); // Remove spaces
      terms.push(lowerName.replace(/[^a-z0-9]/g, '')); // Remove special chars
      
      // Add common variations
      terms.push(lowerName.replace(/s$/, '')); // singular
      terms.push(lowerName + 's'); // plural
      
      // Add phonetic variations
      terms.push(lowerName.replace(/ph/g, 'f')); // phone -> fone
      terms.push(lowerName.replace(/gh/g, 'g')); // rough -> rouch
      terms.push(lowerName.replace(/ck/g, 'k')); // check -> chek
      terms.push(lowerName.replace(/qu/g, 'kw')); // quick -> kwik
      
      // Add syllable breakdown variations
      const syllables = lowerName.split(/[^a-z0-9]/);
      if (syllables.length > 1) {
        terms.push(syllables.join('')); // Combine syllables
        terms.push(syllables.slice(0, 2).join('')); // First 2 syllables
      }
    }
    
    if (code) {
      terms.push(code.toLowerCase());
      terms.push(code.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    
    if (category) {
      terms.push(category.toLowerCase());
      terms.push(category.toLowerCase().replace(/\s+/g, ''));
    }
    
    // Add common aliases based on item name patterns
    const aliases = this._getCommonAliases(name, category);
    terms.push(...aliases);
    
    return [...new Set(terms)]; // Remove duplicates
  }

  /**
   * Get common aliases for menu items
   * @private
   */
  _getCommonAliases(name, category) {
    const aliases = [];
    const lowerName = name.toLowerCase();
    
    // Coffee aliases
    if (lowerName.includes('coffee') || lowerName.includes('latte') || lowerName.includes('cappuccino')) {
      aliases.push('java', 'brew', 'cup', 'caffeinated', 'decaf');
    }
    
    // Tea aliases
    if (lowerName.includes('tea') || lowerName.includes('chai')) {
      aliases.push('brew', 'hot drink', 'herbal');
    }
    
    // Bread aliases
    if (lowerName.includes('bread') || lowerName.includes('croissant') || lowerName.includes('bun')) {
      aliases.push('bakery', 'pastry', 'baked goods');
    }
    
    // Dessert aliases
    if (lowerName.includes('cake') || lowerName.includes('pastry') || lowerName.includes('dessert')) {
      aliases.push('sweet', 'treat', 'sugar');
    }
    
    // Sandwich aliases
    if (lowerName.includes('sandwich') || lowerName.includes('burger')) {
      aliases.push('sub', 'wrap', 'roll');
    }
    
    // Juice aliases
    if (lowerName.includes('juice') || lowerName.includes('smoothie')) {
      aliases.push('drink', 'beverage', 'fresh');
    }
    
    // Specific item aliases
    const specificAliases = {
      'matcha latte': ['green tea latte', 'matcha', 'green tea'],
      'cappuccino': ['cappu', 'cap'],
      'espresso': ['shot', 'expresso'],
      'americano': ['american', 'long black'],
      'croissant': ['crescent', 'french pastry'],
      'bagel': ['roll', 'bread ring'],
      'muffin': ['cake', 'breakfast cake'],
      'pancake': ['flapjack', 'hotcake'],
      'waffle': ['belgian waffle'],
      'omelette': ['omelet', 'egg dish'],
      'scrambled eggs': ['eggs', 'scramble'],
      'french toast': ['french', 'eggy bread'],
      'avocado toast': ['avocado', 'avo toast'],
      'banana bread': ['banana cake', 'loaf'],
      'cheesecake': ['cheese cake', 'cream cheese cake'],
      'brownie': ['chocolate brownie', 'fudge'],
      'cookie': ['biscuit', 'sweet'],
      'donut': ['doughnut', 'ring'],
      'smoothie': ['blend', 'fruit drink'],
      'milkshake': ['shake', 'thick shake'],
      'iced coffee': ['cold coffee', 'cold brew'],
      'hot chocolate': ['cocoa', 'chocolate drink'],
      'lemonade': ['citrus drink', 'lemon drink'],
      'soda': ['fizzy drink', 'pop', 'soft drink'],
      'water': ['h2o', 'aqua'],
      'fries': ['chips', 'french fries', 'potato fries'],
      'chips': ['crisps', 'potato chips'],
      'salad': ['greens', 'veg', 'vegetable'],
      'soup': ['broth', 'stew'],
      'pasta': ['noodles', 'spaghetti', 'macaroni'],
      'pizza': ['pie', 'slice'],
      'burger': ['hamburger', 'sandwich'],
      'chicken': ['poultry', 'bird'],
      'beef': ['meat', 'steak', 'cow'],
      'fish': ['seafood', 'aquatic'],
      'shrimp': ['prawn'],
      'lobster': ['shellfish'],
      'rice': ['grain', 'staple'],
      'naan': ['indian bread', 'flatbread'],
      'roti': ['indian bread', 'flatbread'],
      'curry': ['spicy dish', 'indian dish'],
      'biryani': ['rice dish', 'spiced rice'],
      'samosa': ['indian snack', 'fried snack'],
      'dosa': ['indian pancake', 'crepe'],
      'idli': ['steamed rice cake'],
      'vada': ['fried snack', 'donut']
    };
    
    // Check for specific aliases
    for (const [key, value] of Object.entries(specificAliases)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        aliases.push(...value);
      }
    }
    
    return aliases;
  }

  /**
   * Parse quantity from text (enhanced with more patterns)
   * @private
   */
  _parseQuantity(text) {
    const lowerText = text.toLowerCase().trim();
    
    // Number words to digits
    const numberWords = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
      'hundred': 100
    };
    
    // Direct number match
    const numberMatch = lowerText.match(/^(\d+)$/);
    if (numberMatch) {
      return parseInt(numberMatch[1]);
    }
    
    // Number word match
    if (numberWords[lowerText] !== undefined) {
      return numberWords[lowerText];
    }
    
    // Common quantity expressions
    const quantityExpressions = {
      'a': 1, 'an': 1, 'single': 1, 'one': 1,
      'couple': 2, 'pair': 2, 'two': 2, 'double': 2,
      'triple': 3, 'three': 3, 'few': 3,
      'four': 4, 'quad': 4,
      'five': 5, 'handful': 5,
      'six': 6, 'half dozen': 6,
      'seven': 7,
      'eight': 8,
      'nine': 9,
      'ten': 10, 'dozen': 12
    };
    
    if (quantityExpressions[lowerText] !== undefined) {
      return quantityExpressions[lowerText];
    }
    
    // Try to extract number from mixed text
    const mixedMatch = lowerText.match(/(\d+)/);
    if (mixedMatch) {
      return parseInt(mixedMatch[1]);
    }
    
    return null;
  }

  /**
   * Extract items using quantity patterns (enhanced)
   * @private
   */
  _extractWithQuantityPatterns(lowerText, menuIndex, items) {
    const quantityPatterns = [
      /(\d+)\s*(?:x|×|of)?\s*([a-z\s]+)/gi,
      /(?:i want|i'd like|give me|get me|can i have|need|order)\s+(\d+)\s*([a-z\s]+)/gi,
      /(\d+)\s*(?:pieces|pcs|orders|plates|bowls|cups)?\s+of\s+([a-z\s]+)/gi,
      /([a-z\s]+)\s*(\d+)/gi  // "croissant 2" pattern
    ];

    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'a': 1, 'an': 1, 
      'single': 1, 'double': 2, 'triple': 3, 'quad': 4
    };

    quantityPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(lowerText)) !== null) {
        let quantity, itemName;
        
        // Handle different capture group orders
        if (pattern.source.includes('([a-z\\s]+)\\s*(\\d+)')) {
          // "croissant 2" pattern
          itemName = match[1];
          quantity = match[2];
        } else {
          quantity = match[1];
          itemName = match[2] || match[1];
        }

        // Convert number words to digits
        if (numberWords[quantity.toLowerCase()]) {
          quantity = numberWords[quantity.toLowerCase()];
        }

        quantity = parseInt(quantity) || 1;
        itemName = itemName.trim();

        // Find matching menu item with fuzzy matching
        const matchedItem = this._findMenuItemFuzzy(itemName, menuIndex);
        if (matchedItem) {
          items.push({
            name: matchedItem.name,
            quantity,
            menuItemId: matchedItem.id,
            price: matchedItem.price
          });
        }
      }
    });
  }

  /**
   * Extract items using simple word matching
   * @private
   */
  _extractWithSimpleMatching(lowerText, menuIndex, items) {
    menuIndex.forEach(menuItem => {
      menuItem.searchTerms.forEach(term => {
        if (lowerText.includes(term) && !items.find(i => i.menuItemId === menuItem.id)) {
          items.push({
            name: menuItem.name,
            quantity: 1,
            menuItemId: menuItem.id,
            price: menuItem.price
          });
        }
      });
    });
  }

  /**
   * Extract items using word variations and partial matches
   * @private
   */
  _extractWithWordVariations(lowerText, menuIndex, items) {
    const words = lowerText.split(/\s+/);
    
    menuIndex.forEach(menuItem => {
      menuItem.searchTerms.forEach(term => {
        const termWords = term.split(/\s+/);
        
        // Check if any significant portion of the term matches
        let matchCount = 0;
        termWords.forEach(termWord => {
          if (words.includes(termWord) || words.some(w => w.includes(termWord) || termWord.includes(w))) {
            matchCount++;
          }
        });
        
        // If we have a reasonable match (at least 50% of words)
        if (matchCount >= Math.max(1, Math.floor(termWords.length * 0.5))) {
          if (!items.find(i => i.menuItemId === menuItem.id)) {
            items.push({
              name: menuItem.name,
              quantity: 1,
              menuItemId: menuItem.id,
              price: menuItem.price
            });
          }
        }
      });
    });
  }

  /**
   * Extract items using smart context analysis
   * @private
   */
  _extractWithSmartContext(lowerText, menuIndex, items) {
    // Split text into segments (by common separators)
    const segments = lowerText.split(/[,.;]|and|&|plus|\+/i);
    
    segments.forEach(segment => {
      const trimmed = segment.trim();
      if (trimmed.length < 3) return; // Increased from 2 to 3 to reduce noise

      // Try to match each segment independently with higher threshold
      menuIndex.forEach(menuItem => {
        const score = this._calculateMatchScore(trimmed, menuItem);
        if (score > 0.75) { // Increased from 0.6 to 0.75
          // High confidence match
          if (!items.find(i => i.menuItemId === menuItem.id)) {
            items.push({
              name: menuItem.name,
              quantity: 1,
              menuItemId: menuItem.id,
              price: menuItem.price
            });
          }
        }
      });
    });
  }

  /**
   * Extract items using sentence structure analysis for long orders
   * @private
   */
  _extractWithSentenceStructure(lowerText, menuIndex, items) {
    // Split by common sentence separators for long orders
    const sentences = lowerText.split(/[,.;]|and|then|next|also|plus|\+/i);
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length < 2) return;
      
      // Look for quantity + item patterns in each sentence
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const quantity = this._parseQuantity(word);
        
        if (quantity !== null) {
          // Found a quantity, look for item in following words
          const remainingWords = words.slice(i + 1).join(' ');
          const matchedItem = this._findMenuItemFuzzy(remainingWords, menuIndex);
          
          if (matchedItem) {
            if (!items.find(item => item.menuItemId === matchedItem.id)) {
              items.push({
                name: matchedItem.name,
                quantity: quantity,
                menuItemId: matchedItem.id,
                price: matchedItem.price
              });
            }
          }
        }
      }
      
      // Also try matching without explicit quantity (default to 1) - but only if no quantity found
      const hasQuantity = words.some(w => this._parseQuantity(w) !== null);
      if (!hasQuantity) {
        const sentenceMatch = this._findMenuItemFuzzy(sentence, menuIndex);
        if (sentenceMatch && !items.find(item => item.menuItemId === sentenceMatch.id)) {
          items.push({
            name: sentenceMatch.name,
            quantity: 1,
            menuItemId: sentenceMatch.id,
            price: sentenceMatch.price
          });
        }
      }
    });
  }

  /**
   * Find menu item with fuzzy matching (enhanced with Levenshtein)
   * @private
   */
  _findMenuItemFuzzy(searchTerm, menuIndex) {
    const lowerSearch = searchTerm.toLowerCase().trim();
    
    // Direct match (highest priority)
    let match = menuIndex.find(item => 
      item.searchTerms.includes(lowerSearch)
    );
    if (match) return match;

    // High similarity match (>0.85 - increased from 0.8 for better accuracy)
    const highSimilarity = menuIndex
      .map(item => ({ item, score: this._calculateMatchScore(lowerSearch, item) }))
      .filter(({ score }) => score > 0.85)
      .sort((a, b) => b.score - a.score)[0];
    
    if (highSimilarity) return highSimilarity.item;

    // Medium similarity match (>0.65 - increased from 0.5 to reduce false positives)
    const mediumSimilarity = menuIndex
      .map(item => ({ item, score: this._calculateMatchScore(lowerSearch, item) }))
      .filter(({ score }) => score > 0.65)
      .sort((a, b) => b.score - a.score)[0];
    
    if (mediumSimilarity) return mediumSimilarity.item;

    // Partial match (at least 4 characters - increased from 3)
    if (lowerSearch.length >= 4) {
      match = menuIndex.find(item => 
        item.searchTerms.some(term => 
          term.includes(lowerSearch) || lowerSearch.includes(term.substring(0, 4))
        )
      );
      if (match) return match;
    }

    // Word overlap matching (stricter - requires 70% overlap instead of 50%)
    const searchWords = lowerSearch.split(/\s+/);
    match = menuIndex.find(item => {
      const itemWords = item.name.toLowerCase().split(/\s+/);
      const overlap = searchWords.filter(w => 
        itemWords.some(iw => iw.includes(w) || w.includes(iw))
      );
      return overlap.length >= Math.max(1, Math.ceil(itemWords.length * 0.7));
    });
    if (match) return match;

    return null;
  }

  /**
   * Remove duplicate items (sum quantities)
   * @private
   */
  _deduplicateItems(items) {
    const itemMap = new Map();
    
    items.forEach(item => {
      const existing = itemMap.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemMap.set(item.menuItemId, { ...item });
      }
    });
    
    return Array.from(itemMap.values());
  }

  /**
   * Find menu item by fuzzy matching
   * @private
   */
  _findMenuItem(searchTerm, menuItems) {
    const lowerSearch = searchTerm.toLowerCase().trim();
    
    // Direct match
    let match = menuItems.find(item => 
      item.name.toLowerCase() === lowerSearch
    );
    if (match) return match;

    // Partial match
    match = menuItems.find(item => 
      item.name.toLowerCase().includes(lowerSearch) ||
      lowerSearch.includes(item.name.toLowerCase())
    );
    if (match) return match;

    // Code match
    match = menuItems.find(item => 
      item.code && item.code.toLowerCase() === lowerSearch
    );
    if (match) return match;

    return null;
  }

  /**
   * Extract notes/modifiers from text (enhanced)
   * @private
   */
  _extractNotes(text) {
    const notes = [];
    const lowerText = text.toLowerCase();

    // Modifier patterns
    const modifierPatterns = [
      { pattern: /no\s+([a-z\s]+)/gi, prefix: 'No ' },
      { pattern: /without\s+([a-z\s]+)/gi, prefix: 'Without ' },
      { pattern: /extra\s+([a-z\s]+)/gi, prefix: 'Extra ' },
      { pattern: /less\s+([a-z\s]+)/gi, prefix: 'Less ' },
      { pattern: /more\s+([a-z\s]+)/gi, prefix: 'More ' },
      { pattern: /double\s+([a-z\s]+)/gi, prefix: 'Double ' },
      { pattern: /half\s+([a-z\s]+)/gi, prefix: 'Half ' },
      { pattern: /spicy/gi, prefix: 'Spicy' },
      { pattern: /mild/gi, prefix: 'Mild' },
      { pattern: /hot/gi, prefix: 'Hot' },
      { pattern: /cold/gi, prefix: 'Cold' },
      { pattern: /warm/gi, prefix: 'Warm' },
      { pattern: /well\s+done/gi, prefix: 'Well done' },
      { pattern: /medium/gi, prefix: 'Medium' },
      { pattern: /rare/gi, prefix: 'Rare' },
      { pattern: /on\s+the\s+side/gi, prefix: 'On the side' },
      { pattern: /gluten\s+free/gi, prefix: 'Gluten-free' },
      { pattern: /vegan/gi, prefix: 'Vegan' },
      { pattern: /vegetarian/gi, prefix: 'Vegetarian' },
      { pattern: /dairy\s+free/gi, prefix: 'Dairy-free' },
      { pattern: /nut\s+free/gi, prefix: 'Nut-free' },
      { pattern: /sugar\s+free/gi, prefix: 'Sugar-free' },
      { pattern: /decaf/gi, prefix: 'Decaf' },
      { pattern: /caffeinated/gi, prefix: 'Caffeinated' },
      { pattern: /iced/gi, prefix: 'Iced' },
      { pattern: /hot/gi, prefix: 'Hot' },
      { pattern: /dry/gi, prefix: 'Dry' },
      { pattern: /wet/gi, prefix: 'Wet' },
      { pattern: /crispy/gi, prefix: 'Crispy' },
      { pattern: /soft/gi, prefix: 'Soft' },
      { pattern: /crunchy/gi, prefix: 'Crunchy' },
      { pattern: /fresh/gi, prefix: 'Fresh' },
      { pattern: /toasted/gi, prefix: 'Toasted' },
      { pattern: /untoasted/gi, prefix: 'Untoasted' },
      { pattern: /grilled/gi, prefix: 'Grilled' },
      { pattern: /fried/gi, prefix: 'Fried' },
      { pattern: /baked/gi, prefix: 'Baked' },
      { pattern: /steamed/gi, prefix: 'Steamed' },
      { pattern: /boiled/gi, prefix: 'Boiled' },
      { pattern: /roasted/gi, prefix: 'Roasted' }
    ];

    modifierPatterns.forEach(({ pattern, prefix }) => {
      let match;
      while ((match = pattern.exec(lowerText)) !== null) {
        const modifier = prefix + (match[1] ? match[1].trim() : '');
        if (!notes.includes(modifier)) {
          notes.push(modifier);
        }
      }
    });

    return notes.join(', ');
  }

  /**
   * Validate parsed order against menu
   */
  validateOrder(parsedOrder, menuItems) {
    const errors = [];
    const warnings = [];

    if (!parsedOrder.tableNumber) {
      warnings.push('No table number detected');
    }

    if (parsedOrder.items.length === 0) {
      errors.push('No items detected in order');
    }

    parsedOrder.items.forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      if (!menuItem) {
        warnings.push(`Item "${item.name}" not found in menu`);
      }
      if (menuItem && !menuItem.active) {
        errors.push(`Item "${item.name}" is not available`);
      }
      if (menuItem && menuItem.eightySixed) {
        errors.push(`Item "${item.name}" is 86'd (out of stock)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Set server URL
   */
  setServerUrl(url) {
    this.serverUrl = url;
  }
}

// Singleton instance
const orderParserService = new OrderParserService();

export default orderParserService;

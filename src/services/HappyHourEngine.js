// HappyHourEngine.js - Dynamic Happy Hour & Scheduled Pricing Rules Engine

class HappyHourEngine {
  constructor() {
    this.rules = [
      {
        id: 'hh-cocktails',
        name: 'Mon-Fri Happy Hour (50% Off Beverages)',
        categories: ['Beverages', 'Drinks', 'Cocktails'],
        days: [1, 2, 3, 4, 5], // Mon to Fri
        startHour: 16, // 4 PM
        endHour: 18,   // 6 PM
        discountPct: 50
      },
      {
        id: 'brunch-surcharge',
        name: 'Weekend Brunch Surcharge (10%)',
        categories: ['Breakfast', 'Brunch'],
        days: [0, 6], // Sat & Sun
        startHour: 9,  // 9 AM
        endHour: 14,  // 2 PM
        discountPct: -10 // Surcharge
      }
    ];
  }

  getCalculatedPrice(item, date = new Date()) {
    const currentDay = date.getDay();
    const currentHour = date.getHours();

    let adjustedPrice = item.price;
    let appliedRule = null;

    for (const rule of this.rules) {
      const matchCategory = rule.categories.some(c => 
        (item.category || '').toLowerCase().includes(c.toLowerCase()) ||
        (item.name || '').toLowerCase().includes(c.toLowerCase())
      );

      if (matchCategory && rule.days.includes(currentDay) && currentHour >= rule.startHour && currentHour < rule.endHour) {
        if (rule.discountPct > 0) {
          adjustedPrice = item.price * (1 - rule.discountPct / 100);
        } else {
          // Negative discount = surcharge
          adjustedPrice = item.price * (1 + Math.abs(rule.discountPct) / 100);
        }
        appliedRule = rule;
        break;
      }
    }

    return {
      originalPrice: item.price,
      adjustedPrice: Math.round(adjustedPrice * 100) / 100,
      appliedRule
    };
  }
}

export const happyHourEngine = new HappyHourEngine();
export default happyHourEngine;

// Multi-language support utilities

import React from 'react';

// Translation dictionary
const translations = {
  en: {
    // Common
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'search': 'Search',
    'confirm': 'Confirm',
    'yes': 'Yes',
    'no': 'No',
    'close': 'Close',
    
    // Navigation
    'orders': 'Orders',
    'kitchen': 'Kitchen',
    'tables': 'Tables',
    'settings': 'Settings',
    'customers': 'Customers',
    'inventory': 'Inventory',
    'reports': 'Reports',
    
    // Order-related
    'order': 'Order',
    'new_order': 'New Order',
    'order_history': 'Order History',
    'order_id': 'Order ID',
    'order_type': 'Order Type',
    'dine_in': 'Dine In',
    'takeaway': 'Takeaway',
    'delivery': 'Delivery',
    'subtotal': 'Subtotal',
    'tax': 'Tax',
    'total': 'Total',
    'discount': 'Discount',
    'tip': 'Tip',
    'payment': 'Payment',
    'payment_method': 'Payment Method',
    'cash': 'Cash',
    'card': 'Card',
    'upi': 'UPI',
    'loyalty_points': 'Loyalty Points',
    'gift_card': 'Gift Card',
    
    // Menu-related
    'menu': 'Menu',
    'menu_item': 'Menu Item',
    'category': 'Category',
    'price': 'Price',
    'quantity': 'Quantity',
    'modifiers': 'Modifiers',
    'special_request': 'Special Request',
    'notes': 'Notes',
    
    // Customer-related
    'customer': 'Customer',
    'customer_name': 'Customer Name',
    'customer_phone': 'Customer Phone',
    'customer_email': 'Customer Email',
    'add_customer': 'Add Customer',
    'select_customer': 'Select Customer',
    'vip': 'VIP',
    'birthday': 'Birthday',
    'anniversary': 'Anniversary',
    
    // Table-related
    'table': 'Table',
    'table_number': 'Table Number',
    'capacity': 'Capacity',
    'location': 'Location',
    'transfer': 'Transfer',
    
    // Kitchen-related
    'kitchen': 'Kitchen',
    'kot': 'KOT',
    'course': 'Course',
    'priority': 'Priority',
    'delayed': 'Delayed',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'completed': 'Completed',
    
    // Status messages
    'order_completed': 'Order completed successfully',
    'payment_processed': 'Payment processed successfully',
    'error_occurred': 'An error occurred',
    'operation_successful': 'Operation successful',
    'confirm_delete': 'Are you sure you want to delete this?',
    'confirm_cancel': 'Are you sure you want to cancel?',
    
    // Time-related
    'today': 'Today',
    'yesterday': 'Yesterday',
    'this_week': 'This Week',
    'this_month': 'This Month',
    'custom': 'Custom',
    
    // Numbers
    'currency': '₹',
    'currency_code': 'INR'
  },
  
  es: {
    // Common
    'loading': 'Cargando...',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'delete': 'Eliminar',
    'edit': 'Editar',
    'search': 'Buscar',
    'confirm': 'Confirmar',
    'yes': 'Sí',
    'no': 'No',
    'close': 'Cerrar',
    
    // Navigation
    'orders': 'Pedidos',
    'kitchen': 'Cocina',
    'tables': 'Mesas',
    'settings': 'Configuración',
    'customers': 'Clientes',
    'inventory': 'Inventario',
    'reports': 'Reportes',
    
    // Order-related
    'order': 'Pedido',
    'new_order': 'Nuevo Pedido',
    'order_history': 'Historial de Pedidos',
    'order_id': 'ID del Pedido',
    'order_type': 'Tipo de Pedido',
    'dine_in': 'Para Comer Aquí',
    'takeaway': 'Para Llevar',
    'delivery': 'Entrega',
    'subtotal': 'Subtotal',
    'tax': 'Impuesto',
    'total': 'Total',
    'discount': 'Descuento',
    'tip': 'Propina',
    'payment': 'Pago',
    'payment_method': 'Método de Pago',
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'upi': 'UPI',
    'loyalty_points': 'Puntos de Lealtad',
    'gift_card': 'Tarjeta de Regalo',
    
    // Menu-related
    'menu': 'Menú',
    'menu_item': 'Artículo del Menú',
    'category': 'Categoría',
    'price': 'Precio',
    'quantity': 'Cantidad',
    'modifiers': 'Modificadores',
    'special_request': 'Solicitud Especial',
    'notes': 'Notas',
    
    // Customer-related
    'customer': 'Cliente',
    'customer_name': 'Nombre del Cliente',
    'customer_phone': 'Teléfono del Cliente',
    'customer_email': 'Email del Cliente',
    'add_customer': 'Agregar Cliente',
    'select_customer': 'Seleccionar Cliente',
    'vip': 'VIP',
    'birthday': 'Cumpleaños',
    'anniversary': 'Aniversario',
    
    // Table-related
    'table': 'Mesa',
    'table_number': 'Número de Mesa',
    'capacity': 'Capacidad',
    'location': 'Ubicación',
    'transfer': 'Transferir',
    
    // Kitchen-related
    'kitchen': 'Cocina',
    'kot': 'KOT',
    'course': 'Curso',
    'priority': 'Prioridad',
    'delayed': 'Retrasado',
    'preparing': 'Preparando',
    'ready': 'Listo',
    'completed': 'Completado',
    
    // Status messages
    'order_completed': 'Pedido completado exitosamente',
    'payment_processed': 'Pago procesado exitosamente',
    'error_occurred': 'Ocurrió un error',
    'operation_successful': 'Operación exitosa',
    'confirm_delete': '¿Estás seguro de que quieres eliminar esto?',
    'confirm_cancel': '¿Estás seguro de que quieres cancelar?',
    
    // Time-related
    'today': 'Hoy',
    'yesterday': 'Ayer',
    'this_week': 'Esta Semana',
    'this_month': 'Este Mes',
    'custom': 'Personalizado',
    
    // Numbers
    'currency': '₹',
    'currency_code': 'INR'
  },
  
  hi: {
    // Common
    'loading': 'लोड हो रहा है...',
    'save': 'सहेजें',
    'cancel': 'रद्द करें',
    'delete': 'हटाएं',
    'edit': 'संपादित करें',
    'search': 'खोजें',
    'confirm': 'पुष्टि करें',
    'yes': 'हाँ',
    'no': 'नहीं',
    'close': 'बंद करें',
    
    // Navigation
    'orders': 'ऑर्डर',
    'kitchen': 'किचन',
    'tables': 'टेबल',
    'settings': 'सेटिंग्स',
    'customers': 'ग्राहक',
    'inventory': 'इन्वेंटरी',
    'reports': 'रिपोर्ट',
    
    // Order-related
    'order': 'ऑर्डर',
    'new_order': 'नया ऑर्डर',
    'order_history': 'ऑर्डर इतिहास',
    'order_id': 'ऑर्डर आईडी',
    'order_type': 'ऑर्डर प्रकार',
    'dine_in': 'यहाँ खाएं',
    'takeaway': 'टेकअवे',
    'delivery': 'डिलीवरी',
    'subtotal': 'उप-कुल',
    'tax': 'कर',
    'total': 'कुल',
    'discount': 'छूट',
    'tip': 'टिप',
    'payment': 'भुगतान',
    'payment_method': 'भुगतान विधि',
    'cash': 'नकद',
    'card': 'कार्ड',
    'upi': 'UPI',
    'loyalty_points': 'लॉयल्टी पॉइंट्स',
    'gift_card': 'गिफ्ट कार्ड',
    
    // Menu-related
    'menu': 'मेनू',
    'menu_item': 'मेनू आइटम',
    'category': 'श्रेणी',
    'price': 'मूल्य',
    'quantity': 'मात्रा',
    'modifiers': 'संशोधक',
    'special_request': 'विशेष अनुरोध',
    'notes': 'नोट्स',
    
    // Customer-related
    'customer': 'ग्राहक',
    'customer_name': 'ग्राहक का नाम',
    'customer_phone': 'ग्राहक का फोन',
    'customer_email': 'ग्राहक का ईमेल',
    'add_customer': 'ग्राहक जोड़ें',
    'select_customer': 'ग्राहक चुनें',
    'vip': 'VIP',
    'birthday': 'जन्मदिन',
    'anniversary': 'वर्षगांठ',
    
    // Table-related
    'table': 'टेबल',
    'table_number': 'टेबल नंबर',
    'capacity': 'क्षमता',
    'location': 'स्थान',
    'transfer': 'स्थानांतरण',
    
    // Kitchen-related
    'kitchen': 'किचन',
    'kot': 'KOT',
    'course': 'कोर्स',
    'priority': 'प्राथमिकता',
    'delayed': 'विलंबित',
    'preparing': 'तैयार कर रहा है',
    'ready': 'तैयार',
    'completed': 'पूरा हो गया',
    
    // Status messages
    'order_completed': 'ऑर्डर सफलतापूर्वक पूरा हो गया',
    'payment_processed': 'भुगतान सफलतापूर्वक प्रोसेस हो गया',
    'error_occurred': 'एक त्रुटि हुई',
    'operation_successful': 'ऑपरेशन सफल',
    'confirm_delete': 'क्या आप वाकई इसे हटाना चाहते हैं?',
    'confirm_cancel': 'क्या आप वाकई इसे रद्द करना चाहते हैं?',
    
    // Time-related
    'today': 'आज',
    'yesterday': 'कल',
    'this_week': 'इस सप्ताह',
    'this_month': 'इस महीने',
    'custom': 'कस्टम',
    
    // Numbers
    'currency': '₹',
    'currency_code': 'INR'
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return localStorage.getItem('app_language') || 'en';
};

// Set current language
export const setLanguage = (language) => {
  if (translations[language]) {
    localStorage.setItem('app_language', language);
    // Trigger language change event
    window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
  }
};

// Get translation for a key
export const t = (key, language = null) => {
  const lang = language || getCurrentLanguage();
  const langTranslations = translations[lang] || translations.en;
  return langTranslations[key] || translations.en[key] || key;
};

// Format currency with proper locale
export const formatCurrency = (amount, language = null) => {
  const lang = language || getCurrentLanguage();
  const currencySymbol = t('currency', lang);
  return `${currencySymbol}${amount.toFixed(2)}`;
};

// Get available languages
export const getAvailableLanguages = () => {
  return Object.keys(translations).map(key => ({
    code: key,
    name: key === 'en' ? 'English' : key === 'es' ? 'Español' : 'हिंदी'
  }));
};

// React hook for translations - import this in components
export const useTranslation = () => {
  const [language, setLanguageState] = React.useState(getCurrentLanguage());
  
  React.useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguageState(event.detail);
    };
    
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);
  
  return {
    language,
    setLanguage,
    t: (key) => t(key, language),
    formatCurrency: (amount) => formatCurrency(amount, language)
  };
};

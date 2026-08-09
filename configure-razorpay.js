// Run this script in browser console to configure Razorpay test credentials
// Or navigate to Settings → Payment Gateways and enter manually

const razorpayConfig = {
  enabled: true,
  testMode: true,
  apiKey: 'rzp_test_TNOHWmxS3Z0i8f',
  apiSecret: 'YbVAsBPPz7NT6iwXnuvBUDHb'
};

// Save to localStorage
const existingConfigs = JSON.parse(localStorage.getItem('cafeos_gateway_configs') || '{}');
existingConfigs.razorpay = razorpayConfig;
localStorage.setItem('cafeos_gateway_configs', JSON.stringify(existingConfigs));

console.log('✅ Razorpay test credentials configured successfully!');
console.log('API Key:', razorpayConfig.apiKey);
console.log('Test Mode:', razorpayConfig.testMode);
console.log('\nRefresh the page to apply changes.');

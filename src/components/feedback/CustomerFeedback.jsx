import React, { useState, useEffect } from 'react';

export default function CustomerFeedback({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [screenSize, setScreenSize] = useState('large');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    foodRating: 0,
    serviceRating: 0,
    ambianceRating: 0,
    overallRating: 0,
    comment: '',
    customerName: '',
    customerPhone: '',
    orderId: ''
  });

  // Sample feedback data
  const [feedbacks, setFeedbacks] = useState([
    { id: 1, customer: 'Rahul Sharma', foodRating: 5, serviceRating: 4, ambianceRating: 4, overallRating: 4.3, comment: 'Great food, friendly staff!', date: '2024-01-15', orderId: 'ORD-001' },
    { id: 2, customer: 'Priya Singh', foodRating: 4, serviceRating: 5, ambianceRating: 5, overallRating: 4.7, comment: 'Excellent service and atmosphere', date: '2024-01-14', orderId: 'ORD-002' },
    { id: 3, customer: 'Amit Patel', foodRating: 3, serviceRating: 3, ambianceRating: 4, overallRating: 3.3, comment: 'Food was okay, could be better', date: '2024-01-13', orderId: 'ORD-003' },
    { id: 4, customer: 'Neha Gupta', foodRating: 5, serviceRating: 5, ambianceRating: 5, overallRating: 5.0, comment: 'Perfect experience! Will come again.', date: '2024-01-12', orderId: 'ORD-004' },
    { id: 5, customer: 'Vikram Reddy', foodRating: 4, serviceRating: 4, ambianceRating: 3, overallRating: 3.7, comment: 'Good food, ambiance needs improvement', date: '2024-01-11', orderId: 'ORD-005' }
  ]);

  // QR code settings
  const [qrSettings, setQrSettings] = useState({
    enabled: true,
    autoPrompt: true,
    promptAfterMinutes: 15,
    rewardPoints: 50,
    qrCodeUrl: 'https://bakery.example.com/feedback'
  });

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

  // Calculate statistics
  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length).toFixed(1)
    : 0;

  const averageFoodRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.foodRating, 0) / feedbacks.length).toFixed(1)
    : 0;

  const averageServiceRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.serviceRating, 0) / feedbacks.length).toFixed(1)
    : 0;

  const averageAmbianceRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.ambianceRating, 0) / feedbacks.length).toFixed(1)
    : 0;

  const fiveStarCount = feedbacks.filter(f => f.overallRating >= 4.5).length;
  const fourStarCount = feedbacks.filter(f => f.overallRating >= 3.5 && f.overallRating < 4.5).length;
  const threeStarCount = feedbacks.filter(f => f.overallRating >= 2.5 && f.overallRating < 3.5).length;
  const twoStarCount = feedbacks.filter(f => f.overallRating >= 1.5 && f.overallRating < 2.5).length;
  const oneStarCount = feedbacks.filter(f => f.overallRating < 1.5).length;

  const handleSubmitFeedback = () => {
    const newFeedback = {
      id: Date.now(),
      customer: feedbackData.customerName || 'Anonymous',
      foodRating: feedbackData.foodRating,
      serviceRating: feedbackData.serviceRating,
      ambianceRating: feedbackData.ambianceRating,
      overallRating: ((feedbackData.foodRating + feedbackData.serviceRating + feedbackData.ambianceRating) / 3).toFixed(1),
      comment: feedbackData.comment,
      date: new Date().toISOString().split('T')[0],
      orderId: feedbackData.orderId
    };
    setFeedbacks([newFeedback, ...feedbacks]);
    setShowFeedbackForm(false);
    setFeedbackData({
      foodRating: 0,
      serviceRating: 0,
      ambianceRating: 0,
      overallRating: 0,
      comment: '',
      customerName: '',
      customerPhone: '',
      orderId: ''
    });
  };

  const StarRating = ({ rating, onRating, size = 'large' }) => {
    const stars = [1, 2, 3, 4, 5];
    const starSize = size === 'large' ? '32px' : '24px';
    
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {stars.map(star => (
          <span
            key={star}
            onClick={() => onRating && onRating(star)}
            style={{
              fontSize: starSize,
              cursor: onRating ? 'pointer' : 'default',
              color: star <= rating ? '#fbbf24' : '#222222',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => onRating && (e.target.style.transform = 'scale(1.2)')}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '16px' : '24px 32px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
              fontSize: screenSize === 'small' ? '20px' : '28px',
              fontWeight: '800',
              color: '#0a0a0a',
              letterSpacing: '-0.5px'
            }}>
              ⭐ Customer Feedback
            </div>
            <div style={{ color: '#64748b', fontSize: screenSize === 'small' ? '12px' : '14px' }}>
              Collect and analyze customer reviews
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowQRModal(true)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 24px',
                background: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: screenSize === 'small' ? '13px' : '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📱 QR Code
            </button>
            <button
              onClick={() => setShowFeedbackForm(true)}
              style={{
                padding: screenSize === 'small' ? '10px 16px' : '12px 24px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: screenSize === 'small' ? '13px' : '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Add Feedback
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '12px 16px' : '16px 32px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        overflow: 'auto'
      }}>
        {['dashboard', 'feedbacks', 'analytics', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: activeTab === tab ? '#6366f1' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#64748b',
              border: activeTab === tab ? 'none' : '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '12px' : '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '24px 32px', overflow: 'auto', flex: 1 }}>
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: screenSize === 'small' ? '16px' : '24px'
            }}>
              <StatCard
                label="Total Feedbacks"
                value={feedbacks.length}
                icon="📝"
                color="#6366f1"
                screenSize={screenSize}
              />
              <StatCard
                label="Average Rating"
                value={`${averageRating} ⭐`}
                icon="⭐"
                color="#f59e0b"
                screenSize={screenSize}
              />
              <StatCard
                label="5-Star Reviews"
                value={fiveStarCount}
                icon="🌟"
                color="#10b981"
                screenSize={screenSize}
              />
              <StatCard
                label="Response Rate"
                value="78%"
                icon="📊"
                color="#8b5cf6"
                screenSize={screenSize}
              />
            </div>

            {/* Rating Breakdown */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '20px'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a', marginBottom: '16px' }}>
                  Rating Distribution
                </div>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = star === 5 ? fiveStarCount : star === 4 ? fourStarCount : star === 3 ? threeStarCount : star === 2 ? twoStarCount : oneStarCount;
                  const percentage = feedbacks.length > 0 ? (count / feedbacks.length) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', minWidth: '60px' }}>{star} ⭐</span>
                      <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: star >= 4 ? '#10b981' : star >= 3 ? '#f59e0b' : '#ef4444', borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '14px', color: '#64748b', minWidth: '40px' }}>{count}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '20px'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a', marginBottom: '16px' }}>
                  Category Ratings
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>🍽️ Food Quality</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a' }}>{averageFoodRating} ⭐</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>🤝 Service</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a' }}>{averageServiceRating} ⭐</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>🎨 Ambiance</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#0a0a0a' }}>{averageAmbianceRating} ⭐</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Feedbacks */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: screenSize === 'small' ? '16px' : '20px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: screenSize === 'small' ? '16px' : '18px',
                fontWeight: '700',
                color: '#0a0a0a'
              }}>
                📋 Recent Feedbacks
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Rating</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Comment</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.slice(0, 5).map((feedback, index) => (
                      <tr key={feedback.id} style={{ borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>{feedback.customer}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>{feedback.overallRating} ⭐</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', maxWidth: '300px' }}>{feedback.comment}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{feedback.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'feedbacks' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: screenSize === 'small' ? '16px' : '20px',
              borderBottom: '1px solid #e5e7eb',
              fontSize: screenSize === 'small' ? '16px' : '18px',
              fontWeight: '700',
              color: '#0a0a0a'
            }}>
              📝 All Feedbacks ({feedbacks.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Food</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Service</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Ambiance</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Overall</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Comment</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((feedback, index) => (
                    <tr key={feedback.id} style={{ borderBottom: index < feedbacks.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>{feedback.customer}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>{feedback.foodRating} ⭐</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>{feedback.serviceRating} ⭐</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>{feedback.ambianceRating} ⭐</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#10b981', fontWeight: '700' }}>{feedback.overallRating} ⭐</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', maxWidth: '250px' }}>{feedback.comment}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{feedback.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a', marginBottom: '8px' }}>
              Advanced Analytics
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Detailed feedback analytics coming soon
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: screenSize === 'small' ? '20px' : '32px',
            maxWidth: '600px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a', marginBottom: '24px' }}>
              ⚙️ Feedback Settings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '4px' }}>
                    Enable QR Code Feedback
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Allow customers to scan QR codes to submit feedback
                  </div>
                </div>
                <button
                  onClick={() => setQrSettings({ ...qrSettings, enabled: !qrSettings.enabled })}
                  style={{
                    padding: '6px 16px',
                    background: qrSettings.enabled ? '#10b981' : '#e5e7eb',
                    color: qrSettings.enabled ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {qrSettings.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '4px' }}>
                    Auto-Prompt Feedback
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Automatically prompt customers after order completion
                  </div>
                </div>
                <button
                  onClick={() => setQrSettings({ ...qrSettings, autoPrompt: !qrSettings.autoPrompt })}
                  style={{
                    padding: '6px 16px',
                    background: qrSettings.autoPrompt ? '#10b981' : '#e5e7eb',
                    color: qrSettings.autoPrompt ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {qrSettings.autoPrompt ? 'ON' : 'OFF'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Prompt After (minutes)
                </label>
                <input
                  type="number"
                  value={qrSettings.promptAfterMinutes}
                  onChange={(e) => setQrSettings({ ...qrSettings, promptAfterMinutes: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Reward Points for Feedback
                </label>
                <input
                  type="number"
                  value={qrSettings.rewardPoints}
                  onChange={(e) => setQrSettings({ ...qrSettings, rewardPoints: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a', marginBottom: '20px' }}>
              📱 Feedback QR Code
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '32px',
              marginBottom: '20px',
              border: '2px dashed #e5e7eb'
            }}>
              <div style={{
                width: '200px',
                height: '200px',
                background: '#ffffff',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#64748b',
                border: '1px solid #e5e7eb'
              }}>
                [QR Code Placeholder]
              </div>
            </div>

            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Scan this QR code to submit feedback
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f9fafb',
                  color: '#0a0a0a',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '90%',
            padding: '32px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a', marginBottom: '24px' }}>
              ⭐ Submit Feedback
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={feedbackData.customerName}
                  onChange={(e) => setFeedbackData({ ...feedbackData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  value={feedbackData.orderId}
                  onChange={(e) => setFeedbackData({ ...feedbackData, orderId: e.target.value })}
                  placeholder="e.g., ORD-001"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  🍽️ Food Quality
                </label>
                <StarRating rating={feedbackData.foodRating} onRating={(rating) => setFeedbackData({ ...feedbackData, foodRating: rating })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  🤝 Service
                </label>
                <StarRating rating={feedbackData.serviceRating} onRating={(rating) => setFeedbackData({ ...feedbackData, serviceRating: rating })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  🎨 Ambiance
                </label>
                <StarRating rating={feedbackData.ambianceRating} onRating={(rating) => setFeedbackData({ ...feedbackData, ambianceRating: rating })} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  Comments
                </label>
                <textarea
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#f9fafb',
                    color: '#0a0a0a',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  style={{
                    padding: '12px 24px',
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, screenSize }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      padding: screenSize === 'small' ? '16px' : '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <div style={{ fontSize: '24px' }}>{icon}</div>
      </div>
      <div style={{ fontSize: screenSize === 'small' ? '24px' : '28px', fontWeight: '700', color: '#0a0a0a' }}>
        {value}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL;

export default function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/plans`);
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      } else {
        setError('Failed to load plans');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/pricing');
      return;
    }

    try {
      setPurchasingPlanId(planId);
      setError(null);

      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to create checkout session');
        setPurchasingPlanId(null);
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError('Failed to start checkout. Please try again.');
      setPurchasingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Purchase credits to start generating amazing images and videos
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 ${
                plan.name === 'Professional Plan'
                  ? 'border-4 border-purple-500 relative'
                  : 'border border-gray-200'
              }`}
            >
              {plan.name === 'Professional Plan' && (
                <div className="bg-purple-500 text-white text-center py-2 font-semibold">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      <strong>{plan.credits_total}</strong> Total Credits
                    </span>
                  </li>

                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      <strong>{plan.credits_image}</strong> Image Credits
                    </span>
                  </li>

                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">
                      <strong>{plan.credits_video}</strong> Video Credits
                    </span>
                  </li>

                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm">
                      1 credit = 1 image
                      <br />
                      10/20/30 credits = 4s/8s/12s video
                    </span>
                  </li>

                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">Priority Support</span>
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={purchasingPlanId === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.name === 'Professional Plan'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasingPlanId === plan.id ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner />
                      <span className="ml-2">Processing...</span>
                    </span>
                  ) : (
                    'Purchase Plan'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              How Credits Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Image Generation
                  </h3>
                  <p className="text-gray-600">
                    Each image generation costs 1 credit. High-quality AI-powered
                    furniture design images.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Video Generation
                  </h3>
                  <p className="text-gray-600">
                    4-second videos: 10 credits
                    <br />
                    8-second videos: 20 credits
                    <br />
                    12-second videos: 30 credits
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Secure Payment
                  </h3>
                  <p className="text-gray-600">
                    All payments are processed securely through Stripe. Your
                    payment information is never stored on our servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    No Expiration
                  </h3>
                  <p className="text-gray-600">
                    Your credits never expire. Use them whenever you want at your
                    own pace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import API_URL from '../config/api.js';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, refreshCredits } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);
  const [redirectTimer, setRedirectTimer] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    verifyPayment(sessionId);
  }, [searchParams, token]);

  // Auto-redirect countdown after successful payment
  useEffect(() => {
    if (paymentDetails && !loading && !error && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (redirectTimer === 0) {
      navigate('/generate');
    }
  }, [paymentDetails, loading, error, redirectTimer, navigate]);

  const verifyPayment = async (sessionId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/verify-payment/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPaymentDetails(data);

        // Refresh user credits after successful payment
        if (refreshCredits) {
          await refreshCredits();
        }
      } else {
        setError(data.message || 'Failed to verify payment');
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('Failed to verify payment. Please contact support if your credits were not added.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/pricing')}
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Back to Pricing
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Success Animation */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Animated checkmark circle */}
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-lg animate-bounce">
                  <svg
                    className="h-12 w-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Payment Successful!
              </h2>
              <p className="text-gray-600 text-lg">
                Your credits have been added to your account.
              </p>
            </div>

            {/* Auto-redirect notification */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <svg className="h-5 w-5 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-purple-700 font-medium">
                  Redirecting to generate page in {redirectTimer}s...
                </p>
              </div>
            </div>

            {paymentDetails && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Payment Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      ${(paymentDetails.amountTotal / 100).toFixed(2)} {paymentDetails.currency?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                      {paymentDetails.status === 'paid' ? 'Paid' : paymentDetails.status}
                    </span>
                  </div>
                  {paymentDetails.customerEmail && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Receipt Email:</span>
                      <span className="font-medium text-gray-900 truncate max-w-xs">
                        {paymentDetails.customerEmail}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/generate')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🎨 Start Creating Now
              </button>
              <button
                onClick={() => navigate('/gallery')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                📸 View Gallery
              </button>
            </div>
          </div>
        </div>

        {/* Support Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? Contact support at{' '}
          <a href="mailto:support@decordesign.com" className="text-purple-600 hover:underline">
            support@decordesign.com
          </a>
        </p>
      </div>
    </div>
  );
}

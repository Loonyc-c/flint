import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuthStore();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    const verify = async () => {
      const result = await verifyEmail(token);
      
      if (result.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        
        // Redirect to main page after 2 seconds
        setTimeout(() => {
          navigate('/main');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [searchParams, verifyEmail, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="inline-flex p-4 rounded-full bg-blue-100">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex p-4 rounded-full bg-green-100"
            >
              <CheckCircle className="h-16 w-16 text-green-600" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex p-4 rounded-full bg-red-100"
            >
              <XCircle className="h-16 w-16 text-red-600" />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {status === 'verifying' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Actions */}
        {status === 'success' && (
          <p className="text-sm text-gray-500">
            Redirecting to your account...
          </p>
        )}
        
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#B33A2E] hover:bg-[#8B2E24] text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Go to Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Create New Account
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const EmailVerification = () => {
  const { currentUser, sendVerificationEmail, isEmailVerified } = useAuth();
  const { addToast } = useToast();
  const [verificationSent, setVerificationSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!currentUser || isEmailVerified()) {
    return null;
  }

  const handleSendVerification = async () => {
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      addToast('Failed to send verification email', 'error');
    }
  };

  const handleCheckVerification = async () => {
    try {
      setChecking(true);
      // Reload user to get latest email verification status
      await currentUser.reload();
      if (currentUser.emailVerified) {
        addToast('Email verified successfully!', 'success');
      } else {
        addToast('Email not yet verified. Please check your inbox.', 'info');
      }
    } catch (err) {
      addToast('Error checking verification status', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 bg-amber-50 border-2 border-amber-300 rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">Email Verification Required</h3>
          <p className="text-sm text-amber-800 mb-3">
            Please verify your email address to unlock all features.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSendVerification}
              disabled={resendCooldown > 0 || verificationSent}
              className={`flex items-center gap-1 text-sm px-3 py-1 rounded font-medium transition ${
                resendCooldown > 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              <Send className="w-4 h-4" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send Verification Email'}
            </button>
            <button
              onClick={handleCheckVerification}
              disabled={checking}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded font-medium bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {checking ? 'Checking...' : 'Check Status'}
            </button>
          </div>
          {verificationSent && (
            <p className="text-xs text-amber-700 mt-2">✓ Verification email sent to {currentUser.email}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EmailVerification;

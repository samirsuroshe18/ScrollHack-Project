import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from './formStyles';

const MIN_PASSWORD_LENGTH = 6;

// Landing page for the link in the password reset email
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('checking'); // checking | ready | invalid | done
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api.get('/verify/reset-password', { params: { token } })
      .then(() => { if (!cancelled) setStatus('ready'); })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err));
        setStatus('invalid');
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/verify/verify-password', { password, confirmPassword }, { params: { token } });
      setStatus('done');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Reset password</h1>

        {status === 'checking' && <p className="text-gray-300 text-center">Checking your link…</p>}

        {status === 'invalid' && (
          <div className="text-center">
            <p className="text-red-400 mb-6" role="alert">{error}</p>
            <Link to="/forgot-password" className="text-blue-500 hover:underline">Request a new link</Link>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center">
            <p className="text-green-400 mb-6">Your password has been updated.</p>
            <Link to="/login" className="text-blue-500 hover:underline">Go to login</Link>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit}>
            <label className={labelClass} htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mb-4`}
              placeholder="At least 6 characters"
              required
            />

            <label className={labelClass} htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClass} mb-4`}
              placeholder="Enter your new password again"
              required
            />

            {error && <p className={errorTextClass} role="alert">{error}</p>}

            <button type="submit" className={primaryButtonClass} disabled={submitting}>
              {submitting ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

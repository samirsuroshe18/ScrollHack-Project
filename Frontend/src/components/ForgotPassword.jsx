import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { errorTextClass, inputClass, labelClass, primaryButtonClass, successTextClass } from './formStyles';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/users/forgot-password', { email });
      setNotice(data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Forgot password</h1>

        <form onSubmit={handleSubmit}>
          <label className={labelClass} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mb-4`}
            placeholder="Enter your email"
            required
          />

          {notice && <p className={successTextClass}>{notice}</p>}
          {error && <p className={errorTextClass} role="alert">{error}</p>}

          <button type="submit" className={primaryButtonClass} disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-4 text-gray-400 text-center">
          <Link to="/login" className="text-blue-500 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

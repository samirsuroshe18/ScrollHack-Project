// src/pages/LoginPage.js
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { dashboardPathFor, useAuth } from '../context/auth';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from './formStyles';

// Function to generate a random CAPTCHA code
function generateCaptcha() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}

const Login = () => {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const resetCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (captchaInput !== captchaCode) {
      setError('Captcha is incorrect. Please try again.');
      resetCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(dashboardPathFor(loggedInUser), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      resetCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  // someone who is already logged in has no use for this page
  if (!loading && user && !submitting) {
    return <Navigate to={dashboardPathFor(user)} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Login</h1>

        <form onSubmit={handleSubmit}>
          {/* Email */}
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

          {/* Password */}
          <label className={labelClass} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} mb-2`}
            placeholder="Enter your password"
            required
          />
          <div className="mb-4 text-right">
            <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* CAPTCHA */}
          <div className="mb-4 text-gray-400 ">
            Captcha: <strong className="select-none tracking-widest">{captchaCode}</strong>
          </div>
          <input
            type="text"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            className={`${inputClass} mb-4`}
            placeholder="Enter the captcha"
            aria-label="Captcha"
            autoComplete="off"
            required
          />

          {error && <p className={errorTextClass} role="alert">{error}</p>}

          {/* Login Button */}
          <button type="submit" className={primaryButtonClass} disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        {/* Create Account Option */}
        <div className="mt-4 text-gray-400 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

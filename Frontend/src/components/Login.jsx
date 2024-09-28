// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const navigate = useNavigate();

  // Function to generate a random CAPTCHA code
  function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (captchaInput === captchaCode) {
      // Handle successful login logic here (e.g., redirect to dashboard)
      navigate('/dashboard'); // Navigate to the dashboard
    } else {
      alert('Captcha is incorrect. Please try again.');
      setCaptchaCode(generateCaptcha()); // Regenerate CAPTCHA if incorrect
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Login</h1>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <label className="block text-gray-400 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
            required
          />

          {/* Password */}
          <label className="block text-gray-400 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            required
          />

          {/* CAPTCHA */}
          <div className="mb-4 text-gray-400 text-center">
            Captcha: <strong>{captchaCode}</strong>
          </div>
          <input
            type="text"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the captcha"
            required
          />

          {/* Login Button */}
          <button type="submit" className="w-full bg-blue-600 p-3 rounded-lg text-white hover:bg-blue-500">
            Login
          </button>
        </form>

        {/* Create Account Option */}
        <div className="mt-4 text-gray-400 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

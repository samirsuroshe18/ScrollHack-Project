// src/pages/LoginPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Login</h1>

        {/* Email */}
        <label className="block text-gray-400 mb-2">Email</label>
        <input
          type="email"
          className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
        />

        {/* Password */}
        <label className="block text-gray-400 mb-2">Password</label>
        <input
          type="password"
          className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your password"
        />

        {/* CAPTCHA Placeholder */}
        <div className="mb-4 text-gray-400 text-center">[CAPTCHA Here]</div>

        {/* Login Button */}
        <button className="w-full bg-blue-600 p-3 rounded-lg text-white hover:bg-blue-500">
          Login
        </button>

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

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';

// Landing page for the link in the verification email
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | verified | failed
  const [message, setMessage] = useState('');
  // the link works once; StrictMode runs effects twice in development
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    api.get('/verify/verify-email', { params: { token } })
      .then(() => setStatus('verified'))
      .catch((err) => {
        setMessage(errorMessage(err));
        setStatus('failed');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Email verification</h1>

        {status === 'verifying' && <p className="text-gray-300">Verifying…</p>}

        {status === 'verified' && (
          <>
            <p className="text-green-400 mb-6">Your email is verified. You can log in now.</p>
            <Link to="/login" className="text-blue-500 hover:underline">Go to login</Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <p className="text-red-400 mb-2" role="alert">{message}</p>
            <p className="text-gray-300 mb-6">Log in to get a new link.</p>
            <Link to="/login" className="text-blue-500 hover:underline">Go to login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

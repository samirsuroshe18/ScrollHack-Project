// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/Landingpage';
import Login from './components/Login';
import RegisterPage from './components/RegisterAccount'; 
import Preloader from './components/Preloader';
import StudentDashboard from './components/StudentDashboard';
import AlumniDashboard from './components/AlumniDashboard';
import { PostProvider } from './components/PostContext';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000); 
    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, []);

  return (
    <>
      {loading ? (
        <Preloader />
      ) : (
        <Router>
          <PostProvider>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />  
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/alumni" element={<AlumniDashboard />} />
            </Routes>
          </PostProvider>
        </Router>
      )}
    </>
  );
}

export default App;

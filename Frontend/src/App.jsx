// src/App.js
import React, {useState, useEffect} from 'react';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/Landingpage';
import Login from './components/Login';  // Ensure this path is correct
import RegisterPage from './components/RegisterAccount'; 
import Preloader from './components/Preloader';

function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 3000); 
  }, []);


  return (
    <>
    {loading ? <Preloader /> :
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />  {/* This path should match exactly */}

        {/* Register Page */}
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router> 
}
    </>
  );
}

export default App;

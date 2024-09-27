// src/LandingPage.js
import React, { useEffect, useRef } from 'react';
import Typed from 'typed.js';
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';

const LandingPage = () => {
  const typedRef = useRef(null);

  useEffect(() => {
    const options = {
      strings: ["Connect with Alumni", "Grow Together", "Build Your Future"],
      typeSpeed: 90,
      backSpeed: 25,
      loop: true,
    };

    const typed = new Typed(typedRef.current, options);

    return () => {
      typed.destroy();
    };
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col justify-between text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">AlumniNest</h1>
        <h2 className="text-xl md:text-2xl mb-8 text-center">
          <span ref={typedRef}></span>
        </h2>
        <a
          href="/signup"
          className="px-6 py-3 bg-blue-600 rounded-lg text-lg hover:bg-blue-500 transition duration-300"
        >
          Connect Now
        </a>
      </section>

      {/* Introduction Section */}
      <section className="py-12 bg-gray-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">Why Choose AlumniNest?</h3>
          <p className="text-lg mb-6">
            AlumniNest is a platform designed to foster meaningful connections
            between alumni and current students. Engage in networking, career
            growth, and community-building initiatives that support both personal and professional development.
          </p>
        </div>
      </section>

      {/* Social Links */}
      <section className="flex justify-center py-6 bg-gray-800">
        <div className="flex space-x-6">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl hover:text-blue-500 transition duration-300"
          >
            <FaFacebook />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl hover:text-blue-500 transition duration-300"
          >
            <FaTwitter />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl hover:text-blue-500 transition duration-300"
          >
            <FaLinkedin />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-gray-900 text-center">
        <p className="text-sm">&copy; 2024 AlumniNest. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

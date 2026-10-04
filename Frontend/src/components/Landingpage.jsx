// src/LandingPage.js
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Typed from 'typed.js';
import { FaGithub } from 'react-icons/fa';
import Logo from '../assets/logo.png';

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
    <div className="bg-gray-900 min-h-dvh flex flex-col justify-between text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-dvh px-4 text-center">
        <img src={Logo} alt="AlumniNest Logo" className="h-32 sm:h-40 w-auto max-w-full"/>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">AlumniNest</h1><br/>
        <h2 className="text-xl md:text-2xl mb-8 text-center">
          <span ref={typedRef}></span>
        </h2>
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 rounded-lg text-lg hover:bg-blue-500 transition duration-300"
        >
          Connect Now
        </Link>
      </section>

      {/* Introduction Section */}
      <section className="py-12 px-4 bg-gray-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">Why Choose AlumniNest?</h3>
          <p className="text-lg mb-6">
            AlumniNest is a platform designed to foster meaningful connections
            between alumni and current students. Engage in networking, career
            growth, and community-building initiatives that support both personal and professional development.
          </p>
        </div>
      </section>

      {/* Source */}
      <section className="flex justify-center py-6 bg-gray-800">
        <a
          href="https://github.com/samirsuroshe18/alumninest"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="AlumniNest on GitHub"
          className="text-3xl hover:text-blue-500 transition duration-300"
        >
          <FaGithub />
        </a>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-gray-900 text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} AlumniNest</p>
      </footer>
    </div>
  );
};

export default LandingPage;

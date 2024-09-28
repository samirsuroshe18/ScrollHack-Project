import React, { useState } from 'react';
import logo from '../assets/logo.png';
import { usePosts } from './PostContext';
import axios from 'axios';
// import { loadStripe } from '@stripe/stripe-js';

// const stripePromise = loadStripe('your-stripe-publishable-key');

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState('Profile');
  const { posts } = usePosts();
  const [mentorPrompt, setMentorPrompt] = useState('');
  const [mentorResults, setMentorResults] = useState([]);

  const handleFindMentor = async () => {
    try {
      const response = await axios.post('/api/findMentor', { prompt: mentorPrompt });
      setMentorResults(response.data); 
      console.log('Mentor search results:', response.data);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  // Function to handle subscription (Stripe integration)
  const handleSubscribe = async (mentor) => {
    const stripe = await stripePromise;

    try {
      const response = await axios.post('/api/create-checkout-session', {
        priceId: mentor.priceId, // Assuming each mentor has a priceId
        studentId: 'student123', // Replace with the actual student ID
        mentorId: mentor.id, // Mentor's ID
      });

      const { id } = response.data;
      const { error } = await stripe.redirectToCheckout({ sessionId: id });

      if (error) {
        console.error('Stripe Error:', error);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  // Alumni cards for 1:1 mentorship subscription
  const alumniCards = () => {
    const alumniList = [
      // Replace with actual alumni data or fetch from API
      { id: 'mentor1', name: 'John Doe', expertise: 'Web Development', location: 'New York', priceId: 'price_12345' },
      { id: 'mentor2', name: 'Jane Smith', expertise: 'Data Science', location: 'San Francisco', priceId: 'price_67890' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alumniList.map((mentor, index) => (
          <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">{mentor.name}</h3>
            <p>{mentor.expertise}</p>
            <p>{mentor.location}</p>
            <button
              className="bg-purple-600 text-white py-2 px-4 mt-4 rounded"
              onClick={() => handleSubscribe(mentor)}
            >
              Subscribe
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'Profile':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Alumni Profile</h2>
            <input type="text" placeholder="Name" className="w-full p-2 mb-2 border border-gray-300 rounded" />
            <input type="text" placeholder="Field of Expertise" className="w-full p-2 mb-2 border border-gray-300 rounded" />
            <input type="text" placeholder="Location" className="w-full p-2 mb-2 border border-gray-300 rounded" />
            <input type="text" placeholder="Years of Experience" className="w-full p-2 mb-2 border border-gray-300 rounded" />
            <textarea placeholder="Additional Info" className="w-full p-2 mb-2 border border-gray-300 rounded" rows="4"></textarea>
            <button className="bg-purple-600 text-white py-2 px-4 rounded">Save Profile</button>
          </div>
        );
      case 'Success Story':
        return (
          <div>
            {posts.filter(post => post.type === 'Success Story').length > 0 ? (
              posts.filter(post => post.type === 'Success Story').map((post, index) => (
                <div key={index} className="mb-4 border-b border-gray-300 pb-4">
                  <h2 className="text-lg font-semibold text-yellow-500">{post.type}</h2>
                  <p className="text-gray-800">{post.content}</p>
                </div>
              ))
            ) : (
              <div>No success stories available.</div>
            )}
          </div>
        );
      case 'Institute':
        return <div>Institute Content</div>;
      case 'Job Portal':
        return (
          <div>
            {posts.filter(post => post.type === 'Job').length > 0 ? (
              posts.filter(post => post.type === 'Job').map((post, index) => (
                <div key={index} className="mb-4 border-b border-gray-300 pb-4">
                  <h2 className="text-lg font-semibold text-yellow-500">{post.type}</h2>
                  <p className="text-gray-800">{post.content}</p>
                </div>
              ))
            ) : (
              <div>No job postings available.</div>
            )}
          </div>
        );
      case 'Find Mentor':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-4">Find a Mentor</h2>
            <textarea
              value={mentorPrompt}
              onChange={(e) => setMentorPrompt(e.target.value)}
              className="w-full p-2 text-black border border-gray-300 rounded-lg mb-4"
              rows="4"
              placeholder="Describe the type of mentor you need..."
            />
            <button
              className="bg-purple-600 text-white py-2 px-4 rounded"
              onClick={handleFindMentor}
            >
              Search
            </button>
            {mentorResults.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Mentor Matches:</h3>
                {mentorResults.map((mentor, index) => (
                  <div key={index} className="border border-gray-300 p-4 mb-2">
                    <p className="font-bold">{mentor.name}</p>
                    <p>{mentor.expertise} - {mentor.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case '1:1 Mentorship':
        return (
          <div className='text-black'>
            <h2 className="text-lg font-semibold mb-4">Available Mentors for 1:1 Mentorship</h2>
            {alumniCards()}
          </div>
        );
      default:
        return <div>Profile Content</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-64 bg-gray-800 text-white flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-center py-6">
            <img src={logo} alt="AlumniNest Logo" className="w-16 h-16 mr-2" />
            <span className="text-2xl font-bold">AlumniNest</span>
          </div>
          <ul className="mt-4 space-y-1">
            <li
              className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === 'Profile' ? 'bg-yellow-600 rounded-lg' : ''}`}
              onClick={() => setActiveSection('Profile')}
            >
              Profile
            </li>
            <li
              className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === 'Success Story' ? 'bg-yellow-600 rounded-lg' : ''}`}
              onClick={() => setActiveSection('Success Story')}
            >
              Success Story
            </li>
            <li
              className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === 'Institute' ? 'bg-yellow-600 rounded-lg' : ''}`}
              onClick={() => setActiveSection('Institute')}
            >
              Institute
            </li>
            <li
              className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === 'Job Portal' ? 'bg-yellow-600 rounded-lg' : ''}`}
              onClick={() => setActiveSection('Job Portal')}
            >
              Job Portal
            </li>
            <li
              className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === 'Find Mentor' ? 'bg-yellow-600 rounded-lg' : ''}`}
              onClick={() => setActiveSection('Find Mentor')}
            >
              Find Mentor
            </li>
            <li
              className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === 'Survey' ? 'bg-yellow-600 rounded-lg' : ''}`}
              onClick={() => setActiveSection('Survey')}
            >
              Survey
            </li>
            <li
              className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === '1:1 Mentorship' ? 'bg-yellow-600 rounded-lg' : ''}`}
              onClick={() => setActiveSection('1:1 Mentorship')}
            >
              1:1 Mentorship
            </li>
          </ul>
        </div>
        <div className="mb-6 px-8">
          <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg shadow-md transition duration-200">
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-900 p-10">
        <header className="text-3xl font-semibold text-white mb-6">{activeSection}</header>
        <div className="bg-white shadow-md rounded-lg p-8">
          {renderSectionContent()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;

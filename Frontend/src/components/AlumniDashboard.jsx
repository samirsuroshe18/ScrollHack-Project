import React, { useState } from 'react';
import logo from '../assets/logo.png';
import { usePosts } from './PostContext';

const AlumniDashboard = () => {
    const { addPost } = usePosts();

    const [activeSection, setActiveSection] = useState('Profile');
    const [successStory, setSuccessStory] = useState('');
    const [jobPost, setJobPost] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    // Profile fields
    const [alumniData, setAlumniData] = useState({
        name: '',
        email: '',
        profession: '',
        skills: '',
        location: '',
        availability: '',
    });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setAlumniData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handlePostSuccessStory = () => {
        if (successStory.trim() !== '') {
            const newPost = { type: 'Success Story', content: successStory };
            addPost(newPost);
            console.log('Success story posted:', newPost);
            setSuccessStory(''); // Clear the input
        }
    };

    const handlePostJob = () => {
        if (jobPost.trim() !== '') {
            const newPost = { type: 'Job', content: jobPost };
            addPost(newPost);
            console.log('Job posted:', newPost);
            setJobPost(''); // Clear the input
        }
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'Profile':
                return (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Alumni Profile</h2>
                        <input
                            type="text"
                            name="name"
                            value={alumniData.name}
                            onChange={handleProfileChange}
                            className="w-full text-black p-2 border border-gray-300 rounded-lg mb-4"
                            placeholder="Name"
                        />
                        <input
                            type="email"
                            name="email"
                            value={alumniData.email}
                            onChange={handleProfileChange}
                            className="w-full text-black p-2 border border-gray-300 rounded-lg mb-4"
                            placeholder="Email"
                        />
                        <input
                            type="text"
                            name="profession"
                            value={alumniData.profession}
                            onChange={handleProfileChange}
                            className="w-full text-black p-2 border border-gray-300 rounded-lg mb-4"
                            placeholder="Profession"
                        />
                        <input
                            type="text"
                            name="skills"
                            value={alumniData.skills}
                            onChange={handleProfileChange}
                            className="w-full text-black p-2 border border-gray-300 rounded-lg mb-4"
                            placeholder="Skills (comma separated)"
                        />
                        <input
                            type="text"
                            name="location"
                            value={alumniData.location}
                            onChange={handleProfileChange}
                            className="w-full text-black p-2 border border-gray-300 rounded-lg mb-4"
                            placeholder="Location"
                        />
                        <input
                            type="text"
                            name="availability"
                            value={alumniData.availability}
                            onChange={handleProfileChange}
                            className="w-full text-black p-2 border border-gray-300 rounded-lg mb-4"
                            placeholder="Availability"
                        />
                        <input 
                            type='submit'
                            value='Update'
                            className='px-6 py-3 bg-blue-600 rounded-lg text-lg hover:bg-blue-500 transition duration-300'
                            name='submitdata'
                        />
                    </div>
                );
            case 'Success Story':
                return (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Post Your Success Story</h2>
                        <textarea
                            value={successStory}
                            onChange={(e) => setSuccessStory(e.target.value)}
                            className="w-full p-2 text-black border border-gray-300 rounded-lg mb-4"
                            rows="4"
                            placeholder="Share your success story here..."
                        />
                        <button
                            className="bg-purple-600 text-white py-2 px-4 rounded-lg"
                            onClick={handlePostSuccessStory}
                        >
                            Post
                        </button>
                    </div>
                );
            case 'Institute':
                return <div>Institute Content</div>;
            case 'Job Portal':
                return (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Post a Job</h2>
                        <textarea
                            value={jobPost}
                            onChange={(e) => setJobPost(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                            rows="4"
                            placeholder="Describe the job opportunity here..."
                        />
                        <button
                            className="bg-purple-600 text-white py-2 px-4 rounded-lg"
                            onClick={handlePostJob}
                        >
                            Post Job
                        </button>
                    </div>
                );
            case '1:1 Mentorship':
                return (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">1:1 Mentorship Chat</h2>
                        <div className="mb-4 border border-gray-300 rounded-lg p-4 h-64 overflow-y-auto">
                            {chatMessages.map((msg, index) => (
                                <div key={index} className="mb-2">
                                    <strong>{msg.sender}: </strong>{msg.text}
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="Type your message here..."
                        />
                        <button
                            className="mt-2 bg-purple-600 text-white py-2 px-4 rounded-lg"
                            onClick={() => {
                                const newMessage = { sender: 'You', text: chatInput };
                                setChatMessages([...chatMessages, newMessage]);
                                setChatInput('');
                            }}
                        >
                            Send
                        </button>
                    </div>
                );
            case 'Survey':
                return <div>Survey Content</div>;
            default:
                return <div>Profile Content</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col justify-between shadow-lg">
                <div>
                    {/* Logo and name */}
                    <div className="flex items-center justify-center py-8">
                        <img src={logo} alt="AlumniNest Logo" className="w-16 h-16 mr-2" />
                        <span className="text-2xl font-bold">AlumniNest</span>
                    </div>

                    {/* Sidebar menu */}
                    <ul className="mt-4 space-y-4">
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
                            className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === '1:1 Mentorship' ? 'bg-yellow-600 rounded-lg' : ''}`}
                            onClick={() => setActiveSection('1:1 Mentorship')}
                        >
                            1:1 Mentorship
                        </li>
                        <li
                            className={`px-8 py-3 cursor-pointer hover:bg-purple-700 transition-all ${activeSection === 'Survey' ? 'bg-yellow-600 rounded-lg' : ''}`}
                            onClick={() => setActiveSection('Survey')}
                        >
                            Give Survey
                        </li>
                    </ul>
                </div>

                {/* Footer/Logout */}
                <div className="mb-8 px-8">
                    <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg shadow-md transition duration-200">
                        Logout
                    </button>
                </div>
            </aside>

            

            {/* Main Content */}
            <main className="flex-1 bg-gray-900 p-10">
                <header className="text-3xl font-semibold text-white mb-8">{activeSection}</header>
                <div className="bg-gray-800 shadow-md rounded-lg p-8">
                    {renderSectionContent()}
                </div>
            </main>
        </div>
    );
};

export default AlumniDashboard;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNo: '',
    studentAlumni: '',
    state: '',
    district: '',
    profession: '',
    field: '',
    passingYear: '',
    workplace: '',
  });

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    const fetchStates = async () => {
        try {
            const response = await fetch('/assets/data.json'); // Correct path
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setStates(data.states);
        } catch (error) {
            console.error('Error fetching states:', error);
        }
    };

    fetchStates();
}, []);


  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      district: '', // Reset district when state changes
    }));

    // Filter districts based on the selected state
    const selectedDistricts = states.find(state => state.name === selectedState)?.districts || [];
    setDistricts(selectedDistricts);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Register</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Name */}
            <div>
              <label className="block text-gray-400 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Mobile No */}
            <div>
              <label className="block text-gray-400 mb-2">Mobile No</label>
              <input
                type="text"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your mobile number"
                required
              />
            </div>

            {/* Student/Alumni Selection */}
            <div>
              <label className="block text-gray-400 mb-2">Student/Alumni</label>
              <select
                name="studentAlumni"
                value={formData.studentAlumni}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select</option>
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-gray-400 mb-2">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleStateChange}
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.id} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-gray-400 mb-2">District</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.state} // Disable if no state is selected
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Profession (conditionally rendered) */}
            {formData.studentAlumni === 'alumni' && (
              <>
                <div>
                  <label className="block text-gray-400 mb-2">Profession</label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your profession"
                    required
                  />
                </div>

                {/* Field */}
                <div>
                  <label className="block text-gray-400 mb-2">Field</label>
                  <input
                    type="text"
                    name="field"
                    value={formData.field}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your field of study"
                    required
                  />
                </div>

                {/* Passing Year */}
                <div>
                  <label className="block text-gray-400 mb-2">Passing Year</label>
                  <input
                    type="text"
                    name="passingYear"
                    value={formData.passingYear}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your passing year"
                    required
                  />
                </div>

                {/* Workplace */}
                <div>
                  <label className="block text-gray-400 mb-2">Workplace</label>
                  <input
                    type="text"
                    name="workplace"
                    value={formData.workplace}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your workplace"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button className="w-full bg-blue-600 p-3 rounded-lg text-white hover:bg-blue-500">
            Register
          </button>

          {/* Login Option */}
          <div className="mt-4 text-gray-400 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

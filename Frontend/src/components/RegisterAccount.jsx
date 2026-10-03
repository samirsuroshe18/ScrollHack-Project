import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { STATES } from '../data/states';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from './formStyles';

const MIN_PASSWORD_LENGTH = 6;

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  mobileNo: '',
  studentAlumni: '',
  state: '',
  district: '',
  profession: '',
  field: '',
  passingYear: '',
  workplace: '',
};

const RegisterPage = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // set once the account exists, to show the "check your email" message
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const isAlumni = formData.studentAlumni === 'alumni';

    setSubmitting(true);
    try {
      await api.post('/users/register', {
        userName: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNo: formData.mobileNo,
        role: formData.studentAlumni,
        state: formData.state,
        district: formData.district,
        profile: isAlumni
          ? {
              profession: formData.profession,
              field: formData.field,
              passingYear: formData.passingYear,
              workplace: formData.workplace,
            }
          : {},
      });
      setRegisteredEmail(formData.email);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-white mb-6">Check your email</h1>
          <p className="text-gray-300 mb-6">
            We sent a verification link to <strong>{registeredEmail}</strong>; it is valid for 10 minutes.
          </p>
          <Link to="/login" className="text-blue-500 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Register</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Name */}
            <div>
              <label className={labelClass} htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                maxLength={80}
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className={labelClass} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                placeholder="At least 6 characters"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClass} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter your password again"
                required
              />
            </div>

            {/* Mobile No */}
            <div>
              <label className={labelClass} htmlFor="mobileNo">Mobile No</label>
              <input
                id="mobileNo"
                type="tel"
                name="mobileNo"
                maxLength={20}
                value={formData.mobileNo}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter your mobile number"
              />
            </div>

            {/* Student/Alumni */}
            <div>
              <label className={labelClass} htmlFor="studentAlumni">Student/Alumni</label>
              <select
                id="studentAlumni"
                name="studentAlumni"
                value={formData.studentAlumni}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Select</option>
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className={labelClass} htmlFor="state">State</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select State</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className={labelClass} htmlFor="district">District</label>
              <input
                id="district"
                type="text"
                name="district"
                maxLength={80}
                value={formData.district}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter your district"
              />
            </div>

            {formData.studentAlumni === 'alumni' && (
              <>
                {/* Profession */}
                <div>
                  <label className={labelClass} htmlFor="profession">Profession</label>
                  <input
                    id="profession"
                    type="text"
                    name="profession"
                    maxLength={120}
                    value={formData.profession}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your profession"
                  />
                </div>

                {/* Field */}
                <div>
                  <label className={labelClass} htmlFor="field">Field</label>
                  <input
                    id="field"
                    type="text"
                    name="field"
                    maxLength={120}
                    value={formData.field}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your field of study"
                  />
                </div>

                {/* Passing Year */}
                <div>
                  <label className={labelClass} htmlFor="passingYear">Passing Year</label>
                  <input
                    id="passingYear"
                    type="number"
                    name="passingYear"
                    min="1950"
                    max="2100"
                    value={formData.passingYear}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your passing year"
                  />
                </div>

                {/* Workplace */}
                <div>
                  <label className={labelClass} htmlFor="workplace">Workplace</label>
                  <input
                    id="workplace"
                    type="text"
                    name="workplace"
                    maxLength={120}
                    value={formData.workplace}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your workplace"
                  />
                </div>
              </>
            )}
          </div>

          {error && <p className={errorTextClass} role="alert">{error}</p>}

          {/* Submit Button */}
          <button className={primaryButtonClass} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
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

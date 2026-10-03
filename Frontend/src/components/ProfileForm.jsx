import { useState } from 'react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/auth';
import { actionButtonClass, errorTextClass, inputClass, labelClass, successTextClass } from './formStyles';

const toForm = (user) => ({
  userName: user.userName || '',
  phoneNo: user.phoneNo || '',
  profession: user.profile?.profession || '',
  field: user.profile?.field || '',
  passingYear: user.profile?.passingYear ?? '',
  workplace: user.profile?.workplace || '',
  skills: (user.profile?.skills || []).join(', '),
  location: user.profile?.location || '',
  availability: user.profile?.availability || '',
  bio: user.profile?.bio || '',
});

// Edits the logged-in user's own profile
const ProfileForm = () => {
  const { user, updateUser } = useAuth();
  const isAlumni = user.role === 'alumni';
  const [form, setForm] = useState(() => toForm(user));
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    const profile = {
      field: form.field,
      skills: form.skills,
      location: form.location,
      bio: form.bio,
    };

    if (isAlumni) {
      Object.assign(profile, {
        profession: form.profession,
        passingYear: form.passingYear,
        workplace: form.workplace,
        availability: form.availability,
      });
    }

    try {
      const { data } = await api.patch('/users/me', { userName: form.userName, phoneNo: form.phoneNo, profile });
      // the response already holds the saved profile, so no second request is needed
      updateUser(data.data.user);
      setForm(toForm(data.data.user));
      setNotice('Saved');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div>
      <label className={labelClass} htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="text"
        value={form[name]}
        onChange={handleChange}
        className={inputClass}
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold mb-1">{isAlumni ? 'Alumni Profile' : 'Student Profile'}</h2>
      <p className="text-gray-400 mb-6">{user.email}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {field('userName', 'Name', { required: true, maxLength: 80 })}
        {field('phoneNo', 'Mobile No', { type: 'tel', maxLength: 20 })}
        {isAlumni && field('profession', 'Profession', { maxLength: 120 })}
        {field('field', isAlumni ? 'Field of expertise' : 'Field of study', { maxLength: 120 })}
        {isAlumni && field('passingYear', 'Passing year', { type: 'number', min: 1950, max: 2100 })}
        {isAlumni && field('workplace', 'Workplace', { maxLength: 120 })}
        {field('skills', isAlumni ? 'Skills (comma separated)' : 'Interests (comma separated)')}
        {field('location', 'Location', { maxLength: 120 })}
        {isAlumni && field('availability', 'Availability for mentoring', { maxLength: 120, placeholder: 'For example: weekends, 10 am to 1 pm' })}
      </div>

      <div className="mb-4">
        <label className={labelClass} htmlFor="bio">About you</label>
        <textarea
          id="bio"
          name="bio"
          rows="4"
          maxLength={1000}
          value={form.bio}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {notice && <p className={successTextClass} role="status">{notice}</p>}
      {error && <p className={errorTextClass} role="alert">{error}</p>}

      <button type="submit" className={actionButtonClass} disabled={saving}>
        {saving ? 'Saving…' : 'Update'}
      </button>
    </form>
  );
};

export default ProfileForm;

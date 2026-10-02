import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import { actionButtonClass, inputClass } from './formStyles';

const REQUEST_LABELS = {
  pending: 'Requested',
  accepted: 'Accepted',
  declined: 'Declined',
};

// Lets a student describe the mentor they need, browse matches and send a request
const MentorSearch = () => {
  const [prompt, setPrompt] = useState('');
  const [mentors, setMentors] = useState([]);
  // null until the first search, then 'search' or 'all', to pick the right empty message
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // mentor id -> status of this student's request to them
  const [requestStatus, setRequestStatus] = useState({});
  const [requesting, setRequesting] = useState(null);

  const loadRequests = useCallback(async () => {
    const { data } = await api.get('/mentorships');
    const statuses = {};
    for (const mentorship of data.data.mentorships) {
      statuses[mentorship.mentor._id] = mentorship.status;
    }
    setRequestStatus(statuses);
  }, []);

  useEffect(() => {
    loadRequests().catch((err) => setError(errorMessage(err)));
  }, [loadRequests]);

  const load = async (nextMode) => {
    setError('');
    setLoading(true);
    try {
      const { data } = nextMode === 'search'
        ? await api.get('/mentors/search', { params: { q: prompt } })
        : await api.get('/mentors');
      setMentors(data.data.mentors);
      setMode(nextMode);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load('search');
  };

  const handleRequest = async (mentor) => {
    setError('');
    setRequesting(mentor._id);
    try {
      await api.post('/mentorships', { mentorId: mentor._id });
      setRequestStatus((prev) => ({ ...prev, [mentor._id]: 'pending' }));
    } catch (err) {
      setError(errorMessage(err));
      // the request may already exist, for example from another tab
      loadRequests().catch(() => {});
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Find a Mentor</h2>

      <form onSubmit={handleSearch} className="mb-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className={inputClass}
          rows="3"
          placeholder="Describe the type of mentor you need..."
          aria-label="Describe the type of mentor you need"
        />
        <div className="flex flex-wrap gap-3 mt-2">
          <button type="submit" className={actionButtonClass} disabled={loading || !prompt.trim()}>
            Search
          </button>
          <button
            type="button"
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg disabled:opacity-60"
            onClick={() => load('all')}
            disabled={loading}
          >
            Show all mentors
          </button>
        </div>
      </form>

      {error && <p className="text-red-400 mb-4" role="alert">{error}</p>}

      {loading && <p className="text-gray-400">Loading…</p>}

      {!loading && mode === 'search' && mentors.length === 0 && (
        <p className="text-gray-400">No mentors matched. Try different words, or show all mentors.</p>
      )}

      {!loading && mode === 'all' && mentors.length === 0 && (
        <p className="text-gray-400">No mentors have joined yet.</p>
      )}

      {!loading && mentors.length > 0 && (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mentors.map((mentor) => {
            const status = requestStatus[mentor._id];
            const profile = mentor.profile || {};
            return (
              <li key={mentor._id} className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col">
                <h3 className="text-lg font-semibold text-yellow-500">{mentor.userName}</h3>
                <p className="text-sm text-gray-300">
                  {[profile.profession, profile.workplace].filter(Boolean).join(' at ') || 'Alumnus'}
                </p>
                {profile.location && <p className="text-sm text-gray-400">{profile.location}</p>}

                {profile.skills?.length > 0 && (
                  <ul className="flex flex-wrap gap-2 mt-3" aria-label="Skills">
                    {profile.skills.map((skill) => (
                      <li key={skill} className="text-xs bg-gray-800 text-gray-200 px-2 py-1 rounded">
                        {skill}
                      </li>
                    ))}
                  </ul>
                )}

                {profile.bio && <p className="text-sm mt-3 break-words">{profile.bio}</p>}
                {profile.availability && (
                  <p className="text-sm text-gray-400 mt-2">Available: {profile.availability}</p>
                )}

                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    className={actionButtonClass}
                    onClick={() => handleRequest(mentor)}
                    disabled={Boolean(status) || requesting === mentor._id}
                  >
                    {status ? REQUEST_LABELS[status] : 'Request mentorship'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MentorSearch;

import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';
import { actionButtonClass } from './formStyles';

const studentSummary = (student) =>
  [student.profile?.field, student.profile?.location].filter(Boolean).join(' · ');

// Lets an alumnus accept or decline mentorship requests from students
const MentorshipRequests = () => {
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(null);

  const load = useCallback(async () => {
    const { data } = await api.get('/mentorships');
    setMentorships(data.data.mentorships);
  }, []);

  useEffect(() => {
    load()
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [load]);

  const respond = async (mentorship, status) => {
    setError('');
    setResponding(mentorship._id);
    try {
      await api.patch(`/mentorships/${mentorship._id}`, { status });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      // reload either way, so an answer given elsewhere shows up too
      await load().catch(() => {});
      setResponding(null);
    }
  };

  if (loading) return <p className="text-gray-400">Loading…</p>;

  const pending = mentorships.filter((mentorship) => mentorship.status === 'pending');
  const accepted = mentorships.filter((mentorship) => mentorship.status === 'accepted');

  return (
    <div>
      {error && <p className="text-red-400 mb-4" role="alert">{error}</p>}

      <h2 className="text-lg font-semibold mb-4">Pending requests</h2>
      {pending.length === 0 ? (
        <p className="text-gray-400 mb-8">No pending requests.</p>
      ) : (
        <ul className="space-y-4 mb-8">
          {pending.map((mentorship) => (
            <li key={mentorship._id} className="bg-gray-700 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-yellow-500">{mentorship.student.userName}</h3>
              {studentSummary(mentorship.student) && (
                <p className="text-sm text-gray-400">{studentSummary(mentorship.student)}</p>
              )}
              {mentorship.student.profile?.bio && (
                <p className="text-sm mt-2 break-words">{mentorship.student.profile.bio}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => respond(mentorship, 'accepted')}
                  disabled={responding === mentorship._id}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg disabled:opacity-60"
                  onClick={() => respond(mentorship, 'declined')}
                  disabled={responding === mentorship._id}
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-lg font-semibold mb-4">Your students</h2>
      {accepted.length === 0 ? (
        <p className="text-gray-400">You have not accepted any students yet.</p>
      ) : (
        <ul className="space-y-2">
          {accepted.map((mentorship) => (
            <li key={mentorship._id} className="bg-gray-700 px-4 py-3 rounded-lg">
              <span className="font-semibold">{mentorship.student.userName}</span>
              {studentSummary(mentorship.student) && (
                <span className="text-sm text-gray-400"> · {studentSummary(mentorship.student)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MentorshipRequests;

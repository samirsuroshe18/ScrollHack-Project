import { useState } from 'react';
import api, { errorMessage } from '../api/client';
import { actionButtonClass, errorTextClass, inputClass } from './formStyles';

const MAX_LENGTH = 2000;

const COPY = {
  success_story: {
    heading: 'Post Your Success Story',
    placeholder: 'Share your success story here...',
    button: 'Post',
  },
  job: {
    heading: 'Post a Job',
    placeholder: 'Describe the job opportunity here...',
    button: 'Post Job',
  },
};

// type is "success_story" or "job"; onPosted runs after a post is saved
const PostComposer = ({ type, onPosted }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const copy = COPY[type];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPosting(true);
    try {
      await api.post('/posts', { type, content });
      setContent('');
      onPosted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <h2 className="text-lg font-semibold mb-4">{copy.heading}</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={inputClass}
        rows="4"
        maxLength={MAX_LENGTH}
        placeholder={copy.placeholder}
        aria-label={copy.heading}
      />
      <div className="flex items-center justify-between mt-2">
        <button type="submit" className={actionButtonClass} disabled={posting || !content.trim()}>
          {posting ? 'Posting…' : copy.button}
        </button>
        <span className="text-sm text-gray-400">{content.length} / {MAX_LENGTH}</span>
      </div>
      {error && <p className={`${errorTextClass} mt-2`} role="alert">{error}</p>}
    </form>
  );
};

export default PostComposer;

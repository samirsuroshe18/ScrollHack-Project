import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const authorLine = (author) =>
  [author?.profile?.profession, author?.profile?.workplace].filter(Boolean).join(' at ');

// type is "success_story" or "job"; bump refreshKey to reload after a new post
const PostFeed = ({ type, refreshKey = 0 }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get('/posts', { params: { type } })
      .then(({ data }) => { if (!cancelled) setPosts(data.data.posts); })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [type, refreshKey]);

  if (loading) return <p className="text-gray-400">Loading…</p>;

  if (error) return <p className="text-red-400" role="alert">{error}</p>;

  if (posts.length === 0) return <p className="text-gray-400">No posts yet.</p>;

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post._id} className="bg-gray-700 p-4 rounded-lg shadow-md">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-yellow-500">
              {post.author?.userName || 'Former member'}
            </h3>
            <time className="text-sm text-gray-400" dateTime={post.createdAt}>
              {formatDate(post.createdAt)}
            </time>
          </div>
          {authorLine(post.author) && (
            <p className="text-sm text-gray-400 mb-2">{authorLine(post.author)}</p>
          )}
          <p className="whitespace-pre-line break-words">{post.content}</p>
        </li>
      ))}
    </ul>
  );
};

export default PostFeed;

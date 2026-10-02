import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/auth';
import { actionButtonClass, inputClass } from './formStyles';

const MAX_LENGTH = 1000;

const formatTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// history and live messages can arrive in either order, so they are always merged by id
const mergeMessages = (current, incoming) => {
  const byId = new Map(current.map((message) => [message._id, message]));
  for (const message of incoming) byId.set(message._id, message);
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// One-to-one chat for accepted mentorships, used by both dashboards
const ChatPanel = () => {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  // the socket handler outlives renders, so it reads the open conversation from a ref
  const activeIdRef = useRef(null);
  const bottomRef = useRef(null);

  // the person on the other side of a mentorship
  const partnerOf = (mentorship) =>
    mentorship.student._id === user._id ? mentorship.mentor : mentorship.student;

  // loads the saved messages of a conversation, unless the user has moved on by the time they arrive
  const loadHistory = useCallback((mentorshipId) => {
    api.get(`/mentorships/${mentorshipId}/messages`)
      .then(({ data }) => {
        if (activeIdRef.current !== mentorshipId) return;
        setMessages((prev) => mergeMessages(prev, data.data.messages));
      })
      .catch((err) => {
        if (activeIdRef.current === mentorshipId) setError(errorMessage(err));
      });
  }, []);

  // one socket for the life of the panel
  useEffect(() => {
    const socket = io({ withCredentials: true });
    socketRef.current = socket;

    const rejoin = () => {
      setConnected(true);
      // rooms are lost on reconnect, and messages sent meanwhile were missed
      if (activeIdRef.current) {
        socket.emit('chat:join', { mentorshipId: activeIdRef.current });
        loadHistory(activeIdRef.current);
      }
    };

    socket.on('connect', rejoin);
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:message', (message) => {
      if (message.mentorship !== activeIdRef.current) return;
      setMessages((prev) => mergeMessages(prev, [message]));
    });

    return () => {
      socket.close();
    };
  }, [loadHistory]);

  // conversations
  useEffect(() => {
    api.get('/mentorships')
      .then(({ data }) => {
        const accepted = data.data.mentorships.filter((mentorship) => mentorship.status === 'accepted');
        setMentorships(accepted);
        if (accepted.length > 0) setActiveId(accepted[0]._id);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // history and room for the open conversation
  useEffect(() => {
    activeIdRef.current = activeId;
    setMessages([]);
    if (!activeId) return;

    let cancelled = false;
    setError('');

    loadHistory(activeId);

    socketRef.current?.emit('chat:join', { mentorshipId: activeId }, (reply) => {
      if (!cancelled && reply && !reply.ok) setError(reply.error);
    });

    return () => { cancelled = true; };
  }, [activeId, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeId) return;

    setError('');
    socketRef.current.emit('chat:send', { mentorshipId: activeId, text: trimmed }, (reply) => {
      if (reply?.ok) {
        setText('');
      } else {
        setError(reply?.error || 'Message could not be sent.');
      }
    });
  };

  if (loading) return <p className="text-gray-400">Loading…</p>;

  if (mentorships.length === 0) {
    return (
      <div>
        {error && <p className="text-red-400 mb-4" role="alert">{error}</p>}
        <p className="text-gray-400">No active mentorships yet.</p>
      </div>
    );
  }

  const active = mentorships.find((mentorship) => mentorship._id === activeId);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Conversations */}
      <ul className="md:w-56 shrink-0 space-y-2" aria-label="Conversations">
        {mentorships.map((mentorship) => (
          <li key={mentorship._id}>
            <button
              type="button"
              aria-current={mentorship._id === activeId ? 'true' : undefined}
              className={`w-full text-left px-4 py-3 rounded-lg hover:bg-purple-700 transition-all ${mentorship._id === activeId ? 'bg-yellow-600' : 'bg-gray-700'}`}
              onClick={() => setActiveId(mentorship._id)}
            >
              {partnerOf(mentorship).userName}
            </button>
          </li>
        ))}
      </ul>

      {/* Open conversation */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold mb-4">
          {active ? `Chat with ${partnerOf(active).userName}` : '1:1 Mentorship Chat'}
        </h2>

        <div className="mb-4 border border-gray-600 rounded-lg p-4 h-80 overflow-y-auto" aria-live="polite">
          {messages.length === 0 && <p className="text-gray-400">No messages yet. Say hello!</p>}
          {messages.map((message) => {
            const mine = message.sender === user._id;
            return (
              <div key={message._id} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-lg ${mine ? 'bg-purple-600' : 'bg-gray-700'}`}>
                  <p className="whitespace-pre-line break-words">{message.text}</p>
                  <time className="block text-xs text-gray-300 mt-1" dateTime={message.createdAt}>
                    {formatTime(message.createdAt)}
                  </time>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-red-400 mb-2" role="alert">{error}</p>}
        {!connected && <p className="text-gray-400 mb-2">Connecting…</p>}

        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputClass}
            maxLength={MAX_LENGTH}
            placeholder="Type your message here..."
            aria-label="Message"
          />
          <button type="submit" className={actionButtonClass} disabled={!connected || !text.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;

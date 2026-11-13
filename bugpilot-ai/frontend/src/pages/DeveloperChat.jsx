import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DeveloperChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedBugId, setSelectedBugId] = useState(null);
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadBugReports();
  }, []);

  useEffect(() => {
    if (selectedBugId) {
      loadMessages(selectedBugId);
    }
  }, [selectedBugId]);

  const loadBugReports = async () => {
    try {
      const response = await api.get('/bug-reports/');
      setBugReports(response);
      if (response.length > 0 && !selectedBugId) {
        setSelectedBugId(response[0].id);
      }
    } catch (err) {
      console.error('Failed to load bug reports:', err);
    }
  };

  const loadMessages = async (bugId) => {
    try {
      const response = await api.get(`/chat/${bugId}`);
      setMessages(response);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !selectedBugId) return;

    const message = input.trim();
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat/', {
        bug_report_id: selectedBugId,
        message
      });
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">Developer Chat</h2>
        <select
          value={selectedBugId || ''}
          onChange={(e) => setSelectedBugId(Number(e.target.value))}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a bug report</option>
          {bugReports.map((bug) => (
            <option key={bug.id} value={bug.id}>
              [{bug.severity}] {bug.title}
            </option>
          ))}
        </select>
      </div>

      {!selectedBugId ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p>Select a bug report to start chatting</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-slate-800/50 rounded-lg">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender_id === user.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    msg.sender_id === user.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="px-4 py-2 rounded-lg bg-slate-700 text-white">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

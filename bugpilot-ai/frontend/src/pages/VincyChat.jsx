import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { api } from '../api/client';
import { Link, useSearchParams } from 'react-router-dom';

export default function VincyChat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      const response = await api.get('/chat/ai/history');
      setMessages(response);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
    api.get('/projects/').then((items) => {
      setProjects(items);
      const requestedProject = searchParams.get('project');
      if (requestedProject && items.some((item) => String(item.id) === requestedProject)) {
        setProjectId(requestedProject);
      } else if (items.length) setProjectId(String(items[0].id));
    }).catch(() => {});
  }, [searchParams]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError('');
    const localUser = { id: `local-${Date.now()}`, message: userMessage, is_ai: false };
    setMessages((prev) => [...prev, localUser]);

    try {
      const response = await api.post('/chat/ai', {
        message: userMessage,
        project_id: projectId ? Number(projectId) : null
      });

      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Vincy could not inspect the project. Please try again.');
      setMessages((prev) => prev.filter((msg) => msg.id !== localUser.id));
      setInput(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <h2 className="text-2xl font-semibold text-white mb-4">Chat with Vincy</h2>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label htmlFor="vincy-project" className="text-sm text-slate-300">Project context</label>
        <select id="vincy-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
          <option value="">No uploaded project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        {!projects.length && <a href="/qa/upload" className="text-sm text-sky-300 hover:text-sky-200">Upload a project ZIP to let Vincy inspect it</a>}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-slate-800/50 rounded-lg">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p>{projectId ? 'Describe an issue and Vincy will inspect the selected project and draft a bug report.' : 'Upload a project ZIP, then describe an issue for Vincy to inspect.'}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.is_ai ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${
                msg.is_ai ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.is_ai ? 'bg-purple-600' : 'bg-blue-600'
                }`}
              >
                {msg.is_ai ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  msg.is_ai
                    ? 'bg-slate-700 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.message}</p>
                {msg.generated_report && (
                  <Link to={`/qa/reports`} className="mt-2 inline-block text-sm text-sky-300 underline">
                    View saved report #{msg.generated_report.id}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
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

      {error && <p role="alert" className="mb-2 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a bug or ask for help..."
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
    </div>
  );
}

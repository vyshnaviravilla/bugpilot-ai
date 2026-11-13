import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TeamChat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/chat/contacts').then((rows) => {
      setContacts(rows);
      const requested = searchParams.get('contact');
      if (requested && rows.some((person) => String(person.id) === requested)) setContactId(requested);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [searchParams]);

  const loadMessages = useCallback(async (id, silent = false) => {
    if (!id) return;
    try {
      const rows = await api.get(`/chat/direct/${id}`);
      setMessages(rows);
      if (!silent) setError('');
    } catch (err) {
      if (!silent) setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!contactId) { setMessages([]); return undefined; }
    setMessages([]);
    loadMessages(contactId);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages(contactId, true);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [contactId, loadMessages]);

  const send = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || !contactId || sending) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/chat/direct/${contactId}`, { message });
      setInput('');
      await loadMessages(contactId, true);
    } catch (err) {
      setError(err.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const active = contacts.find((person) => String(person.id) === contactId);

  return (
    <section className="flex h-[calc(100vh-200px)] min-h-[420px] flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team chat</h1>
          <p className="mt-1 text-sm text-slate-400">Direct conversations with QA, developers, and employers.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          Chat with
          <select value={contactId} onChange={(event) => setContactId(event.target.value)}
            className="max-w-64 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white">
            <option value="">Choose a person</option>
            {contacts.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.role}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-3 rounded-lg border border-white/[0.07] bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
        {active ? <><strong className="text-white">{active.name}</strong> · {active.role} · {active.email}</>
          : user.role === 'employer' ? 'No QA engineers or developers have registered yet.' : 'No other team members or employers have registered yet.'}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-800/50 p-4">
        {!contactId && !loading && <div className="py-8 text-center text-slate-400"><MessageSquare className="mx-auto mb-3" /><p>Select someone to start a conversation.</p></div>}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-xl px-4 py-2 ${message.sender_id === user.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}>
              <p className="whitespace-pre-wrap">{message.message}</p>
              <p className="mt-1 text-right text-xs text-slate-300">{new Date(message.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={input} onChange={(event) => setInput(event.target.value)} disabled={!contactId || sending}
          placeholder={contactId ? `Message ${active?.name || 'this person'}…` : 'Choose a person to message'}
          className="input flex-1" />
        <button type="submit" disabled={!contactId || sending || !input.trim()} className="btn bg-violet-400 text-ink-950 hover:bg-violet-300 disabled:opacity-50">
          <Send size={16} /> Send
        </button>
      </form>
    </section>
  );
}

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { tokenStore, ApiError } from '../api/client';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '/api';

export default function ProjectUpload() {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [successProjectId, setSuccessProjectId] = useState(null);
  const [loadingExample, setLoadingExample] = useState('');
  const examples = [
    ['simple-react-app.zip', 'Example React App'],
    ['python-api-project.zip', 'Example Python API'],
    ['buggy-todo-react.zip', 'Buggy Todo React'],
    ['node-store-api.zip', 'Node Store API'],
    ['flask-task-api.zip', 'Flask Task API'],
    ['java-inventory-service.zip', 'Java Inventory'],
    ['vanilla-js-weather.zip', 'Weather Widget'],
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && !selected.name.toLowerCase().endsWith('.zip')) {
      setError('Only ZIP files are allowed');
      setFile(null);
      return;
    }
    setFile(selected);
    setError('');
  };

  const chooseExample = async (filename, projectName) => {
    setLoadingExample(filename);
    setError('');
    try {
      const headers = {};
      const token = tokenStore.get();
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${BASE}/projects/examples/${filename}`, { headers });
      if (!response.ok) throw new Error('Could not load this example ZIP');
      setFile(new File([await response.blob()], filename, { type: 'application/zip' }));
      setName(projectName);
    } catch (err) {
      setError(err.message || 'Could not load this example ZIP');
    } finally {
      setLoadingExample('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !name) {
      setError('Please select a file and enter a name');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);

      const token = tokenStore.get();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${BASE}/projects/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new ApiError(data.detail || 'Upload failed', res.status);
      }

      const project = await res.json();
      setSuccess('Project uploaded successfully!');
      setSuccessProjectId(project.id);
      setFile(null);
      setName('');
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-white mb-6">Upload Project</h2>
      
      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My React App"
            required
          />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
          <p className="text-sm font-medium text-slate-200">Try an example project</p>
          <p className="mt-1 text-sm text-slate-400">Choose a sample ZIP with intentional issues for Vincy to inspect.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map(([filename, projectName]) => <button key={filename} type="button"
              onClick={() => chooseExample(filename, projectName)} disabled={!!loadingExample} className="btn-ghost text-sm">
              {loadingExample === filename ? 'Loading…' : `Use ${projectName}`}
            </button>)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ZIP File
          </label>
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-slate-600 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".zip"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-slate-400">
                {file ? file.name : 'Click to select a ZIP file'}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Maximum size: 50MB
              </p>
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span>{success} <Link to={successProjectId ? `/qa/chat?project=${successProjectId}` : '/qa/chat'} className="underline">Ask Vincy about this project</Link></span>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !name}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Project'}
        </button>
      </form>
    </div>
  );
}

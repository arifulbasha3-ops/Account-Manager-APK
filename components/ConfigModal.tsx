import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, X, Database, FileSpreadsheet, Copy, CheckCircle2 } from 'lucide-react';
import { getSyncConfig, saveSyncConfig, clearSyncConfig, GOOGLE_APPS_SCRIPT_CODE } from '../services/syncService';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
        const current = getSyncConfig();
        if (current) {
            setUrl(current.url);
        }
    }
  }, [isOpen]);

  const handleSave = () => {
    setError('');
    if (!url.trim()) {
        setError("URL cannot be empty");
        return;
    }
    if (!url.startsWith('https://script.google.com')) {
        setError("Invalid URL. Must be a Google Apps Script Web App URL.");
        return;
    }

    saveSyncConfig({ url: url.trim() });
    window.location.reload(); // Reload to refresh the sync state in App.tsx
  };

  const handleDisconnect = () => {
      if (confirm("Are you sure you want to disconnect? This will remove the link to your Google Sheet.")) {
          clearSyncConfig();
          window.location.reload();
      }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Google Sheets Sync
            </h2>
            <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Step 1: Deploy App Script</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                        Create a Google Sheet, go to <b>Extensions > Apps Script</b>, paste the code below, and <b>Deploy as Web App</b> (Set access to "Anyone").
                    </p>
                    <div className="relative group">
                        <pre className="bg-gray-950 text-emerald-400 p-4 rounded-xl text-[10px] overflow-x-auto h-32 border border-gray-800">
                            {GOOGLE_APPS_SCRIPT_CODE}
                        </pre>
                        <button 
                            onClick={copyCode}
                            className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 text-xs"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Step 2: Connect URL</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Paste your deployed Web App URL here.
                    </p>
                    <input 
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-gray-800 dark:text-gray-200"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between gap-3">
             {getSyncConfig() ? (
                 <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                 >
                     Disconnect
                 </button>
             ) : (
                 <div /> 
             )}
             <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Save & Connect
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
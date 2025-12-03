'use client';

import { useState } from 'react';
import { Download, Trash2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface DataPrivacyActionsProps {
  userId: string;
  userEmail: string;
  deleteOnly?: boolean;
}

export function DataPrivacyActions({ userId, userEmail, deleteOnly = false }: DataPrivacyActionsProps) {
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/user/export-data', {
        method: 'POST',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapr-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      } else {
        alert('Failed to export data. Please try again.');
      }
    } catch (e) {
      alert('Error exporting data');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Redirect to homepage after deletion
        window.location.href = '/?deleted=true';
      } else {
        alert('Failed to delete account. Please contact support.');
      }
    } catch (e) {
      alert('Error deleting account');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (deleteOnly) {
    return (
      <>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="font-medium text-red-400">This action is irreversible!</p>
            </div>
            <p className="text-white/70 text-sm mb-4">
              All your data will be permanently deleted including: profile, listings, photos, and enhancement history.
            </p>
            <p className="text-white/70 text-sm mb-2">
              Type <strong className="text-red-400">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg mb-3"
              placeholder="Type DELETE"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Forever
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Data */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
        <div>
          <p className="font-medium">Export Your Data</p>
          <p className="text-white/50 text-sm">Download all your personal data in JSON format</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {exportLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exportSuccess ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exportLoading ? 'Exporting...' : exportSuccess ? 'Downloaded!' : 'Export Data'}
        </button>
      </div>

      {/* Request Data Deletion */}
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
        <div>
          <p className="font-medium">Delete Specific Data</p>
          <p className="text-white/50 text-sm">Request deletion of specific listings or photos</p>
        </div>
        <a
          href={`mailto:privacy@snap-r.com?subject=Data Deletion Request&body=User ID: ${userId}%0D%0AEmail: ${userEmail}%0D%0A%0D%0APlease describe what data you would like deleted:`}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
        >
          Contact Privacy Team
        </a>
      </div>
    </div>
  );
}

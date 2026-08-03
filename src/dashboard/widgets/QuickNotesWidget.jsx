// Quick Notes Widget
// Allows staff to leave quick operational notes

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function QuickNotesWidget({ onNoteSave = null }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    try {
      const saved = localStorage.getItem('cafeos_quick_notes');
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('[QuickNotesWidget] Failed to load notes:', error);
    }
  };

  const saveNotes = (updatedNotes) => {
    try {
      localStorage.setItem('cafeos_quick_notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      if (onNoteSave) {
        onNoteSave(updatedNotes);
      }
    } catch (error) {
      console.error('[QuickNotesWidget] Failed to save notes:', error);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note = {
      id: Date.now(),
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
      author: 'Current User'
    };

    const updatedNotes = [note, ...notes].slice(0, 10); // Keep only last 10 notes
    saveNotes(updatedNotes);
    setNewNote('');
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotes(updatedNotes);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <BaseWidget
      widgetType="quick_notes"
      title="Quick Notes"
      size="medium"
    >
      <div className="space-y-3">
        {/* Add Note */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddNote();
            }}
            placeholder="Add a quick note..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Add
          </button>
        </div>

        {/* Notes List */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="text-center py-4">
              <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-sm text-gray-500">No notes yet</p>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">{note.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {note.author} • {formatTime(note.timestamp)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </BaseWidget>
  );
}

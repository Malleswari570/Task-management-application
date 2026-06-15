import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Board } from '../types';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
  boardToEdit?: Board | null;
}

export const BoardModal: React.FC<BoardModalProps> = ({ isOpen, onClose, onSubmit, boardToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (boardToEdit) {
      setTitle(boardToEdit.title);
      setDescription(boardToEdit.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setError('');
  }, [boardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (title.length > 100) {
      setError('Title cannot exceed 100 characters');
      return;
    }
    if (description.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(title, description);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete board action.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" id="board-modal-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#16191d] rounded-xl shadow-2xl border border-white/5 overflow-hidden z-10" id="board-modal-container">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1e23]" id="board-modal-header">
          <h3 className="font-sans font-extrabold text-white text-base md:text-lg" id="board-modal-title">
            {boardToEdit ? 'Configure Board Details' : 'Deploy New Board'}
          </h3>
          <button 
            type="button" 
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            onClick={onClose}
            id="close-board-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4" id="board-form">
          {error && (
            <div className="p-3 bg-rose-500/10 text-rose-500 text-xs font-semibold rounded-lg border border-rose-500/20" id="board-form-error">
              {error}
            </div>
          )}

          <div className="space-y-1.5" id="board-title-field">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="board-title-input">
              Board Title <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              id="board-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Strategic Planning"
              maxLength={100}
              className="w-full px-3 py-2 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white placeholder-neutral-500"
              required
              disabled={submitting}
            />
            <div className="flex justify-between text-[11px] text-neutral-600 font-semibold font-mono">
              <span>Required</span>
              <span>{title.length}/100</span>
            </div>
          </div>

          <div className="space-y-1.5" id="board-desc-field">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="board-desc-input">
              Description <span className="text-neutral-500 font-medium">(Optional)</span>
            </label>
            <textarea
              id="board-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the target scope and team boundaries of this space..."
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white placeholder-neutral-500 resize-none"
              disabled={submitting}
            />
            <div className="flex justify-end text-[11px] text-neutral-600 font-semibold font-mono">
              <span>{description.length}/1000</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/5 flex gap-3 justify-end" id="board-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-white/5 transition rounded-lg text-sm font-bold cursor-pointer"
              disabled={submitting}
              id="cancel-board-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition flex items-center justify-center min-w-[80px] cursor-pointer"
              disabled={submitting}
              id="save-board-btn"
            >
              {submitting ? 'Saving...' : boardToEdit ? 'Save Changes' : 'Launch Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

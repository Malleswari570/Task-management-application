import React, { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    tags: string[];
  }) => Promise<void>;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  taskToEdit,
  defaultStatus = 'todo'
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Tag management
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate || '');
      setTags(taskToEdit.tags || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setDueDate('');
      setTags([]);
    }
    setTagInput('');
    setError('');
  }, [taskToEdit, isOpen, defaultStatus]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase();
    if (!cleanTag) return;
    
    if (tags.includes(cleanTag)) {
      setError('Tag already exists');
      return;
    }
    if (tags.length >= 8) {
      setError('Maximum of 8 tags allowed per task');
      return;
    }
    if (cleanTag.length > 20) {
      setError('Tag size cannot exceed 20 characters');
      return;
    }

    setTags(prev => [...prev, cleanTag]);
    setTagInput('');
    setError('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task Title is required');
      return;
    }
    if (title.length > 200) {
      setError('Title cannot exceed 200 characters');
      return;
    }
    if (description.length > 5000) {
      setError('Description cannot exceed 5000 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit({
        title,
        description,
        status,
        priority,
        dueDate,
        tags
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete task action.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" id="task-modal-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#16191d] rounded-xl shadow-2xl border border-white/5 overflow-hidden z-10 select-none animate-scale-up" id="task-modal-container">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#1a1e23]" id="task-modal-header">
          <h3 className="font-sans font-extrabold text-white text-base md:text-lg" id="task-modal-title">
            {taskToEdit ? 'Configure Task Settings' : 'Create Action Item'}
          </h3>
          <button 
            type="button" 
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            onClick={onClose}
            id="close-task-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto" id="task-form">
          {error && (
            <div className="p-3 bg-rose-500/10 text-rose-500 text-xs font-semibold rounded-lg border border-rose-500/20" id="task-form-error">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5" id="task-title-field">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="task-title-input">
              Task Title <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              id="task-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prototype login screens"
              maxLength={200}
              className="w-full px-3 py-2 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white placeholder-neutral-500"
              required
              disabled={submitting}
            />
            <div className="flex justify-between text-[11px] text-neutral-600 font-semibold font-mono">
              <span>Required</span>
              <span>{title.length}/200</span>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="task-status-priority-grid">
            <div className="space-y-1.5" id="task-status-field">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="task-status-input">
                Workflow Status
              </label>
              <select
                id="task-status-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white cursor-pointer"
                disabled={submitting}
              >
                <option value="todo" className="bg-[#16191d] text-white">To Do</option>
                <option value="in_progress" className="bg-[#16191d] text-white">In Progress</option>
                <option value="completed" className="bg-[#16191d] text-white">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5" id="task-priority-field">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="task-priority-input">
                Task Priority
              </label>
              <select
                id="task-priority-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white cursor-pointer"
                disabled={submitting}
              >
                <option value="low" className="bg-[#16191d] text-white">Low Priority</option>
                <option value="medium" className="bg-[#16191d] text-white">Medium Priority</option>
                <option value="high" className="bg-[#16191d] text-white">High Priority</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5" id="task-date-field">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="task-date-input">
              Due Date <span className="text-neutral-500 font-semibold">(Optional)</span>
            </label>
            <input
              type="date"
              id="task-date-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white cursor-pointer"
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5" id="task-desc-field">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="task-desc-input">
              Description / Notes <span className="text-neutral-500 font-semibold">(Optional)</span>
            </label>
            <textarea
              id="task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline specific tasks, links, or architectural targets..."
              maxLength={5000}
              rows={4}
              className="w-full px-3 py-2 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white placeholder-neutral-500 resize-none h-24"
              disabled={submitting}
            />
            <div className="flex justify-end text-[11px] text-neutral-600 font-semibold font-mono">
              <span>{description.length}/5000</span>
            </div>
          </div>

          {/* Tags Manager */}
          <div className="space-y-2 lg:col-span-2" id="task-tags-field">
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Categorization Tags <span className="text-neutral-500 font-medium">(Up to 8)</span>
            </label>
            <div className="flex gap-2" id="tags-builder">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add low-case tag (e.g. frontend)"
                maxLength={20}
                className="flex-1 px-3 py-1.5 border border-white/5 bg-[#0f1115] rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm text-white placeholder-neutral-500"
                disabled={submitting || tags.length >= 8}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('plus-tag-btn')?.click();
                  }
                }}
              />
              <button
                type="button"
                id="plus-tag-btn"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-white/[0.03] hover:bg-white/5 text-neutral-300 hover:text-white border border-white/5 rounded-lg text-sm font-bold flex items-center gap-1 transition cursor-pointer"
                disabled={submitting || tags.length >= 8}
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Tags Pills Container */}
            <div className="flex flex-wrap gap-1.5 pt-1.5" id="tags-pills-container">
              {tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1e23] text-indigo-400 text-xs font-semibold border border-indigo-500/20"
                  id={`tag-pill-${idx}`}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-neutral-500 hover:text-indigo-400 transition rounded-full focus:outline-none cursor-pointer"
                    id={`remove-tag-${idx}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-neutral-500 font-sans italic">No tags associated yet.</span>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/5 flex gap-3 justify-end" id="task-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-white/5 transition rounded-lg text-sm font-bold cursor-pointer"
              disabled={submitting}
              id="cancel-task-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition flex items-center justify-center min-w-[100px] cursor-pointer"
              disabled={submitting}
              id="save-task-btn"
            >
              {submitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Build Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

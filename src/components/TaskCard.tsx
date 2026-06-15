import React from 'react';
import { motion } from 'motion/react';
import { Clock, Tag, Trash2, Edit3, ChevronRight, ChevronLeft } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveStatus: (task: Task, direction: 'left' | 'right') => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onMoveStatus 
}) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low':
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dateStr);
    return dueDateObj < today && task.status !== 'completed';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      whileHover={{ y: -3, transition: { duration: 0.1 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="p-4 bg-[#1a1e23] rounded-xl border border-white/5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between group"
      id={`task-card-${task.id}`}
    >
      <div className="space-y-2" id="task-content">
        {/* Header Metadata (Tags & Priority) */}
        <div className="flex flex-wrap items-center justify-between gap-2" id="card-meta">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyles(task.priority)}`} id={`card-priority-${task.id}`}>
            {task.priority}
          </span>
          
          {/* Quick Edit/Delete Icon Buttons */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity" id="card-actions-dock">
            <button
              onClick={() => onEdit(task)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
              title="Edit Task"
              id={`edit-card-btn-${task.id}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 text-neutral-450 hover:text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer"
              title="Delete Task"
              id={`delete-card-btn-${task.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-sans font-semibold text-white text-sm leading-snug group-hover:text-indigo-400 transition-colors" id={`card-title-${task.id}`}>
          {task.title}
        </h4>

        {/* Description (Truncated) */}
        {task.description && (
          <p className="font-sans text-xs text-neutral-450 line-clamp-3 leading-relaxed whitespace-pre-wrap" id={`card-desc-${task.id}`}>
            {task.description}
          </p>
        )}
      </div>

      {/* Footer (Due Date, Tags & Column Toggles) */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2.5" id="card-footer">
        {/* Due Date & Tags line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500" id="card-footer-metrics">
          {task.dueDate ? (
            <span className={`inline-flex items-center gap-1 font-semibold ${isOverdue(task.dueDate) ? 'text-rose-400 font-extrabold animate-pulse' : 'text-neutral-400'}`} id={`due-indicator-${task.id}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(task.dueDate)}</span>
              {isOverdue(task.dueDate) && <span className="text-[9px] uppercase tracking-wider block font-black">(Overdue)</span>}
            </span>
          ) : (
            <span />
          )}

          {task.tags && task.tags.length > 0 && (
            <span className="inline-flex items-center gap-1 text-neutral-405" id={`tag-indicator-${task.id}`}>
              <Tag className="w-3.5 h-3.5" />
              <span>{task.tags.length} tag{task.tags.length > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

        {/* Tag Pills List summary - small inline */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1" id={`card-tags-list-${task.id}`}>
            {task.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-neutral-400 text-[9px] font-sans font-semibold">
                #{tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-[9px] text-neutral-500 self-center">+{task.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Column Navigation Controls */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/5" id="card-nav">
          <button
            disabled={task.status === 'todo'}
            onClick={() => onMoveStatus(task, 'left')}
            className={`p-1 flex items-center gap-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
              task.status === 'todo'
                ? 'text-neutral-700 cursor-not-allowed'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            id={`move-left-${task.id}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest pointer-events-none">
            {task.status === 'todo' ? 'TO DO' : task.status === 'in_progress' ? 'ACTIVE' : 'DONE'}
          </span>

          <button
            disabled={task.status === 'completed'}
            onClick={() => onMoveStatus(task, 'right')}
            className={`p-1 flex items-center gap-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
              task.status === 'completed'
                ? 'text-neutral-700 cursor-not-allowed'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            id={`move-right-${task.id}`}
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  Calendar,
  AlertCircle,
  Tag as TagIcon
} from 'lucide-react';
import { Board, Task, TaskStatus, TaskPriority } from '../types';
import { TaskCard } from './TaskCard';

interface BoardWorkspaceProps {
  board: Board;
  tasks: Task[];
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
  onAddTaskClick: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskStatus: (task: Task, newStatus: TaskStatus) => Promise<void>;
}

export const BoardWorkspace: React.FC<BoardWorkspaceProps> = ({
  board,
  tasks,
  onEditBoard,
  onDeleteBoard,
  onAddTaskClick,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
}) => {
  // Navigation states
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Move status handler callback
  const handleMoveStatus = async (task: Task, direction: 'left' | 'right') => {
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'completed'];
    const currentIndex = statuses.indexOf(task.status);
    let targetIndex = currentIndex;
    
    if (direction === 'left' && currentIndex > 0) {
      targetIndex--;
    } else if (direction === 'right' && currentIndex < statuses.length - 1) {
      targetIndex++;
    }

    if (targetIndex !== currentIndex) {
      await onUpdateTaskStatus(task, statuses[targetIndex]);
    }
  };

  // Compile all unique tags present on current board tasks
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    tasks.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [tasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      const matchesTag = selectedTag === 'all' || (task.tags && task.tags.includes(selectedTag));
      
      return matchesSearch && matchesPriority && matchesTag;
    });
  }, [tasks, searchQuery, priorityFilter, selectedTag]);

  // Group tasks by Kanban column
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      completed: [],
    };
    
    filteredTasks.forEach(task => {
      groups[task.status].push(task);
    });
    
    return groups;
  }, [filteredTasks]);

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f1115] overflow-hidden" id={`workspace-${board.id}`}>
      
      {/* Board Secondary Header */}
      <div className="bg-[#16191d] border-b border-white/5 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4" id="workspace-header">
        <div id="workspace-title-section">
          <div className="flex items-center gap-3" id="title-wrapper">
            <h2 className="font-sans font-extrabold text-white text-lg md:text-xl" id="board-workspace-title">
              {board.title}
            </h2>
            <div className="flex items-center gap-1.5" id="board-inline-settings">
              <button
                onClick={() => onEditBoard(board)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
                title="Configure Board details"
                id="edit-board-btn"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteBoard(board.id)}
                className="p-1.5 text-neutral-450 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                title="Delete Board space"
                id="delete-board-btn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {board.description && (
            <p className="font-sans text-xs text-neutral-400 mt-1 max-w-2xl" id="board-workspace-description">
              {board.description}
            </p>
          )}
        </div>

        {/* View Layout Toggler */}
        <div className="flex items-center gap-2 border border-white/5 p-1.5 rounded-xl bg-[#0f1115] self-start md:self-center" id="view-mode-toggle">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
              viewMode === 'kanban' 
                ? 'bg-[#1a1e23] text-white border border-white/5 shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            id="kanban-view-btn"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-[#1a1e23] text-white border border-white/5 shadow-sm' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            id="list-view-btn"
          >
            <List className="w-3.5 h-3.5" />
            <span>List Table</span>
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-[#16191d]/85 backdrop-blur-md border-b border-white/5 px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3" id="filters-bar">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md" id="search-input-field">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search tasks by title or desc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans text-xs bg-[#0f1115] text-white placeholder-neutral-500"
            id="search-input"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3" id="filters-group">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5" id="priority-filter-field">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:inline">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-white/5 rounded-xl font-sans text-xs text-neutral-300 bg-[#0f1115] focus:outline-none cursor-pointer"
              id="priority-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Tags Select */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5" id="tag-filter-field">
              <TagIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:inline">Tag:</span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-2.5 py-1.5 border border-white/5 rounded-xl font-sans text-xs text-neutral-300 bg-[#0f1115] focus:outline-none cursor-pointer"
                id="tags-select"
              >
                <option value="all">All Tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clean Filters Button */}
          {(searchQuery || priorityFilter !== 'all' || selectedTag !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setSelectedTag('all');
              }}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition px-2 py-1 cursor-pointer"
              id="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 overflow-auto p-6" id="workspace-frame">
        {viewMode === 'kanban' ? (
          
          /* KANBAN BOARD LAYOUT */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start" id="kanban-grid">
            
            {/* COLUMN: TO DO */}
            <div className="bg-[#16191d]/80 p-4 rounded-2xl flex flex-col flex-1 border border-white/5" id="column-todo">
              <div className="flex items-center justify-between mb-4 px-1" id="column-todo-header">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-500"></span>
                  <h3 className="font-sans font-bold text-white text-sm uppercase tracking-wider">To Do</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-neutral-400 text-[10px] font-mono">
                    {groupedTasks.todo.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTaskClick('todo')}
                  className="p-1 rounded bg-[#1a1e23] hover:bg-white/5 text-indigo-400 hover:text-indigo-300 border border-white/5 transition cursor-pointer"
                  title="Add Task to To Do"
                  id="add-todo-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1" id="todo-tasks-list">
                {groupedTasks.todo.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onMoveStatus={handleMoveStatus}
                  />
                ))}
                {groupedTasks.todo.length === 0 && (
                  <div className="py-8 border border-dashed border-white/5 bg-white/[0.01] rounded-xl text-center text-neutral-500 text-xs font-sans italic" id="empty-todo-indicator">
                    No active targets in queue.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN: IN PROGRESS */}
            <div className="bg-[#16191d]/80 p-4 rounded-2xl flex flex-col flex-1 border border-indigo-500/10" id="column-in-progress">
              <div className="flex items-center justify-between mb-4 px-1" id="column-in-progress-header">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <h3 className="font-sans font-bold text-white text-sm uppercase tracking-wider">In Progress</h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[10px] font-mono">
                    {groupedTasks.in_progress.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTaskClick('in_progress')}
                  className="p-1 rounded bg-[#1a1e23] hover:bg-white/5 text-indigo-400 hover:text-indigo-300 border border-white/5 transition cursor-pointer"
                  title="Add Task to In Progress"
                  id="add-inprogress-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1" id="inprogress-tasks-list">
                {groupedTasks.in_progress.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onMoveStatus={handleMoveStatus}
                  />
                ))}
                {groupedTasks.in_progress.length === 0 && (
                  <div className="py-8 border border-dashed border-indigo-500/10 bg-white/[0.01] rounded-xl text-center text-neutral-500 text-xs font-sans italic" id="empty-inprogress-indicator">
                    No tasks currently active.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN: COMPLETED */}
            <div className="bg-[#16191d]/80 p-4 rounded-2xl flex flex-col flex-1 border border-emerald-500/10" id="column-completed">
              <div className="flex items-center justify-between mb-4 px-1" id="column-completed-header">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="font-sans font-bold text-white text-sm uppercase tracking-wider">Completed</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono">
                    {groupedTasks.completed.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTaskClick('completed')}
                  className="p-1 rounded bg-[#1a1e23] hover:bg-white/5 text-indigo-400 hover:text-indigo-300 border border-white/5 transition cursor-pointer"
                  title="Add Task to Completed"
                  id="add-completed-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1" id="completed-tasks-list">
                {groupedTasks.completed.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onMoveStatus={handleMoveStatus}
                  />
                ))}
                {groupedTasks.completed.length === 0 && (
                  <div className="py-8 border border-dashed border-emerald-500/10 bg-white/[0.01] rounded-xl text-center text-neutral-500 text-xs font-sans italic" id="empty-completed-indicator">
                    Zero items processed as done.
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          
          /* LIST GENERAL TABLE VIEW */
          <div className="bg-[#16191d] rounded-2xl border border-white/5 overflow-hidden" id="list-table-panel">
            <div className="overflow-x-auto" id="list-table-scroller">
              <table className="w-full text-left border-collapse" id="list-table">
                <thead>
                  <tr className="bg-[#1a1e23]/60 border-b border-white/5 font-sans text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    <th className="py-3 px-4">Task Details</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Workflow Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans text-sm text-neutral-300" id="list-table-body">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-white font-sans text-sm" id={`list-task-title-${task.id}`}>{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5" id={`list-task-desc-${task.id}`}>{task.description}</div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5" id={`list-task-tags-${task.id}`}>
                            {task.tags.map((tag, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-neutral-400 text-[9px]">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[10px] tracking-wider font-mono">
                        {task.status === 'todo' && (
                          <span className="text-neutral-400 bg-white/5 border border-white/5 px-2 py-1 rounded">TO DO</span>
                        )}
                        {task.status === 'in_progress' && (
                          <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded animate-pulse">IN PROGRESS</span>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">COMPLETED</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-neutral-400">
                        {task.dueDate ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {task.dueDate}
                          </span>
                        ) : (
                          <span className="text-neutral-600 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1.5 text-neutral-450 hover:text-white hover:bg-white/5 rounded transition cursor-pointer"
                            title="Edit Task"
                            id={`list-edit-btn-${task.id}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 text-neutral-450 hover:text-rose-450 hover:bg-rose-500/10 rounded transition cursor-pointer"
                            title="Delete Task"
                            id={`list-delete-btn-${task.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-500 text-xs italic font-sans" id="empty-list-indicator">
                        <AlertCircle className="w-5 h-5 mx-auto text-neutral-500 mb-2" />
                        No action items match the query criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

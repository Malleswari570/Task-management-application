import React from 'react';
import { 
  Plus, 
  Folder, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layout
} from 'lucide-react';
import { Board } from '../types';

interface SidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoardClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoardClick,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <aside 
      className={`border-r border-white/5 bg-[#16191d] text-neutral-400 flex flex-col transition-all duration-300 relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`} 
      id="app-sidebar"
    >
      {/* Collapse Toggle Switch */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-5 bg-[#1a1e23] border border-white/5 text-neutral-405 hover:text-indigo-400 p-1.5 rounded-full shadow-md z-10 hover:shadow-lg transition cursor-pointer"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        id="sidebar-toggle-btn"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Workspace Header Panel */}
      <div className={`p-4 border-b border-white/5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`} id="sidebar-header">
        {!isCollapsed && (
          <div className="flex items-center gap-2" id="sidebar-header-branding">
            <Layout className="w-4 h-4 text-indigo-400" />
            <span className="font-sans font-bold text-xs tracking-wider uppercase text-white">Workspaces</span>
          </div>
        )}
        <button
          onClick={onCreateBoardClick}
          className={`p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center cursor-pointer ${isCollapsed ? 'w-8 h-8' : 'w-7 h-7'}`}
          title="Deploy new Board"
          id="create-board-btn"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Boards list Section */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin select-none" id="boards-navigation">
        {boards.map((board) => {
          const isActive = board.id === activeBoardId;
          return (
            <button
              key={board.id}
              onClick={() => onSelectBoard(board.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition text-xs font-semibold cursor-pointer ${
                isActive 
                  ? 'bg-white/5 text-white border border-white/5 shadow-sm' 
                  : 'hover:bg-white/[0.03] text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
              title={board.title}
              id={`board-tab-${board.id}`}
            >
              <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
              {!isCollapsed && (
                <span className="truncate flex-1 font-sans font-semibold" id={`board-tab-text-${board.id}`}>
                  {board.title}
                </span>
              )}
            </button>
          );
        })}

        {/* Empty State Navigation Prompt */}
        {!isCollapsed && boards.length === 0 && (
          <div className="py-8 px-4 text-center rounded-xl bg-[#1a1e23]/30 border border-white/5 text-neutral-500 text-xs flex flex-col items-center justify-center gap-2" id="sidebar-empty-prompt">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <p className="font-sans font-medium">No boards created.</p>
            <button
              onClick={onCreateBoardClick}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline transition"
              id="sidebar-create-link"
            >
              Deploy Board
            </button>
          </div>
        )}
      </div>

      {/* Collapsed view fallback creation target */}
      {isCollapsed && boards.length === 0 && (
        <div className="py-4 text-center text-slate-500" id="sidebar-collapsed-empty">
          ❗
        </div>
      )}

      {/* Sidebar Footer context indicator */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/5 bg-[#1a1e23]/10 text-center font-mono text-[9px] text-neutral-600 uppercase tracking-wider select-none animate-pulse" id="sidebar-footer">
          Cloud-Sync Active
        </div>
      )}
    </aside>
  );
};

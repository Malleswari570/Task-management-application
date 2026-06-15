import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, testConnection } from './lib/firebase';
import { 
  createBoard, 
  updateBoard, 
  deleteBoard, 
  subscribeBoards,
  createTask,
  updateTask,
  deleteTask,
  subscribeTasks
} from './lib/services';
import { Board, Task, UserProfile, TaskStatus } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BoardWorkspace } from './components/BoardWorkspace';
import { BoardModal } from './components/BoardModal';
import { TaskModal } from './components/TaskModal';
import { CheckSquare, LogIn, ShieldCheck, Sparkles, Database } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function App() {
  // Authentication & identity states
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Firestore collections states
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Layout presentation controls
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals management controls
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('todo');

  // Verify connection and mount authentication listener on boot
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified || false,
        });
      } else {
        setUser(null);
        setBoards([]);
        setTasks([]);
        setActiveBoardId(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Board persistence subscription
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingData(true);
    setErrorMsg('');
    
    const unsubscribe = subscribeBoards(
      (loadedBoards) => {
        setBoards(loadedBoards);
        setLoadingData(false);
        // Automatically set the active board if none selected
        if (loadedBoards.length > 0) {
          if (!activeBoardId || !loadedBoards.some(b => b.id === activeBoardId)) {
            setActiveBoardId(loadedBoards[0].id);
          }
        } else {
          setActiveBoardId(null);
        }
      },
      (err: any) => {
        console.error("Board synchronization failed:", err);
        setErrorMsg("Verify your internet link or database rules configuration.");
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Tasks persistence subscription
  useEffect(() => {
    if (!user?.uid || !activeBoardId) {
      setTasks([]);
      return;
    }

    const unsubscribe = subscribeTasks(
      activeBoardId,
      (loadedTasks) => {
        setTasks(loadedTasks);
      },
      (err: any) => {
        console.error("Tasks synchronization failed:", err);
        setErrorMsg("Failed to synchronize active task cards.");
      }
    );

    return () => unsubscribe();
  }, [activeBoardId, user?.uid]);

  // Retrieve details of the selected Board
  const activeBoard = useMemo(() => {
    return boards.find(b => b.id === activeBoardId) || null;
  }, [boards, activeBoardId]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      alert(`Sign in failed: ${err.message || err}. Please ensure popups are allowed and try again.`);
    }
  };

  // Board Submissions (Create or Update)
  const handleBoardSubmit = async (title: string, description: string) => {
    if (boardToEdit) {
      await updateBoard(boardToEdit.id, title, description);
    } else {
      const newId = await createBoard(title, description);
      if (newId) setActiveBoardId(newId);
    }
  };

  const handleEditBoardClick = (board: Board) => {
    setBoardToEdit(board);
    setIsBoardModalOpen(true);
  };

  const handleDeleteBoardClick = async (boardId: string) => {
    if (window.confirm("Are you sure you want to delete this board? This will permanently delete all associated tasks.")) {
      await deleteBoard(boardId);
    }
  };

  // Task Submissions (Create or Update)
  const handleTaskSubmit = async (taskPayload: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: any;
    dueDate: string;
    tags: string[];
  }) => {
    if (!activeBoardId) return;

    if (taskToEdit) {
      await updateTask(activeBoardId, taskToEdit.id, taskPayload);
    } else {
      await createTask(activeBoardId, taskPayload);
    }
  };

  const handleAddTaskClick = (status: TaskStatus) => {
    setTaskToEdit(null);
    setDefaultTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleEditTaskClick = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTaskClick = async (taskId: string) => {
    if (!activeBoardId) return;
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
      await deleteTask(activeBoardId, taskId);
    }
  };

  const handleUpdateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    await updateTask(task.boardId, task.id, { status: newStatus });
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#a3a3a3] flex flex-col font-sans select-none" id="app-viewport">
      {/* Header Panel */}
      <Header user={user} loading={loadingAuth} />

      {/* Main app Content Body */}
      <div className="flex-1 flex flex-row overflow-hidden" id="app-body-container">
        {loadingAuth ? (
          /* Global loader while verifying auth state */
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#0f1115]" id="initial-loading">
            <span className="w-8 h-8 rounded-full border-4 border-white/10 border-t-indigo-500 animate-spin mb-4"></span>
            <p className="font-sans text-sm font-semibold text-neutral-500 animate-pulse">Initializing cloud environment...</p>
          </div>
        ) : user ? (
          /* Main Workspace Dashboard (Logged-in) */
          <>
            {/* Navigational Sidebar */}
            <Sidebar
              boards={boards}
              activeBoardId={activeBoardId}
              onSelectBoard={setActiveBoardId}
              onCreateBoardClick={() => {
                setBoardToEdit(null);
                setIsBoardModalOpen(true);
              }}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Application workspace stage */}
            <main className="flex-1 flex flex-col overflow-hidden" id="workspace-stage">
              {errorMsg && (
                <div className="bg-rose-550/10 border-b border-rose-500/20 px-6 py-2.5 flex items-center justify-between font-sans text-xs font-semibold text-rose-400" id="global-alert">
                  <span>⚠️ {errorMsg}</span>
                  <button onClick={() => setErrorMsg('')} className="text-rose-300 hover:text-rose-250 font-bold cursor-pointer">dismiss</button>
                </div>
              )}

              {loadingData ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" id="workspace-loading">
                  <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin mb-3"></div>
                  <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest font-mono">Hydrating data cells...</span>
                </div>
              ) : activeBoard ? (
                /* Primary Workspace Board */
                <BoardWorkspace
                  board={activeBoard}
                  tasks={tasks}
                  onEditBoard={handleEditBoardClick}
                  onDeleteBoard={handleDeleteBoardClick}
                  onAddTaskClick={handleAddTaskClick}
                  onEditTask={handleEditTaskClick}
                  onDeleteTask={handleDeleteTaskClick}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                />
              ) : (
                /* No Boards Prompt */
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center" id="no-boards-stage">
                  <div className="p-4 bg-[#16191d] text-indigo-400 rounded-2xl mb-5 border border-white/5" id="prompt-graphic">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="font-sans font-extrabold text-white text-lg" id="prompt-title">
                    Build your first Board Container
                  </h3>
                  <p className="font-sans text-xs text-neutral-400 max-w-sm mt-2 mb-6" id="prompt-desc">
                    A Board organizes associated action items, features, and roadmaps. Set up your workspace to begin syncing.
                  </p>
                  <button
                    onClick={() => {
                      setBoardToEdit(null);
                      setIsBoardModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                    id="create-board-prompt-btn"
                  >
                    Deploy Workspace
                  </button>
                </div>
              )}
            </main>
          </>
        ) : (
          /* Clean Landing and Onboarding View (Unauthenticated) */
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-[#0f1115] relative" id="landing-stage">
            
            {/* Background design elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
              <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg p-8 bg-[#16191d] border border-white/5 shadow-xl rounded-2xl flex flex-col items-center text-center space-y-6" id="onboarding-gate-container">
              <div className="p-4 bg-indigo-505 text-white rounded-2xl shadow-lg border border-indigo-500/50" id="landing-logo">
                <CheckSquare className="w-10 h-10" />
              </div>

              <div id="landing-tagline">
                <h1 className="font-sans font-black text-white text-2xl tracking-tight md:text-3xl">
                  Enterprise Task Sync
                </h1>
                <p className="font-sans text-sm text-neutral-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  A high-contrast collaborative Kanban dashboard for teams. Secure real-time Firestore persistence and role isolation built-in.
                </p>
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-2 gap-3 w-full bg-[#1a1e23] border border-white/5 p-4 rounded-xl" id="landing-badges">
                <div className="flex items-center gap-2.5 text-left" id="badge-auth">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="block text-xs font-bold text-white leading-tight">Google Auth</span>
                    <span className="text-[10px] text-neutral-500 font-semibold">Secure user isolation</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-left" id="badge-db">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="block text-xs font-bold text-white leading-tight">Live Firestore</span>
                    <span className="text-[10px] text-neutral-500 font-semibold">Atomic real-time sync</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Google Login Trigger */}
              <button
                onClick={loginWithGoogle}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition cursor-pointer"
                id="landing-signin-btn"
              >
                <LogIn className="w-5 h-5" />
                <span>Confirm Credentials via Google</span>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-wider font-bold justify-center font-mono pt-2" id="landing-disclaimer">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Zero Trust Infrastructure</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Board Form Modal */}
      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => {
          setIsBoardModalOpen(false);
          setBoardToEdit(null);
        }}
        onSubmit={handleBoardSubmit}
        boardToEdit={boardToEdit}
      />

      {/* Task Form Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleTaskSubmit}
        taskToEdit={taskToEdit}
        defaultStatus={defaultTaskStatus}
      />
    </div>
  );
}

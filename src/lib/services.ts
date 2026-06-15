import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Board, Task } from '../types';

// Helper to generate safe Firestore matching IDs
function generateSafeId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==========================================
// BOARDS CRUD
// ==========================================

export async function createBoard(title: string, description: string = ''): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to create a board.');
  }

  const boardId = generateSafeId();
  const path = `boards/${boardId}`;
  
  try {
    const boardRef = doc(db, 'boards', boardId);
    const boardData = {
      title: title.trim(),
      description: description.trim(),
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(boardRef, boardData);
    return boardId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateBoard(boardId: string, title: string, description: string = ''): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to update a board.');
  }

  const path = `boards/${boardId}`;
  try {
    const boardRef = doc(db, 'boards', boardId);
    await updateDoc(boardRef, {
      title: title.trim(),
      description: description.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBoard(boardId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to delete a board.');
  }

  const path = `boards/${boardId}`;
  try {
    const boardRef = doc(db, 'boards', boardId);
    await deleteDoc(boardRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeBoards(
  onSuccess: (boards: Board[]) => void, 
  onError: (err: any) => void
): () => void {
  const user = auth.currentUser;
  if (!user) {
    onSuccess([]);
    return () => {};
  }

  const path = 'boards';
  const boardsQuery = query(
    collection(db, 'boards'),
    where('ownerId', '==', user.uid)
  );

  return onSnapshot(
    boardsQuery,
    (snapshot) => {
      const boards: Board[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        boards.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          ownerId: data.ownerId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      // Sort in-memory desc by createdAt
      boards.sort((a, b) => {
        const timeA = a.createdAt?.seconds !== undefined ? a.createdAt.seconds : 0;
        const timeB = b.createdAt?.seconds !== undefined ? b.createdAt.seconds : 0;
        return timeB - timeA;
      });
      onSuccess(boards);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        onError(err);
      }
    }
  );
}

// ==========================================
// TASKS CRUD
// ==========================================

export async function createTask(
  boardId: string, 
  taskData: { 
    title: string; 
    description?: string; 
    status: 'todo' | 'in_progress' | 'completed'; 
    priority: 'low' | 'medium' | 'high'; 
    dueDate?: string; 
    tags?: string[];
  }
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to create a task.');
  }

  const taskId = generateSafeId();
  const path = `boards/${boardId}/tasks/${taskId}`;

  try {
    const taskRef = doc(db, 'boards', boardId, 'tasks', taskId);
    const taskPayload = {
      title: taskData.title.trim(),
      description: (taskData.description || '').trim(),
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate || '',
      tags: taskData.tags || [],
      ownerId: user.uid,
      boardId: boardId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(taskRef, taskPayload);
    return taskId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateTask(
  boardId: string, 
  taskId: string, 
  taskData: Partial<Omit<Task, 'id' | 'ownerId' | 'boardId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to update a task.');
  }

  const path = `boards/${boardId}/tasks/${taskId}`;
  try {
    const taskRef = doc(db, 'boards', boardId, 'tasks', taskId);
    const updatePayload: any = {
      ...taskData,
      updatedAt: serverTimestamp(),
    };

    // Trim strings if present
    if (updatePayload.title) updatePayload.title = updatePayload.title.trim();
    if (updatePayload.description) updatePayload.description = updatePayload.description.trim();

    await updateDoc(taskRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(boardId: string, taskId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to delete a task.');
  }

  const path = `boards/${boardId}/tasks/${taskId}`;
  try {
    const taskRef = doc(db, 'boards', boardId, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeTasks(
  boardId: string,
  onSuccess: (tasks: Task[]) => void, 
  onError: (err: any) => void
): () => void {
  const user = auth.currentUser;
  if (!user || !boardId) {
    onSuccess([]);
    return () => {};
  }

  const path = `boards/${boardId}/tasks`;
  const tasksQuery = query(
    collection(db, 'boards', boardId, 'tasks'),
    where('ownerId', '==', user.uid)
  );

  return onSnapshot(
    tasksQuery,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tasks.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate,
          tags: data.tags,
          ownerId: data.ownerId,
          boardId: data.boardId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      // Sort in-memory asc by createdAt
      tasks.sort((a, b) => {
        const timeA = a.createdAt?.seconds !== undefined ? a.createdAt.seconds : 0;
        const timeB = b.createdAt?.seconds !== undefined ? b.createdAt.seconds : 0;
        return timeA - timeB;
      });
      onSuccess(tasks);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (err) {
        onError(err);
      }
    }
  );
}

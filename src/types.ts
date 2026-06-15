export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: any; // Firestore Timestamp or Date
  updatedAt: any;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  ownerId: string;
  boardId: string;
  tags?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

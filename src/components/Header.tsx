import React from 'react';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { CheckSquare, LogIn, LogOut, User } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, loading }) => {
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      // Set custom parameters to force user account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Authentication failed:", err);
      alert(`Sign in failed: ${err.message || err}. Please ensure popups are allowed and try again.`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <header className="bg-[#16191d] text-white border-b border-white/5 py-4 px-6 md:px-12 flex flex-row items-center justify-between" id="app-header">
      {/* Brand Logo and Title */}
      <div className="flex items-center gap-3" id="brand-logo-container">
        <div className="p-2 bg-indigo-500 rounded-lg text-white" id="brand-logo">
          <CheckSquare className="w-6 h-6" id="logo-icon" />
        </div>
        <div>
          <h1 className="font-sans font-extrabold text-xl tracking-tight leading-none text-white md:text-2xl" id="brand-title">
            TaskFlow
          </h1>
          <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest block mt-0.5" id="brand-sub">
            Elegant Sync
          </span>
        </div>
      </div>

      {/* User Actions Section */}
      <div className="flex items-center gap-4" id="user-actions-container">
        {loading ? (
          <div className="flex items-center gap-2 font-sans text-xs text-neutral-500" id="auth-loading-text">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            Verifying identity...
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 md:gap-5" id="user-profile-widget">
            <div className="hidden sm:flex flex-col text-right" id="user-info-text">
              <span className="font-sans font-semibold text-sm text-slate-200" id="user-display-name">
                {user.displayName || 'Enterprise User'}
              </span>
              <span className="font-sans text-xs text-neutral-500" id="user-email-address">
                {user.email || 'Verified Account'}
              </span>
            </div>
            
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'Profile'} 
                className="w-9 h-9 rounded-full border border-indigo-500 object-cover"
                id="user-avatar-image"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold border border-indigo-500" id="user-fallback-avatar">
                <User className="w-5 h-5" />
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-[#1a1e23] hover:bg-white/5 text-neutral-300 text-xs font-semibold flex items-center gap-2 border border-white/5 transition"
              id="google-signout-btn"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition"
            id="google-signin-btn"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </header>
  );
};

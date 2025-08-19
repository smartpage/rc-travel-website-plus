import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAuthorized, signIn, signOut } = useAuth();

  if (loading) return null;
  if (!user) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70">
        <div className="bg-gray-900 text-white rounded-xl p-8 w-[92%] max-w-md shadow-2xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Sign in to edit</h2>
          <p className="text-sm text-gray-300 mb-6">Only authorized editors can access the design tools.</p>
          <button
            onClick={signIn}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3 rounded-lg transition-colors"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70">
        <div className="bg-gray-900 text-white rounded-xl p-8 w-[92%] max-w-md shadow-2xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Access denied</h2>
          <p className="text-sm text-gray-300 mb-4">Your account is not authorized to edit this site.</p>
          <div className="flex gap-3">
            <button
              onClick={signOut}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default LoginGate;



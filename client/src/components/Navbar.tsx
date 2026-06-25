import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Plus } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-dark-border/40 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold font-outfit text-white tracking-tight flex items-center gap-2 hover:text-dark-accent transition">
            <span className="bg-gradient-to-r from-dark-accent to-indigo-400 bg-clip-text text-transparent">ActionPilot</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/goals/new')}
            className="btn-primary flex items-center gap-1.5 px-4 py-1.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-dark-border/40">
              <div className="flex items-center gap-2 bg-dark-card/60 px-3 py-1.5 rounded-lg border border-dark-border/40">
                <UserIcon className="w-4 h-4 text-dark-accent" />
                <span className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</span>
              </div>
              
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-dark-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

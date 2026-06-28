import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim() || name.trim().length < 2) {
        setError('Name must be at least 2 characters.');
        setLoading(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('Password does not satisfy the security strength policy.');
        setLoading(false);
        return;
      }

      const response = await api.post('/auth/register', { name, email, password });
      if (response.data.success) {
        // Redirect to login upon successful signup
        navigate('/login');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  };

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&^#()_\-+=]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute w-[300px] h-[300px] bg-dark-accent/10 rounded-full blur-[100px] top-[10%] left-[20%]"></div>
      <div className="absolute w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] bottom-[10%] right-[10%]"></div>

      <div className="w-full max-w-md glass-panel p-8 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white font-outfit mb-2">ActionPilot</h2>
          <p className="text-dark-muted font-sans text-sm">From Intention to Completion</p>
        </div>

        <h3 className="text-xl font-semibold text-white mb-6 text-center font-outfit">Create Account</h3>

        {error && (
          <div aria-live="polite" className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col">
            <label htmlFor="reg-name" className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">Full Name</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Full Name"
              className="glass-input"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="reg-email" className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">Email Address</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="glass-input"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="reg-password" className="text-xs font-semibold text-dark-muted mb-2 tracking-wide uppercase">Password</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="glass-input"
            />
            
            {/* Password strength dynamic indicators checklist */}
            <div className="mt-3 p-3 rounded-lg bg-dark-card/30 border border-dark-border/40 space-y-1.5 text-[11px]">
              <p className="text-dark-muted font-bold uppercase tracking-wider text-[9px] mb-1">Password Policy Requirements:</p>
              <div className="flex items-center gap-2 transition duration-200">
                <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-400' : 'bg-dark-border'}`}></span>
                <span className={hasMinLength ? 'text-emerald-400 font-medium' : 'text-dark-muted'}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2 transition duration-200">
                <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-emerald-400' : 'bg-dark-border'}`}></span>
                <span className={hasUppercase ? 'text-emerald-400 font-medium' : 'text-dark-muted'}>At least one uppercase letter (A-Z)</span>
              </div>
              <div className="flex items-center gap-2 transition duration-200">
                <span className={`w-1.5 h-1.5 rounded-full ${hasLowercase ? 'bg-emerald-400' : 'bg-dark-border'}`}></span>
                <span className={hasLowercase ? 'text-emerald-400 font-medium' : 'text-dark-muted'}>At least one lowercase letter (a-z)</span>
              </div>
              <div className="flex items-center gap-2 transition duration-200">
                <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-400' : 'bg-dark-border'}`}></span>
                <span className={hasNumber ? 'text-emerald-400 font-medium' : 'text-dark-muted'}>At least one number (0-9)</span>
              </div>
              <div className="flex items-center gap-2 transition duration-200">
                <span className={`w-1.5 h-1.5 rounded-full ${hasSpecialChar ? 'bg-emerald-400' : 'bg-dark-border'}`}></span>
                <span className={hasSpecialChar ? 'text-emerald-400 font-medium' : 'text-dark-muted'}>At least one special character (@$!%*?&^#()_-+=)</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Sign Up
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-dark-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-dark-accent hover:underline transition font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

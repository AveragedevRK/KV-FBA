import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, role: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for better UX
    setTimeout(() => {
      const validEmails = ['wh413@xprofulfill.com', 'hus@xprofulfill.com', 'jagjit@xprofulfill.com'];
      const masterPassword = 'Modesto@413';

      if (!email.trim() || !validEmails.includes(email.trim())) {
        setError('Invalid email address. Please contact your administrator.');
        setIsLoading(false);
        return;
      }

      if (password !== masterPassword) {
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Determine Role based on email
      let role = '(Staff)';
      if (email.trim() === 'hus@xprofulfill.com' || email.trim() === 'jagjit@xprofulfill.com') {
        role = '(Admin)';
      }

      onLogin(email, role);
      setIsLoading(false);
    }, 1000);
  };

  const inputClasses = "w-full h-[48px] bg-[var(--bg-2)] border border-[var(--border-2)] rounded text-[14px] text-[var(--text-primary)] px-10 placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#0f62fe] focus:ring-1 focus:ring-[#0f62fe]/20 transition-all";

  return (
    <div className="min-h-screen bg-[var(--bg-0)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#0f62fe]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#0f62fe]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[400px] bg-[var(--bg-1)] border border-[var(--border-1)] rounded-xl shadow-2xl p-8 animate-slide-up-fade relative z-10">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 p-2">
             <img 
                src="https://app.kambojventures.com/assets/images/logos/logo.png" 
                alt="Kamboj Ventures" 
                className="w-full h-full object-contain"
             />
          </div>
          <h1 className="text-[20px] font-bold text-[var(--text-primary)]">Welcome Back</h1>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1">Sign in to access FBA Manager</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-[#da1e28]/10 border border-[#da1e28]/20 text-[#ff8389] text-[13px] p-3 rounded flex items-start gap-2 animate-fade-in-fast">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@xprofulfill.com"
                className={inputClasses}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={inputClasses}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[48px] bg-[#0f62fe] hover:bg-[#0353e9] text-white rounded font-medium text-[14px] transition-all shadow-lg shadow-[#0f62fe]/20 hover:shadow-[#0f62fe]/40 active:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 group"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border-1)] text-center">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Contact GM or Rajab to create a new Admin or Staff account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
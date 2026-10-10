import { useState } from 'react';
import { Link, Check } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const Topbar = () => {
  const { logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-10 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-50">
      <div className="flex items-center flex-1 space-x-4">
        
        {/* App Menu removed */}
        
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={copyRegistrationLink}
          className="flex items-center text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-md"
        >
          {copied ? <Check className="w-4 h-4 mr-1 text-success" /> : <Link className="w-4 h-4 mr-1" />}
          {copied ? 'Copied!' : 'Customer Registration Link'}
        </button>
        <button 
          onClick={logout}
          className="text-sm font-medium text-neutral-600 hover:text-danger transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

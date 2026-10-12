import { useState } from 'react';
import { Link, Check, Menu } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const Topbar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-10 bg-white border-b border-neutral-200 flex items-center justify-between px-3 sm:px-6 shrink-0 relative z-50">
      <div className="flex items-center flex-1 space-x-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 text-neutral-600 hover:text-primary-900 rounded-md hover:bg-neutral-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <button 
          onClick={copyRegistrationLink}
          className="flex items-center text-xs sm:text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors bg-primary-50 hover:bg-primary-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shrink-0"
          title="Customer Registration Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-success shrink-0" /> : <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 shrink-0" />}
          <span>
            {copied ? 'Copied!' : (
              <>
                <span className="hidden sm:inline">Customer </span>Registration Link
              </>
            )}
          </span>
        </button>
        <button 
          onClick={logout}
          className="text-xs sm:text-sm font-medium text-neutral-600 hover:text-danger transition-colors shrink-0"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

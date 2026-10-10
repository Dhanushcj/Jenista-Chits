import { useState } from 'react';
import { Link, Check, Menu, Trash2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export const Topbar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const copyRegistrationLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearTestData = () => {
    if (window.confirm("Are you sure you want to clear all mock test data? This will reset all customers and groups to default.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <header className="h-10 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-50">
      <div className="flex items-center flex-1 space-x-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-primary-900 rounded-md hover:bg-neutral-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={clearTestData}
          className="hidden sm:flex items-center text-sm font-medium text-danger hover:text-danger-dark transition-colors bg-danger-light/20 hover:bg-danger-light/50 px-3 py-1.5 rounded-md"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear Test Data
        </button>
        <button 
          onClick={copyRegistrationLink}
          className="hidden sm:flex items-center text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-md"
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

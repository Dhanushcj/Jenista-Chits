import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  FileText, 
  Settings,
  CreditCard,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  subItems?: { name: string; href: string; }[];
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(() => {
    const reqs = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
    return reqs.filter((r: any) => r.status === 'PENDING_VERIFICATION' || r.status === 'PENDING').length;
  });

  useEffect(() => {
    const updateCount = () => {
      const reqs = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
      setPendingPaymentsCount(reqs.filter((r: any) => r.status === 'PENDING_VERIFICATION' || r.status === 'PENDING').length);
    };
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 3000);
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Plans', href: '/admin/manage-plans', icon: Settings },
    { 
      name: 'Customers', 
      href: '/admin/customers', 
      icon: Users, 
      subItems: [
        { name: 'Customer Details', href: '/admin/customers' },
        { name: 'Customer Registration', href: '/admin/customers/add' },
        { name: 'Registration Approvals', href: '/admin/customers/approvals' }
      ]
    },
    { name: 'Chit Groups', href: '/admin/chit-groups', icon: Layers },
    { 
      name: 'Payments', 
      href: '/admin/payments', 
      icon: CreditCard,
      badge: pendingPaymentsCount
    },
    { name: 'Ledger', href: '/admin/ledger', icon: FileText },
    { 
      name: 'Reports', 
      href: '/admin/reports', 
      icon: FileText, 
      subItems: [
        { name: 'Non Payers List', href: '/admin/reports/non-payers' }
      ]
    },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && setIsOpen && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <div className={cn(
        "group fixed inset-y-0 left-0 z-50 bg-white text-neutral-700 flex flex-col transition-all duration-300 ease-in-out border-r border-neutral-200 shadow-sm",
        // Mobile handling
        isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        // Desktop handling - starts at w-16, expands to w-64 on hover
        "lg:translate-x-0 lg:relative lg:w-16 lg:hover:w-64 overflow-y-auto overflow-x-hidden scrollbar-none"
      )}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-5 border-b border-neutral-200 bg-white shrink-0 whitespace-nowrap">
          <img src="/assets/Chit logo.jpg.jpeg" alt="Logo" className="h-7 w-7 object-contain rounded shrink-0 shadow-sm" />
          <span className="ml-4 font-bold text-neutral-900 text-lg opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 tracking-tight">TrustChit Admin</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-5 flex flex-col space-y-1.5 px-3">
          {navigation.map((item) => (
            <div key={item.name} className="flex flex-col">
              <NavLink
                to={item.subItems ? '#' : item.href}
                onClick={(e) => {
                  if (item.subItems) {
                    e.preventDefault();
                    setOpenSubmenu(openSubmenu === item.name ? null : item.name);
                  }
                }}
                className={({ isActive }) => cn(
                  "flex items-center px-3 py-2.5 rounded-xl transition-all whitespace-nowrap overflow-hidden relative",
                  (isActive && !item.subItems) 
                    ? "bg-primary-50 text-primary-900 font-bold border-l-4 border-primary-600 shadow-sm" 
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-medium"
                )}
              >
                <div className="relative shrink-0">
                  <item.icon className="h-5 w-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full lg:group-hover:hidden" />
                  )}
                </div>
                <span className="ml-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex-1 flex items-center justify-between">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <ChevronDown className={cn("w-4 h-4 text-neutral-400 transition-transform", openSubmenu === item.name ? "rotate-180" : "")} />
                    )}
                  </div>
                </span>
              </NavLink>

              {/* Expandable Submenu */}
              {item.subItems && (
                <div className={cn(
                  "flex-col space-y-1 ml-11 mt-1 flex lg:hidden lg:group-hover:flex overflow-hidden transition-all duration-300",
                  openSubmenu === item.name ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                )}>
                  {item.subItems.map(subItem => (
                    <NavLink
                      key={subItem.name}
                      to={subItem.href}
                      className={({ isActive }) => cn(
                        "block py-2 px-2 text-sm whitespace-nowrap rounded-lg transition-colors",
                        isActive ? "text-primary-900 font-bold bg-primary-50" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                      )}
                    >
                      {subItem.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        
        {/* User Profile Mini */}
        <div className="p-4 border-t border-neutral-200 bg-white flex items-center whitespace-nowrap overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center font-bold shrink-0 border border-primary-200 shadow-sm">
            AD
          </div>
          <div className="ml-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-sm font-bold text-neutral-900">Admin User</p>
            <p className="text-xs text-neutral-500">System Administrator</p>
          </div>
        </div>
      </div>
    </>
  );
};

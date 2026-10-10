import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  CreditCard, 
  Gavel, 
  FileText, 
  Settings,
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
  subItems?: { name: string; href: string; }[];
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Plans', href: '/admin/manage-plans', icon: Settings },
    { 
      name: 'Customers', 
      href: '/admin/customers', 
      icon: Users, 
      subItems: [
        { name: 'Customer Details', href: '/admin/customers' },
        { name: 'Add/Modify Customer', href: '/admin/customers/add' },
        { name: 'Registration Approvals', href: '/admin/customers/approvals' }
      ]
    },
    { name: 'Chit Groups', href: '/admin/chit-groups', icon: Layers },

    { name: 'Ledger', href: '/admin/ledger', icon: FileText },
    { name: 'Auctions', href: '/admin/auctions', icon: Gavel },
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
        "group fixed inset-y-0 left-0 z-50 bg-primary-950 text-neutral-300 flex flex-col transition-all duration-300 ease-in-out",
        // Mobile handling
        isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        // Desktop handling - starts at w-16, expands to w-64 on hover
        "lg:translate-x-0 lg:relative lg:w-16 lg:hover:w-64 overflow-y-auto overflow-x-hidden scrollbar-none border-r border-primary-900"
      )}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-5 border-b border-primary-900 bg-primary-950 shrink-0 whitespace-nowrap">
          <img src="/assets/Chit logo.jpg.jpeg" alt="Logo" className="h-7 w-7 object-contain rounded shrink-0" />
          <span className="ml-4 font-bold text-white text-lg opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">TrustChit Admin</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 flex flex-col space-y-2 px-3">
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
                  "flex items-center px-3 py-3 rounded-xl transition-colors whitespace-nowrap overflow-hidden relative",
                  (isActive && !item.subItems) 
                    ? "bg-primary-900 text-white" 
                    : "text-neutral-400 hover:bg-primary-900 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="ml-4 font-medium opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex-1 flex items-center justify-between">
                  {item.name}
                  {item.subItems && (
                    <ChevronDown className={cn("w-4 h-4 transition-transform", openSubmenu === item.name ? "rotate-180" : "")} />
                  )}
                </span>
              </NavLink>

              {/* Expandable Submenu (only visible when sidebar is hovered/expanded) */}
              {item.subItems && (
                <div className={cn(
                  "flex-col space-y-1 ml-12 mt-1 flex lg:hidden lg:group-hover:flex overflow-hidden transition-all duration-300",
                  openSubmenu === item.name ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                )}>
                  {item.subItems.map(subItem => (
                    <NavLink
                      key={subItem.name}
                      to={subItem.href}
                      className={({ isActive }) => cn(
                        "block py-2 text-sm whitespace-nowrap transition-colors",
                        isActive ? "text-white font-medium" : "text-neutral-500 hover:text-neutral-300"
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
        <div className="p-4 border-t border-primary-900 flex items-center whitespace-nowrap overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-white font-bold shrink-0">
            AD
          </div>
          <div className="ml-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-sm font-bold text-white">Admin User</p>
            <p className="text-xs text-neutral-500">System Administrator</p>
          </div>
        </div>
      </div>
    </>
  );
};

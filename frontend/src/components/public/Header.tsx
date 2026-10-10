import { Link } from 'react-router-dom';
import { Button } from '../common/Button';


export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-secondary-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <img src="/assets/Chit logo.jpg.jpeg" alt="Jenista Chits Logo" className="h-12 w-12 object-contain" />
            <span className="font-bold text-xl text-primary-900 tracking-tight">Jenista Chits</span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-sm font-medium text-primary-900 hover:text-accent transition-colors">Home</Link>
            <a href="#plans" className="text-sm font-medium text-neutral-600 hover:text-primary-900 transition-colors">Chit Plans</a>
            <a href="#how-it-works" className="text-sm font-medium text-neutral-600 hover:text-primary-900 transition-colors">How It Works</a>
            <a href="#about" className="text-sm font-medium text-neutral-600 hover:text-primary-900 transition-colors">About Us</a>
            <a href="#contact" className="text-sm font-medium text-neutral-600 hover:text-primary-900 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link to="/customer-login">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-primary-900 border-primary-900 hover:bg-primary-50">Customer Portal</Button>
            </Link>
            <Link to="/admin-login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-neutral-500 hover:text-primary-900">Employee Portal</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

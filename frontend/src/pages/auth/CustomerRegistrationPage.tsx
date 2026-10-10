import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const CustomerRegistrationPage = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    
    // Mock registration logic
    const customers = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
    const newCustomer = {
      id: `TC-${Math.floor(Math.random() * 90000) + 10000}`,
      name,
      mobile,
      address,
      password,
      status: 'PENDING_APPROVAL',
      referredBy: ref || null,
      chits: []
    };
    localStorage.setItem('mockCustomers', JSON.stringify([...customers, newCustomer]));
    // Redirect to login
    navigate('/customer-login', { state: { message: 'Registration successful! Your account is pending admin approval.' } });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2 mb-6">
          <img src="/assets/Chit logo.jpg.jpeg" alt="Jenista Chits Logo" className="h-12 w-12 object-contain" />
          <span className="font-bold text-2xl text-primary-900 tracking-tight">Jenista Chits</span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-neutral-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Or <Link to="/customer-login" className="font-medium text-primary-600 hover:text-primary-500">login if you already have one</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-neutral-200">
          <form className="space-y-6" onSubmit={handleRegister}>
            <Input 
              label="Full Name" 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
            
            <Input 
              label="Mobile Number" 
              type="tel" 
              required 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
            />
            
            <Input 
              label="Address" 
              type="text" 
              required 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your full address"
            />
            

            <Input 
              label="Password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />

            <Button type="submit" className="w-full">
              Register Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

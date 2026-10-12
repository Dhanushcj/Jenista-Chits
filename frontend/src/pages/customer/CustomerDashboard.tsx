import { useState, useEffect } from 'react';
import { Layers, CreditCard, TrendingUp, Bell, History, Calendar, ArrowRight, Copy } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAuth } from '../../store/AuthContext';
import { fetchClient } from '../../api/client';

export const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeChits, setActiveChits] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [myChits, setMyChits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadCustomerData = async () => {
      if (user?.id) {
        try {
          const res = await fetchClient(`/customers?search=${user.id}`);
          if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
            const found = res.data.find((c: any) => c.customerCode === user.id || c._id === user.id) || res.data[0];
            if (found) {
              setMyChits(found.chits || []);
              setActiveChits((found.chits || []).length);
              setTotalInvested(found.totalPaid || 0);
              return;
            }
          }
        } catch (e) {
          console.warn('API error in CustomerDashboard:', e);
        }

        const customers = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
        const customer = customers.find((c: any) => c.id === user.id);
        
        if (customer && customer.chits) {
          setMyChits(customer.chits);
          setActiveChits(customer.chits.length);
          setTotalInvested(customer.totalPaid || 0);
        } else {
          setMyChits([]);
          setActiveChits(0);
          setTotalInvested(0);
        }
      }
    };

    loadCustomerData();
    const interval = setInterval(loadCustomerData, 5000);
    window.addEventListener('storage', loadCustomerData);

    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    const myTransactions = ledger.filter((t: any) => t.reference && user?.id && t.reference.includes(user.id));
    setTransactions(myTransactions);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadCustomerData);
    };
  }, [user]);

  const handlePayNow = (groupId: string) => {
    alert(`Redirecting to payment gateway for group ${groupId}...`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-secondary-50 border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/assets/Chit logo.jpg.jpeg" alt="Jenista Chits Logo" className="h-10 w-10 object-contain" />
              <span className="font-bold text-xl text-primary-900 tracking-tight">Jenista Chits</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-neutral-600 hidden sm:inline-block">
                Welcome, {user?.name || 'Customer'} 
                {user?.id && <span className="font-bold text-primary-900 ml-1">({user.id})</span>}
              </span>
              <button 
                onClick={logout}
                className="text-sm font-medium text-danger hover:text-danger-dark transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-900">Dashboard</h1>
              <p className="text-sm text-neutral-500">Here is a summary of your chit portfolio.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/register?ref=${user?.id}`;
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 bg-primary-50 text-primary-900 hover:bg-primary-100 border border-primary-200 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Referral Link'}
              </button>
              <button className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow relative text-neutral-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card border-l-4 border-l-primary-900 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Active Chits</p>
                  <h3 className="text-2xl font-bold text-primary-900">{activeChits}</h3>
                </div>
                <div className="p-3 bg-primary-100 rounded-md">
                  <Layers className="h-6 w-6 text-primary-900" />
                </div>
              </div>
            </div>

            <div className="card border-l-4 border-l-success p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Invested</p>
                  <h3 className="text-2xl font-bold text-success">{formatCurrency(totalInvested)}</h3>
                </div>
                <div className="p-3 bg-success-light rounded-md">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </div>

            <div className="card border-l-4 border-l-warning p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Next Payment Due</p>
                  <h3 className="text-xl font-bold text-warning">
                    {myChits.length > 0 ? formatCurrency(myChits[0].monthlyInstallment || 15000) : '₹0'}
                  </h3>
                </div>
                <div className="p-3 bg-warning-light rounded-md">
                  <CreditCard className="h-6 w-6 text-warning" />
                </div>
              </div>
              <div className="mt-4 text-sm text-neutral-500 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Due on: {myChits.length > 0 && myChits[0].dueDate ? new Date(myChits[0].dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* My Chit Groups */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-primary-600" />
                My Active Chit Groups
              </h3>
              
              {myChits.length === 0 ? (
                <div className="card p-8 text-center text-neutral-500 border-dashed border-neutral-300 bg-neutral-50">
                  <p>You have not been assigned to any chit groups yet.</p>
                  <p className="text-sm mt-1">Please contact your administrator or wait for approval.</p>
                </div>
              ) : (
                myChits.map((chit, index) => {
                  const dueDay = chit.dueDate ? parseInt(chit.dueDate.split('-')[2], 10) : 15;
                  const nextDueStr = chit.dueDate 
                    ? new Date(chit.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
                    : '15 Oct, 2026';
                    
                  return (
                  <div key={index} className="card p-0 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5 border-b border-neutral-100 flex justify-between items-start bg-white">
                      <div>
                        <h4 className="font-bold text-lg text-primary-900">{chit.groupName || chit.groupId}</h4>
                        <p className="text-sm text-neutral-500 mt-1">Ticket Number: <span className="font-bold text-neutral-700">#{chit.ticketNumber}</span></p>
                        {chit.dueDate && (
                          <p className="text-xs text-neutral-400 mt-1">
                            Installments due on the <strong>{dueDay}{dueDay === 1 ? 'st' : dueDay === 2 ? 'nd' : dueDay === 3 ? 'rd' : 'th'}</strong> of every month.
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 bg-success-light text-success font-bold text-[10px] uppercase tracking-wider rounded-full">
                          {chit.status || 'Active'}
                        </span>
                        <p className="text-sm font-bold text-primary-900 mt-2">Value: {formatCurrency(chit.chitValue || chit.amount || 500000)}</p>
                      </div>
                    </div>
                    
                    <div className="bg-neutral-50 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Last Paid Date</p>
                        <p className="text-sm font-medium text-neutral-800">N/A</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Next Due Date</p>
                        <p className="text-sm font-medium text-warning font-bold">{nextDueStr}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Amount Due</p>
                        <p className="text-sm font-medium text-neutral-800">{formatCurrency(chit.monthlyInstallment || 15000)}</p>
                      </div>
                      <div className="text-right">
                        <button 
                          onClick={() => handlePayNow(chit.groupId)}
                          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center w-full md:w-auto ml-auto"
                        >
                          Pay Now <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            {/* Transaction History Sidebar */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-primary-600" />
                Recent Transactions
              </h3>
              
              <div className="card p-0 overflow-hidden">
                <div className="divide-y divide-neutral-100">
                  {transactions.length === 0 ? (
                    <div className="p-6 text-center text-sm text-neutral-500">
                      No recent transactions found.
                    </div>
                  ) : (
                    transactions.map((trx, idx) => (
                      <div key={idx} className="p-4 hover:bg-neutral-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm text-primary-900">{trx.description}</p>
                          <p className="font-bold text-sm text-success">+{formatCurrency(trx.amount)}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-neutral-500 font-mono">{trx.id}</p>
                          <p className="text-xs text-neutral-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> {formatDate(trx.date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="bg-neutral-50 p-3 text-center border-t border-neutral-100">
                  <button className="text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors">
                    View All Statements
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

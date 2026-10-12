import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../../../components/common/Button';
import { formatCurrency, formatDate } from '../../../utils/format';
import { 
  User, Phone, MapPin, Building, 
  Wallet, FileText, AlertCircle, CheckCircle2,
  Calendar, Mail, CreditCard, Activity, ArrowUpRight, ArrowDownRight, Clock, Layers, X, Users, BookOpen, Download
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export const CustomerProfile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [customer, setCustomer] = useState<any>(null);
  const [referralCount, setReferralCount] = useState(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedChitForPayment, setSelectedChitForPayment] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');

  useEffect(() => {
    const saved = localStorage.getItem('mockCustomers');
    if (saved && id) {
      const parsed = JSON.parse(saved);
      const found = parsed.find((c: any) => c.id === id);
      if (found) {
        setCustomer(found);
        
        // Calculate referrals
        const referrals = parsed.filter((c: any) => c.referredBy === found.id);
        setReferralCount(referrals.length);
      }
    }
  }, [id]);

  const handleWithdraw = (chitId: string, ticketNumber: string) => {
    if (!customer) return;
    
    // Calculate new chits
    const updatedChits = customer.chits.map((c: any) => {
      if (c.groupId === chitId && c.ticketNumber === ticketNumber) {
        if (c.isWithdrawn) return c; // Already withdrawn
        
        // 95% is the base eligible withdrawal amount, plus 1000 for each month since joining
        const chitValue = c.chitValue || c.amount || 0;
        const joinedDate = new Date(c.joinedAt || c.joiningDate || Date.now());
        const monthsSinceJoin = Math.max(0, Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        const withdrawalAmount = (chitValue * 0.95) + (monthsSinceJoin * 1000);
        
        // Additional 1% for next month
        const additionalInstallment = chitValue * 0.01;
        const currentInstallment = c.monthlyInstallment || additionalInstallment;
        
        return {
          ...c,
          isWithdrawn: true,
          withdrawnAmount: withdrawalAmount,
          monthlyInstallment: currentInstallment + additionalInstallment,
          status: 'Withdrawn'
        };
      }
      return c;
    });

    const updatedCustomer = { ...customer, chits: updatedChits };
    setCustomer(updatedCustomer);

    const saved = localStorage.getItem('mockCustomers');
    if (saved) {
      const parsed = JSON.parse(saved);
      const newCustomers = parsed.map((c: any) => c.id === customer.id ? updatedCustomer : c);
      localStorage.setItem('mockCustomers', JSON.stringify(newCustomers));
    }
  };

  const handleReceivePayment = () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || !customer) return;

    const amount = Number(paymentAmount);
    
    // Add to ledger
    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    const newTxn = {
      id: 'REC-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      reference: selectedChitForPayment ? `${customer.id} - ${selectedChitForPayment}` : customer.id,
      description: `Installment Payment (${paymentMode})`,
      amount: amount,
      type: 'CREDIT'
    };
    localStorage.setItem('ledgerTransactions', JSON.stringify([newTxn, ...ledger]));

    // Update customer totalPaid
    const updatedCustomer = {
      ...customer,
      totalPaid: (customer.totalPaid || 0) + amount,
      pending: Math.max(0, (customer.pending || 0) - amount)
    };
    
    setCustomer(updatedCustomer);
    
    const saved = localStorage.getItem('mockCustomers');
    if (saved) {
      const parsed = JSON.parse(saved);
      const newCustomers = parsed.map((c: any) => c.id === customer.id ? updatedCustomer : c);
      localStorage.setItem('mockCustomers', JSON.stringify(newCustomers));
    }

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setSelectedChitForPayment('');
  };

  // Dynamic values or clean fallbacks
  const displayName = customer?.name || customer?.fullName || 'Customer';
  const displayId = customer?.id || customer?.customerCode || id || 'N/A';
  const displayPhone = customer?.mobile || customer?.phone || 'N/A';
  const displayEmail = customer?.email || 'N/A';
  const displayAddress = customer?.address || 'N/A';
  const displayAadhar = customer?.aadhar || 'N/A';
  const displayPan = customer?.pan || 'N/A';

  const displayTotalPaid = customer?.totalPaid || 0;
  const displayPending = customer?.pending || 0;
  const displayActiveChits = customer?.chits?.length || customer?.activeChits || 0;
  const displayAgent = customer?.agent || 'System Admin';
  
  // Real transactions from ledger for recent activity
  const recentActivity = (() => {
    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    return ledger.filter((t: any) => 
      (displayId !== 'N/A' && (t.reference?.includes(displayId) || t.description?.includes(displayId)))
    ).map((t: any) => ({
      title: t.description || 'Payment Transaction',
      amount: t.amount,
      desc: t.reference || 'Ledger Entry',
      date: new Date(t.date),
      type: t.type === 'CREDIT' ? 'credit' : 'debit'
    }));
  })();

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'chits', name: 'Chit Groups' },
    { id: 'passbook', name: 'Digital Passbook' },
    { id: 'payments', name: 'Payments' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-10">
      {/* Left Sidebar - Profile Summary */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Cover Photo / Top Accent */}
          <div className="h-24 bg-gradient-to-r from-primary-900 to-primary-700"></div>
          
          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white rounded-xl shadow-md border-4 border-white flex items-center justify-center -mt-12 mb-4">
              <User className="w-12 h-12 text-primary-200" />
            </div>
            
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-neutral-900">{displayName}</h2>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <p className="text-sm font-medium text-primary-900 bg-primary-50 inline-flex px-2 py-0.5 rounded">
                {displayId}
              </p>
            </div>
          </div>
          
          <div className="border-t border-neutral-100 px-6 py-5 bg-neutral-50/50 space-y-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Contact Info</h3>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-neutral-400 mt-0.5" />
              <div className="text-sm text-neutral-700">{displayPhone}</div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-neutral-400 mt-0.5" />
              <div className="text-sm text-neutral-700">{displayEmail}</div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
              <div className="text-sm text-neutral-700 leading-relaxed">{displayAddress}</div>
            </div>
          </div>
          
          <div className="border-t border-neutral-100 px-6 py-5 bg-neutral-50/50 space-y-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Account Info</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500 flex items-center gap-2"><Building className="w-4 h-4" /> Branch</span>
              <span className="font-medium text-neutral-900 text-right">{customer?.branch || 'Head Office'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500 flex items-center gap-2"><User className="w-4 h-4" /> Agent</span>
              <span className="font-medium text-neutral-900 text-right">{displayAgent}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined</span>
              <span className="font-medium text-neutral-900 text-right">{formatDate(new Date())}</span>
            </div>
          </div>
        </div>
        
        {/* KYC Mini Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center justify-between">
            KYC Status
            <span className="text-xs bg-success-light text-success px-2 py-1 rounded-md font-semibold">Verified</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <CreditCard className="w-4 h-4" /> Aadhar
              </div>
              <span className="text-sm font-medium text-neutral-900">{displayAadhar}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <FileText className="w-4 h-4" /> PAN
              </div>
              <span className="text-sm font-medium text-neutral-900">{displayPan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 space-y-6">
        {/* Breadcrumb & Action */}
        <div className="flex items-center justify-between text-sm text-neutral-500 bg-white px-5 py-4 rounded-xl shadow-sm border border-neutral-200">
          <div>
            <Link to="/admin/customers" className="hover:text-primary-900 transition-colors">Customers</Link>
            <span className="mx-2">/</span>
            <span className="text-neutral-900 font-medium">{displayName}</span>
          </div>
          <button 
            className="bg-primary-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            onClick={() => setIsPaymentModalOpen(true)}
          >
            Receive Payment
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="bg-white p-1.5 rounded-xl shadow-sm border border-neutral-200 inline-flex w-full overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-primary-50 text-primary-900 shadow-sm" 
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-primary-50 to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-primary-50 text-primary-900 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Active Chits</p>
                <h4 className="text-3xl font-bold text-neutral-900">{displayActiveChits}</h4>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-success-light/50 to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-success-light text-success rounded-xl">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Paid</p>
                <h4 className="text-3xl font-bold text-neutral-900">{formatCurrency(displayTotalPaid)}</h4>
              </div>

              <div className={cn("bg-white p-6 rounded-xl shadow-sm border relative overflow-hidden group", displayPending > 0 ? "border-danger-200" : "border-neutral-200")}>
                <div className={cn("absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500", displayPending > 0 ? "from-danger-100" : "from-neutral-100")}></div>
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl", displayPending > 0 ? "bg-danger-light text-danger" : "bg-neutral-100 text-neutral-400")}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  {displayPending > 0 && <span className="text-xs font-bold bg-danger-light text-danger px-2.5 py-1 rounded-full border border-danger-200">Action Req</span>}
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Pending</p>
                <h4 className={cn("text-3xl font-bold", displayPending > 0 ? "text-danger" : "text-neutral-900")}>
                  {formatCurrency(displayPending)}
                </h4>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-primary-100 to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-primary-100 text-primary-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Referrals</p>
                <h4 className="text-3xl font-bold text-neutral-900">{referralCount}</h4>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900">Recent Activity</h3>
                <Button variant="secondary" className="!py-1.5 !px-3 !text-xs !rounded-md">View All</Button>
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Transaction</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Group</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-100">
                      {recentActivity.map((act: any, i: number) => (
                        <tr key={i} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center mr-3 shrink-0", act.type === 'credit' ? 'bg-success-light text-success' : 'bg-danger-light text-danger')}>
                                {act.type === 'credit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              </div>
                              <span className="text-sm font-semibold text-neutral-900">{act.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {formatDate(act.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {act.desc}
                          </td>
                          <td className={cn("px-6 py-4 whitespace-nowrap text-sm font-bold text-right", act.type === 'credit' ? 'text-success' : 'text-danger')}>
                            {act.type === 'credit' ? '+' : '-'}{formatCurrency(act.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-neutral-300" />
                  </div>
                  <h4 className="text-neutral-900 font-bold mb-1">No Activity Yet</h4>
                  <p className="text-sm text-neutral-500 max-w-sm mx-auto">When this customer makes payments or joins groups, their transactions will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chit Groups Tab */}
        {activeTab === 'chits' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">Active Chit Groups</h3>
            </div>
            
            {customer?.chits && customer.chits.length > 0 ? (
              <div className="p-6 grid grid-cols-1 gap-4">
                {customer.chits.map((chit: any, i: number) => (
                  <div key={i} className="flex flex-col md:flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center mr-4 shrink-0">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">{chit.groupId}</h4>
                        <p className="text-sm font-medium text-slate-500">{chit.scheme}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="text-center md:text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket / Joined</p>
                        <p className="text-sm font-semibold text-slate-700">#{chit.ticketNumber} • {chit.joinedAt ? new Date(chit.joinedAt).toLocaleDateString('en-IN') : chit.joiningDate}</p>
                      </div>
                      
                      <div className="text-center md:text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chit Value</p>
                        <p className="text-lg font-black text-amber-600">{formatCurrency(chit.chitValue || chit.amount || 0)}</p>
                      </div>

                      {chit.isWithdrawn ? (
                        <div className="text-center md:text-right">
                          <p className="text-xs font-bold text-success uppercase tracking-wider mb-1">Withdrawn</p>
                          <p className="text-lg font-black text-success">{formatCurrency(chit.withdrawnAmount || 0)}</p>
                        </div>
                      ) : (
                        <div className="text-center md:text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Eligible Withdraw</p>
                          <p className="text-lg font-black text-primary-600">
                            {formatCurrency(((chit.chitValue || chit.amount || 0) * 0.95) + (Math.max(0, Math.floor((Date.now() - new Date(chit.joinedAt || chit.joiningDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 30))) * 1000))}
                          </p>
                        </div>
                      )}
                      
                      <div className="ml-0 md:ml-4 flex flex-col items-center gap-2">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", 
                          chit.isWithdrawn ? "bg-primary-100 text-primary-700 border-primary-200" : "bg-green-100 text-green-700 border-green-200")}>
                          {chit.isWithdrawn ? 'Withdrawn' : (chit.status || 'Active')}
                        </span>
                        
                        {!chit.isWithdrawn && (
                          <button 
                            onClick={() => handleWithdraw(chit.groupId, chit.ticketNumber)}
                            className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 font-semibold transition-colors whitespace-nowrap"
                          >
                            Withdraw Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-neutral-300" />
                </div>
                <h4 className="text-neutral-900 font-bold mb-1">No Chit Groups</h4>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto">This customer is not currently mapped to any chit groups.</p>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-full">
                <thead className="bg-neutral-50 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="p-4">Receipt ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Group / Reference</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {(() => {
                  const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
                  const customerTxns = ledger.filter((t: any) => 
                    t.reference?.includes(displayId) || t.description?.includes(displayId)
                  );

                  if (customerTxns.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-400">
                          <Wallet className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
                          <p>No payments recorded for this customer.</p>
                        </td>
                      </tr>
                    );
                  }

                  return customerTxns.map((t: any, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-bold text-primary-900 font-mono">{t.id}</td>
                      <td className="p-4 text-sm text-neutral-600">{new Date(t.date).toLocaleDateString('en-GB')}</td>
                      <td className="p-4 text-sm font-bold text-neutral-800">{t.reference}</td>
                      <td className="p-4 text-sm text-neutral-600">{t.description}</td>
                      <td className={`p-4 text-sm font-bold text-right ${t.type === 'CREDIT' ? 'text-success' : 'text-danger'}`}>
                        {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Passbook Tab */}
        {activeTab === 'passbook' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-200 bg-primary-900 text-white rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Digital Passbook</h3>
                <p className="text-primary-200 text-sm opacity-90 mt-1">Official statement of account</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-200 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(displayTotalPaid - displayPending)}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-100/80 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="p-4 border-r border-neutral-200">Date</th>
                    <th className="p-4 border-r border-neutral-200">Particulars</th>
                    <th className="p-4 border-r border-neutral-200">Ref / Txn ID</th>
                    <th className="p-4 border-r border-neutral-200 text-right">Debit (-)</th>
                    <th className="p-4 border-r border-neutral-200 text-right">Credit (+)</th>
                    <th className="p-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {(() => {
                    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
                    // Sort ledger from oldest to newest to calculate running balance
                    const customerTxns = ledger.filter((t: any) => 
                      t.reference?.includes(displayId) || t.description?.includes(displayId)
                    ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    if (customerTxns.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-neutral-400">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                            <p className="font-medium text-neutral-500">No transactions recorded yet.</p>
                          </td>
                        </tr>
                      );
                    }

                    let runningBalance = 0;
                    return customerTxns.map((t: any, idx: number) => {
                      if (t.type === 'CREDIT') {
                        runningBalance += t.amount;
                      } else {
                        runningBalance -= t.amount;
                      }

                      return (
                        <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="p-4 text-sm font-medium text-neutral-600 border-r border-neutral-100 whitespace-nowrap">
                            {new Date(t.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-4 text-sm text-neutral-800 font-medium border-r border-neutral-100">
                            {t.description}
                          </td>
                          <td className="p-4 text-xs font-mono text-neutral-500 border-r border-neutral-100">
                            {t.id}
                          </td>
                          <td className="p-4 text-sm font-medium text-danger text-right border-r border-neutral-100">
                            {t.type === 'DEBIT' ? formatCurrency(t.amount) : '-'}
                          </td>
                          <td className="p-4 text-sm font-medium text-success text-right border-r border-neutral-100">
                            {t.type === 'CREDIT' ? formatCurrency(t.amount) : '-'}
                          </td>
                          <td className="p-4 text-sm font-bold text-primary-900 text-right bg-neutral-50/30">
                            {formatCurrency(runningBalance)}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center text-sm text-neutral-500">
              <p>Generated on {new Date().toLocaleString('en-IN')}</p>
              <button className="flex items-center text-primary-600 font-bold hover:text-primary-800 transition-colors">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </button>
            </div>
          </div>
        )}

        {/* Tab Placeholder for others */}
        {activeTab !== 'overview' && activeTab !== 'chits' && activeTab !== 'payments' && activeTab !== 'passbook' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 flex flex-col items-center justify-center p-16 text-center text-neutral-500 min-h-[400px]">
            <Wallet className="w-16 h-16 mb-4 text-neutral-200" />
            <h3 className="text-xl font-bold text-neutral-900 mb-2">{tabs.find(t => t.id === activeTab)?.name}</h3>
            <p className="text-sm max-w-md mx-auto leading-relaxed">This module is currently under development. Detailed {tabs.find(t => t.id === activeTab)?.name.toLowerCase()} views will be available in the next release.</p>
          </div>
        )}
      </div>

      {/* Receive Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Receive Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {customer?.chits && customer.chits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Select Chit (Optional)</label>
                  <select 
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedChitForPayment}
                    onChange={(e) => {
                      setSelectedChitForPayment(e.target.value);
                      const chit = customer.chits.find((c: any) => c.groupId === e.target.value);
                      if (chit && chit.monthlyInstallment) {
                        setPaymentAmount(chit.monthlyInstallment.toString());
                      }
                    }}
                  >
                    <option value="">-- General Payment --</option>
                    {customer.chits.map((c: any) => (
                      <option key={c.groupId} value={c.groupId}>
                        {c.groupId} (Due: {formatCurrency(c.monthlyInstallment || 0)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (₹)</label>
                <input 
                  type="number"
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Payment Mode</label>
                <select 
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleReceivePayment}
                  disabled={!paymentAmount || Number(paymentAmount) <= 0}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

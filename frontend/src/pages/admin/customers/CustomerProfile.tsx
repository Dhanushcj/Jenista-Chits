import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../../../components/common/Button';
import { formatCurrency, formatDate } from '../../../utils/format';
import { 
  User, Phone, MapPin, Building, 
  Wallet, FileText, AlertCircle, CheckCircle2,
  Calendar, Mail, CreditCard, Activity, ArrowUpRight, ArrowDownRight, Clock, Layers, X, Users, BookOpen, Download, Award
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { fetchClient } from '../../../api/client';

export const CustomerProfile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [customer, setCustomer] = useState<any>(null);
  const [referralCount, setReferralCount] = useState(0);

  // Receive Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedChitForPayment, setSelectedChitForPayment] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');

  // Disburse / Withdraw Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedChitForWithdraw, setSelectedChitForWithdraw] = useState<any>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMode, setWithdrawMode] = useState('Bank Transfer');
  const [withdrawRef, setWithdrawRef] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [disbursalSuccessMsg, setDisbursalSuccessMsg] = useState<string | null>(null);

  // Helper to resolve chits from all local and group sources
  const resolveChitsForCustomer = (custTarget: any, targetId: string) => {
    let chits: any[] = Array.isArray(custTarget?.chits) ? [...custTarget.chits] : [];
    const phone = (custTarget?.phone || custTarget?.mobile || '').replace(/\D/g, '');

    // 1. Check local mockCustomers
    const saved = localStorage.getItem('mockCustomers');
    if (saved) {
      const parsed = JSON.parse(saved);
      const local = parsed.find((c: any) => {
        const cPhone = (c.mobile || c.phone || '').replace(/\D/g, '');
        return c.id === targetId || c.mongoId === targetId || c.customerCode === targetId || (phone && cPhone === phone);
      });
      if (local?.chits && Array.isArray(local.chits)) {
        local.chits.forEach((ch: any) => {
          if (!chits.some(existing => existing.groupId === ch.groupId)) {
            chits.push(ch);
          }
        });
      }
    }

    // 2. Check chitGroupMemberships
    const memberships = JSON.parse(localStorage.getItem('chitGroupMemberships') || '[]');
    memberships.forEach((m: any) => {
      const mPhone = (m.mobile || m.phone || '').replace(/\D/g, '');
      if (
        m.customerId === targetId ||
        m.customerId === custTarget?.customerCode ||
        m.customerId === custTarget?.id ||
        (phone && mPhone === phone)
      ) {
        if (!chits.some(existing => existing.groupId === m.groupId)) {
          chits.push({
            groupId: m.groupId,
            groupName: m.groupName || m.groupId,
            scheme: m.scheme || 'Fixed Chit Plan',
            ticketNumber: m.ticketNumber || '1',
            chitValue: m.chitValue || 100000,
            monthlyInstallment: m.monthlyInstallment || 5000,
            dueDate: m.dueDate,
            joiningDate: m.joiningDate || new Date().toISOString(),
            paymentStatus: m.paymentStatus || 'PAID',
            status: m.status || 'Active',
            isWithdrawn: m.isWithdrawn || false,
            withdrawnAmount: m.withdrawnAmount || 0,
            withdrawnAt: m.withdrawnAt || null
          });
        }
      }
    });

    // 3. Check mockChitGroups enrolledMembers
    const groups = JSON.parse(localStorage.getItem('mockChitGroups') || '[]');
    groups.forEach((g: any) => {
      if (Array.isArray(g.enrolledMembers)) {
        g.enrolledMembers.forEach((m: any) => {
          const mPhone = (m.mobile || m.phone || '').replace(/\D/g, '');
          if (
            m.customerId === targetId ||
            m.customerId === custTarget?.customerCode ||
            m.customerId === custTarget?.id ||
            (phone && mPhone === phone)
          ) {
            const grpCode = g.code || g.id;
            if (!chits.some(existing => existing.groupId === grpCode)) {
              chits.push({
                groupId: grpCode,
                groupName: g.name || grpCode,
                scheme: g.scheme || 'Chit Plan',
                ticketNumber: m.ticketNumber || '1',
                chitValue: g.chitValue || m.chitValue || 100000,
                monthlyInstallment: g.monthlyInstallment || m.monthlyInstallment || 5000,
                dueDate: m.dueDate,
                joiningDate: m.joiningDate || new Date().toISOString(),
                paymentStatus: m.paymentStatus || 'PAID',
                status: m.status || 'Active',
                isWithdrawn: m.isWithdrawn || false,
                withdrawnAmount: m.withdrawnAmount || 0,
                withdrawnAt: m.withdrawnAt || null
              });
            }
          }
        });
      }
    });

    // 4. Check ledger transactions referencing groups (e.g. TC-73071 / FIXED-...)
    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    ledger.forEach((tx: any) => {
      const ref = tx.reference || '';
      if ((ref.includes(targetId) || (custTarget?.customerCode && ref.includes(custTarget.customerCode))) && ref.includes(' / ')) {
        const parts = ref.split(' / ');
        const grpCode = parts[1]?.trim();
        if (grpCode && !chits.some(existing => existing.groupId === grpCode)) {
          chits.push({
            groupId: grpCode,
            groupName: grpCode,
            scheme: grpCode.includes('FIXED') ? 'Fixed Chit Plan' : 'Auction Chit Plan',
            ticketNumber: '1',
            chitValue: 100000,
            monthlyInstallment: 5000,
            joiningDate: tx.date || new Date().toISOString(),
            paymentStatus: 'PAID',
            status: 'Active',
            isWithdrawn: false,
            withdrawnAmount: 0
          });
        }
      }
    });

    return chits;
  };

  useEffect(() => {
    const loadCustomer = async () => {
      if (!id) return;

      // Calculate total verified payments directly from ledger transactions
      const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
      const customerLedgerCredits = ledger.filter((t: any) => 
        (t.type === 'CREDIT' || t.category === 'INSTALLMENT') && 
        (t.customerId === id || t.reference?.includes(id) || t.description?.includes(id))
      );
      const ledgerTotalPaid = customerLedgerCredits.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      const customerLedgerDebits = ledger.filter((t: any) => 
        t.type === 'DEBIT' && 
        (t.customerId === id || t.reference?.includes(id) || t.description?.includes(id))
      );
      const ledgerTotalWithdrawn = customerLedgerDebits.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      // Local storage fallback data
      const saved = localStorage.getItem('mockCustomers');
      let localFound: any = null;
      if (saved) {
        const parsed = JSON.parse(saved);
        localFound = parsed.find((c: any) => c.id === id || c.mongoId === id || c.customerCode === id);
        if (localFound) {
          const referrals = parsed.filter((c: any) => c.referredBy === localFound.id);
          setReferralCount(referrals.length);
        }
      }

      // 1. Try fetching from MongoDB
      try {
        const res = await fetchClient(`/customers?search=${id}`);
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const found = res.data.find((c: any) => c.customerCode === id || c._id === id) || res.data[0];
          if (found) {
            const resolvedChits = resolveChitsForCustomer(found, id);
            const trueTotalPaid = Math.max(Number(found.totalPaid || 0), Number(localFound?.totalPaid || 0), ledgerTotalPaid);
            const trueWithdrawn = Math.max(
              resolvedChits.filter((ch: any) => ch.isWithdrawn).reduce((sum: number, ch: any) => sum + Number(ch.withdrawnAmount || 0), 0),
              ledgerTotalWithdrawn
            );

            const customerObj = {
              id: found.customerCode || found._id,
              mongoId: found._id,
              customerCode: found.customerCode,
              name: found.fullName || found.name,
              mobile: found.phone || found.mobile,
              address: found.address,
              aadhar: found.aadhar || '—',
              pan: found.pan || '—',
              branch: found.branchId?.branchName || 'Head Office',
              agent: found.assignedAgentId?.name || 'System Admin',
              totalPaid: trueTotalPaid,
              pending: found.pending !== undefined ? found.pending : (localFound?.pending || 0),
              activeChits: resolvedChits.length,
              chits: resolvedChits,
              withdrawnAmount: trueWithdrawn,
              status: found.status || 'ACTIVE'
            };

            setCustomer(customerObj);

            // Auto-heal MongoDB record if it was out of sync
            if (trueTotalPaid > Number(found.totalPaid || 0) || resolvedChits.length > Number(found.chits?.length || 0)) {
              fetchClient(`/customers/${found._id || found.customerCode || id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  totalPaid: trueTotalPaid,
                  chits: resolvedChits
                })
              }).catch(err => console.warn('Could not auto-sync customer to MongoDB:', err));
            }

            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch customer profile from API:', err);
      }

      // 2. Fallback to localStorage if API unavailable
      if (localFound) {
        const resolvedChits = resolveChitsForCustomer(localFound, id);
        const trueTotalPaid = Math.max(Number(localFound.totalPaid || 0), ledgerTotalPaid);
        setCustomer({
          ...localFound,
          totalPaid: trueTotalPaid,
          chits: resolvedChits,
          activeChits: resolvedChits.length,
          withdrawnAmount: ledgerTotalWithdrawn
        });
      }
    };

    loadCustomer();
    window.addEventListener('storage', loadCustomer);
    const interval = setInterval(loadCustomer, 4000);
    return () => {
      window.removeEventListener('storage', loadCustomer);
      clearInterval(interval);
    };
  }, [id]);

  // Open Disbursal / Withdrawal Modal
  const openWithdrawModal = (chit: any) => {
    const chitVal = Number(chit.chitValue || chit.amount || 100000);
    const eligibleAmount = Math.round(chitVal * 0.95);
    setSelectedChitForWithdraw(chit);
    setWithdrawAmount(String(eligibleAmount));
    setWithdrawMode('Bank Transfer');
    setWithdrawRef('');
    setWithdrawNotes('');
    setIsWithdrawModalOpen(true);
  };

  // Confirm Withdrawal & Disburse Prize Money
  const handleConfirmWithdrawal = () => {
    if (!customer || !selectedChitForWithdraw || !withdrawAmount || isNaN(Number(withdrawAmount))) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }

    const amount = Number(withdrawAmount);
    const payoutRefNo = withdrawRef.trim() || `DISB-${Date.now().toString().slice(-6)}`;

    // 1. Update customer chits
    const updatedChits = customer.chits.map((c: any) => {
      if (c.groupId === selectedChitForWithdraw.groupId) {
        return {
          ...c,
          isWithdrawn: true,
          withdrawnAmount: amount,
          withdrawnAt: new Date().toISOString(),
          payoutMode: withdrawMode,
          payoutRef: payoutRefNo,
          status: 'Withdrawn'
        };
      }
      return c;
    });

    const updatedCustomer = {
      ...customer,
      chits: updatedChits,
      withdrawnAmount: (Number(customer.withdrawnAmount || 0)) + amount
    };
    setCustomer(updatedCustomer);

    // 2. Add DEBIT record to ledgerTransactions
    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    const newTxn = {
      id: `DISB-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      reference: `${displayId} / ${selectedChitForWithdraw.groupId}`,
      description: `Prize Money Disbursal / Withdrawal (${withdrawMode} Ref: ${payoutRefNo})`,
      amount: amount,
      type: 'DEBIT',
      category: 'DISBURSAL',
      customerName: displayName,
      customerId: displayId,
      groupId: selectedChitForWithdraw.groupId,
      status: 'DISBURSED'
    };
    localStorage.setItem('ledgerTransactions', JSON.stringify([newTxn, ...ledger]));

    // 3. Update mockCustomers
    const saved = localStorage.getItem('mockCustomers');
    if (saved) {
      const parsed = JSON.parse(saved);
      const newCustomers = parsed.map((c: any) => (c.id === displayId || c.mongoId === displayId) ? updatedCustomer : c);
      localStorage.setItem('mockCustomers', JSON.stringify(newCustomers));
    }

    // 4. Update chitGroupMemberships
    const memberships = JSON.parse(localStorage.getItem('chitGroupMemberships') || '[]');
    const updatedMemberships = memberships.map((m: any) => {
      if ((m.customerId === displayId || m.customerId === customer?.customerCode) && m.groupId === selectedChitForWithdraw.groupId) {
        return {
          ...m,
          isWithdrawn: true,
          withdrawnAmount: amount,
          withdrawnAt: new Date().toISOString(),
          status: 'Withdrawn'
        };
      }
      return m;
    });
    localStorage.setItem('chitGroupMemberships', JSON.stringify(updatedMemberships));

    // 5. Update any pending customer withdrawal request
    const wReqs = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
    const updatedWReqs = wReqs.map((r: any) => {
      if (r.customerId === displayId && r.groupId === selectedChitForWithdraw.groupId && r.status === 'PENDING_ADMIN_DISBURSAL') {
        return {
          ...r,
          status: 'DISBURSED',
          disbursedAt: new Date().toISOString(),
          disbursedRef: payoutRefNo
        };
      }
      return r;
    });
    localStorage.setItem('withdrawalRequests', JSON.stringify(updatedWReqs));

    // 6. Sync to backend MongoDB
    const targetMongoId = customer.mongoId || customer.id || id;
    if (targetMongoId) {
      fetchClient(`/customers/${targetMongoId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          chits: updatedChits
        })
      }).catch(err => console.warn('Could not sync chit withdrawal to MongoDB:', err));
    }

    window.dispatchEvent(new Event('storage'));
    setIsWithdrawModalOpen(false);
    setDisbursalSuccessMsg(`Prize money of ₹${amount.toLocaleString('en-IN')} disbursed successfully to ${displayName}! (Ref: ${payoutRefNo})`);
    setTimeout(() => setDisbursalSuccessMsg(null), 5000);
  };

  const handleReceivePayment = () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || !customer) return;

    const amount = Number(paymentAmount);
    
    // Add to ledger
    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    const newTxn = {
      id: 'REC-' + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      reference: selectedChitForPayment ? `${customer.id} / ${selectedChitForPayment}` : customer.id,
      description: `Installment Payment (${paymentMode})`,
      amount: amount,
      type: 'CREDIT',
      category: 'INSTALLMENT',
      customerName: displayName,
      customerId: displayId,
      status: 'VERIFIED'
    };
    localStorage.setItem('ledgerTransactions', JSON.stringify([newTxn, ...ledger]));

    // Update customer totalPaid
    const newTotalPaid = (customer.totalPaid || 0) + amount;
    const newPending = Math.max(0, (customer.pending || 0) - amount);
    const updatedCustomer = {
      ...customer,
      totalPaid: newTotalPaid,
      pending: newPending
    };
    
    setCustomer(updatedCustomer);
    
    const saved = localStorage.getItem('mockCustomers');
    if (saved) {
      const parsed = JSON.parse(saved);
      const newCustomers = parsed.map((c: any) => c.id === customer.id ? updatedCustomer : c);
      localStorage.setItem('mockCustomers', JSON.stringify(newCustomers));
    }

    // Sync to backend MongoDB
    const targetMongoId = customer.mongoId || customer.id || id;
    if (targetMongoId) {
      fetchClient(`/customers/${targetMongoId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          totalPaid: newTotalPaid,
          pending: newPending
        })
      }).catch(err => console.warn('Could not sync payment to MongoDB:', err));
    }

    window.dispatchEvent(new Event('storage'));
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
  const displayAadhar = customer?.aadhar || '—';
  const displayPan = customer?.pan || '—';

  const displayPending = customer?.pending || 0;
  const displayActiveChits = customer?.chits?.length || customer?.activeChits || 0;
  const displayAgent = customer?.agent || 'System Admin';
  
  // Real transactions from ledger for recent activity
  const recentActivity = (() => {
    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    return ledger.filter((t: any) => 
      (displayId !== 'N/A' && (t.reference?.includes(displayId) || t.description?.includes(displayId) || t.customerId === displayId))
    ).map((t: any) => ({
      title: t.description || 'Payment Transaction',
      amount: t.amount,
      desc: t.reference || 'Ledger Entry',
      date: new Date(t.date),
      type: t.type === 'CREDIT' ? 'credit' : 'debit'
    }));
  })();

  // Direct calculation of verified total paid & total withdrawn from ledger and state
  const ledgerTotalPaid = recentActivity.filter((a: any) => a.type === 'credit').reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0);
  const displayTotalPaid = Math.max(Number(customer?.totalPaid || 0), ledgerTotalPaid);

  const ledgerTotalWithdrawn = recentActivity.filter((a: any) => a.type === 'debit').reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0);
  const chitsWithdrawnSum = Array.isArray(customer?.chits) 
    ? customer.chits.filter((c: any) => c.isWithdrawn).reduce((s: number, c: any) => s + (Number(c.withdrawnAmount) || 0), 0)
    : 0;
  const displayTotalWithdrawn = Math.max(Number(customer?.withdrawnAmount || 0), chitsWithdrawnSum, ledgerTotalWithdrawn);

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
            {/* SUCCESS BANNER FOR DISBURSAL */}
            {disbursalSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-xl shadow-sm flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm font-bold">{disbursalSuccessMsg}</p>
                </div>
                <button onClick={() => setDisbursalSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold">
                  Dismiss
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-gradient-to-bl from-primary-50 to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-primary-50 text-primary-900 rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Active Chits</p>
                <h4 className="text-2xl font-bold text-neutral-900">{displayActiveChits}</h4>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-gradient-to-bl from-success-light/50 to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-success-light text-success rounded-lg">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Paid</p>
                <h4 className="text-2xl font-bold text-neutral-900">{formatCurrency(displayTotalPaid)}</h4>
              </div>

              <div className={cn("bg-white p-5 rounded-xl shadow-sm border relative overflow-hidden group", displayPending > 0 ? "border-danger-200" : "border-neutral-200")}>
                <div className={cn("absolute right-0 top-0 w-20 h-20 bg-gradient-to-bl to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500", displayPending > 0 ? "from-danger-100" : "from-neutral-100")}></div>
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-lg", displayPending > 0 ? "bg-danger-light text-danger" : "bg-neutral-100 text-neutral-400")}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  {displayPending > 0 && <span className="text-[10px] font-bold bg-danger-light text-danger px-2 py-0.5 rounded-full border border-danger-200">Action Req</span>}
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Pending</p>
                <h4 className={cn("text-2xl font-bold", displayPending > 0 ? "text-danger" : "text-neutral-900")}>
                  {formatCurrency(displayPending)}
                </h4>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-200 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-gradient-to-bl from-amber-50 to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  {displayTotalWithdrawn > 0 && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">Prize Claimed</span>
                  )}
                </div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Total Withdrawn</p>
                <h4 className="text-2xl font-bold text-amber-900">{formatCurrency(displayTotalWithdrawn)}</h4>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-gradient-to-bl from-primary-100 to-transparent opacity-50 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Referrals</p>
                <h4 className="text-2xl font-bold text-neutral-900">{referralCount}</h4>
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

                      {(() => {
                        const wReqs = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
                        const hasWReq = wReqs.some((r: any) => 
                          (r.customerId === displayId || r.customerId === customer?.customerCode) && 
                          r.groupId === chit.groupId && 
                          r.status === 'PENDING_ADMIN_DISBURSAL'
                        );

                        if (chit.isWithdrawn) {
                          return (
                            <div className="flex items-center gap-4">
                              <div className="text-center md:text-right">
                                <p className="text-xs font-bold text-success uppercase tracking-wider mb-1">Prize Disbursed</p>
                                <p className="text-lg font-black text-success">{formatCurrency(chit.withdrawnAmount || 0)}</p>
                                {chit.withdrawnAt && (
                                  <p className="text-[11px] text-neutral-400 font-medium">{new Date(chit.withdrawnAt).toLocaleDateString('en-IN')}</p>
                                )}
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-emerald-100 text-emerald-800 border-emerald-300">
                                Disbursed
                              </span>
                            </div>
                          );
                        }

                        const chitVal = Number(chit.chitValue || chit.amount || 100000);
                        const eligible = Math.round(chitVal * 0.95);

                        return (
                          <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="text-center md:text-right">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Eligible Withdraw</p>
                              <p className="text-lg font-black text-primary-600">
                                {formatCurrency(eligible)}
                              </p>
                              <p className="text-[10px] text-slate-400">95% Standard Prize</p>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                              {hasWReq ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border bg-amber-100 text-amber-800 border-amber-300 animate-pulse">
                                  Customer Requested
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border bg-green-100 text-green-700 border-green-200">
                                  Eligible
                                </span>
                              )}
                              
                              <button 
                                onClick={() => openWithdrawModal(chit)}
                                className={cn(
                                  "text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap",
                                  hasWReq 
                                    ? "bg-amber-600 hover:bg-amber-700 text-white" 
                                    : "bg-primary-600 hover:bg-primary-700 text-white"
                                )}
                              >
                                <Award className="w-3.5 h-3.5" />
                                {hasWReq ? 'Process Requested Disbursal' : 'Withdraw / Disburse Prize'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
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

      {/* Disburse Chit Prize / Withdrawal Modal */}
      {isWithdrawModalOpen && selectedChitForWithdraw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg border border-neutral-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Disburse Prize / Withdrawal</h2>
                  <p className="text-xs text-neutral-500">Process outgoing prize payout for this chit group</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWithdrawModalOpen(false)} 
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Chit Summary Card */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Chit Group</span>
                  <span className="font-bold text-sm text-neutral-900 font-mono">{selectedChitForWithdraw.groupId}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-neutral-600 mb-1">
                  <span>Customer Name:</span>
                  <span className="font-semibold text-neutral-900">{displayName} ({displayId})</span>
                </div>
                <div className="flex justify-between items-center text-xs text-neutral-600 mb-1">
                  <span>Ticket Number:</span>
                  <span className="font-semibold text-neutral-900">#{selectedChitForWithdraw.ticketNumber || '1'}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-neutral-600 border-t border-amber-200/60 pt-2 mt-2">
                  <span className="font-bold">Total Chit Value:</span>
                  <span className="font-extrabold text-amber-900 text-sm">{formatCurrency(selectedChitForWithdraw.chitValue || selectedChitForWithdraw.amount || 100000)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Disbursal Amount (₹) <span className="text-danger">*</span>
                </label>
                <input 
                  type="number"
                  className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 95000"
                />
                <p className="text-[11px] text-neutral-500 mt-1">Calculated as 95% of chit pool (foreman commission 5% deducted per standard norms).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Payout Mode
                  </label>
                  <select 
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white shadow-sm"
                    value={withdrawMode}
                    onChange={(e) => setWithdrawMode(e.target.value)}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    UTR / Cheque / Txn Ref No.
                  </label>
                  <input 
                    type="text"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                    value={withdrawRef}
                    onChange={(e) => setWithdrawRef(e.target.value)}
                    placeholder="e.g. UTR129849204"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Remarks / Purpose
                </label>
                <input 
                  type="text"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  placeholder="e.g. Month 1 auction prize money disbursed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
                <button 
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  onClick={() => setIsWithdrawModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="bg-primary-900 hover:bg-primary-950 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  onClick={handleConfirmWithdrawal}
                  disabled={!withdrawAmount || Number(withdrawAmount) <= 0}
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  Confirm & Disburse Prize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

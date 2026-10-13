import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, TrendingUp, ArrowLeft, Plus, X, Users, IndianRupee, PieChart as PieChartIcon, Eye, CheckCircle2, ExternalLink, Award } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { fetchClient } from '../../api/client';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  
  const [chitGroups, setChitGroups] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupValue, setNewGroupValue] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('20');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<{type: string, value: number} | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [customChitValue, setCustomChitValue] = useState('');
  const [viewingScreenshot, setViewingScreenshot] = useState<any | null>(null);

  
  const now = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' });

  useEffect(() => {
    const savedPlans = localStorage.getItem('mockPlans');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    } else {
      const savedFixed = localStorage.getItem('mockFixedCategories');
      const savedAuction = localStorage.getItem('mockAuctionCategories');
      const initialPlans = [
        { id: 'fixed', title: 'Manage Fixed Categories', categories: savedFixed ? JSON.parse(savedFixed) : [{ id: 1, value: 100000 }, { id: 2, value: 200000 }, { id: 3, value: 500000 }, { id: 4, value: 1000000 }] },
        { id: 'auction', title: 'Manage Auction Categories', categories: savedAuction ? JSON.parse(savedAuction) : [{ id: 1, value: 500000 }, { id: 2, value: 1000000 }] }
      ];
      setPlans(initialPlans);
    }

    const g = localStorage.getItem('mockChitGroups');
    if (g) setChitGroups(JSON.parse(g));
    
    const c = localStorage.getItem('mockCustomers');
    if (c) setCustomers(JSON.parse(c));

    // Listen to real-time storage updates
    const handleStorageChange = () => {
      const freshG = localStorage.getItem('mockChitGroups');
      if (freshG) setChitGroups(JSON.parse(freshG));
      const freshC = localStorage.getItem('mockCustomers');
      if (freshC) setCustomers(JSON.parse(freshC));
    };
    window.addEventListener('storage', handleStorageChange);

    // Fetch live customers from MongoDB safely without overwriting local customers
    fetchClient('/customers')
      .then((res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          const localSaved = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
          const mapped = res.data.map((item: any) => {
            const local = localSaved.find((lc: any) => 
              lc.id === (item.customerCode || item._id) || 
              lc.mongoId === item._id || 
              (lc.mobile && (lc.mobile === item.phone || lc.mobile === item.mobile))
            );
            const chits = (item.chits && item.chits.length > 0) ? item.chits : (local?.chits || []);
            return {
              id: item.customerCode || item._id,
              mongoId: item._id,
              name: item.fullName || item.name,
              mobile: item.phone || item.mobile,
              phone: item.phone || item.mobile,
              address: item.address,
              branch: item.branchId?.branchName || 'Head Office',
              status: item.status || 'ACTIVE',
              totalPaid: item.totalPaid ?? local?.totalPaid ?? 0,
              pending: item.pending ?? local?.pending ?? 0,
              chits: chits,
            };
          });
          const localOnly = localSaved.filter((lc: any) => 
            !res.data.some((item: any) => 
              (item._id && lc.mongoId === item._id) || 
              (item.customerCode && lc.id === item.customerCode) ||
              (item.phone && (lc.mobile === item.phone || lc.phone === item.phone))
            )
          );
          const combined = [...mapped, ...localOnly];
          setCustomers(combined);
          localStorage.setItem('mockCustomers', JSON.stringify(combined));
        }
      })
      .catch((err: any) => console.warn('Could not sync admin dashboard customers:', err));

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleCategoryClick = (type: string, value: number) => {
    setSelectedCategory({ type, value });
    setSelectedGroup(null);
  };

  const handleGroupClick = (group: any) => {
    const latestGroups = JSON.parse(localStorage.getItem('mockChitGroups') || '[]');
    const freshGroup = latestGroups.find((g: any) => g.id === group.id || g.name === group.name) || group;
    setSelectedGroup(freshGroup);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedGroup(null);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  const handleCreateGroup = () => {
    const val = selectedCategory?.value;
    const mem = Number(newGroupMembers);
    if (!val || !mem || !newGroupName.trim() || !selectedCategory) return;

    const newGroup = {
      id: newGroupName.replace(/\s+/g, '-').toUpperCase() + '-' + Date.now().toString().slice(-4),
      name: newGroupName,
      type: selectedCategory.type,
      value: val,
      duration: mem,
      members: mem,
      filled: 0,
      status: 'Open'
    };

    const updatedGroups = [...chitGroups, newGroup];
    setChitGroups(updatedGroups);
    localStorage.setItem('mockChitGroups', JSON.stringify(updatedGroups));
    setIsAddGroupModalOpen(false);
    setNewGroupName('');
  };

  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

  const handleSearchCustomer = (query: string) => {
    setSearchMobile(query);
    const q = query.trim().toLowerCase();
    const cleanDigits = query.replace(/\D/g, '');

    const diskCusts = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
    const sourceList: any[] = diskCusts.length > 0 ? diskCusts : customers;

    if (!q) {
      setFoundCustomer(null);
      setSearchSuggestions(sourceList.slice(0, 5));
      return;
    }

    const matches = sourceList.filter((c: any) => {
      const cMobile = (c.mobile || c.phone || '').replace(/\D/g, '');
      const cId = (c.id || c.customerCode || '').toLowerCase();
      const cName = (c.name || c.fullName || '').toLowerCase();
      return (cleanDigits && cMobile.includes(cleanDigits)) || cId.includes(q) || cName.includes(q);
    });

    setSearchSuggestions(matches);

    // Auto-select exact match
    const exact = matches.find((c: any) => {
      const cMobile = (c.mobile || c.phone || '').replace(/\D/g, '');
      const cId = (c.id || c.customerCode || '').toLowerCase();
      return (cleanDigits.length === 10 && cMobile === cleanDigits) || (cId && cId === q);
    });

    if (exact) {
      setFoundCustomer(exact);
    } else if (matches.length === 1 && (cleanDigits.length >= 10 || q.length >= 4)) {
      setFoundCustomer(matches[0]);
    } else {
      setFoundCustomer(null);
    }
  };

  const handleEnrollCustomer = () => {
    if (!foundCustomer) {
      alert('Please search and select a customer to enroll.');
      return;
    }
    const val = Number(customChitValue) || Number(selectedGroup.value) || 100000;
    const effectiveDueDate = dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const installment = val * 0.05;

    // Load freshest group
    const allGroups = JSON.parse(localStorage.getItem('mockChitGroups') || '[]');
    const currentGroup = allGroups.find((g: any) => g.id === selectedGroup.id || g.name === selectedGroup.name) || selectedGroup;
    const currentEnrolled = Array.isArray(currentGroup.enrolledMembers) ? currentGroup.enrolledMembers : [];

    const ticketNumber = (currentEnrolled.length + 1).toString().padStart(3, '0');
    
    const memberRecord = {
      customerId: foundCustomer.id || foundCustomer.customerCode || foundCustomer.mobile,
      customerName: foundCustomer.name || foundCustomer.fullName,
      mobile: foundCustomer.mobile || foundCustomer.phone,
      phone: foundCustomer.mobile || foundCustomer.phone,
      ticketNumber: ticketNumber,
      groupId: selectedGroup.id,
      groupName: selectedGroup.name || selectedGroup.id,
      chitValue: val,
      monthlyInstallment: installment,
      dueDate: effectiveDueDate,
      joinedAt: new Date().toISOString(),
      paymentStatus: 'DUE',
      pending: installment,
      totalPaid: 0,
    };

    const newChit = {
      groupId: selectedGroup.id,
      groupName: selectedGroup.name || selectedGroup.id,
      ticketNumber: ticketNumber,
      status: 'Active',
      joinedAt: new Date().toISOString(),
      dueDate: effectiveDueDate,
      chitValue: val,
      monthlyInstallment: installment,
      paymentStatus: 'DUE',
      totalPaid: 0,
      paidAmount: 0,
      pending: installment,
      customerName: foundCustomer.name || foundCustomer.fullName,
      customerId: foundCustomer.id || foundCustomer.customerCode || foundCustomer.mobile
    };

    const cleanMobile = (foundCustomer.mobile || foundCustomer.phone || '').replace(/\D/g, '');

    // 1. Update localStorage mockCustomers reliably
    const localSaved = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
    let foundInLocal = false;
    const updatedLocal = localSaved.map((c: any) => {
      const cMobile = (c.mobile || c.phone || '').replace(/\D/g, '');
      const isMatch = 
        c.id === foundCustomer.id || 
        c.mongoId === foundCustomer.id || 
        (foundCustomer.mongoId && c.mongoId === foundCustomer.mongoId) ||
        (cleanMobile && cMobile === cleanMobile);
      if (isMatch) {
        foundInLocal = true;
        const existingChits = Array.isArray(c.chits) ? c.chits.filter((ch: any) => ch.groupId !== selectedGroup.id && ch.groupName !== selectedGroup.name) : [];
        return {
          ...c,
          pending: (Number(c.pending) || 0) + installment,
          chits: [...existingChits, newChit],
          activeChits: existingChits.length + 1
        };
      }
      return c;
    });
    if (!foundInLocal) {
      updatedLocal.push({
        ...foundCustomer,
        pending: installment,
        chits: [newChit],
        activeChits: 1
      });
    }
    localStorage.setItem('mockCustomers', JSON.stringify(updatedLocal));
    setCustomers(updatedLocal);

    // 2. Update enrolledMembers directly on selectedGroup & chitGroups
    const updatedMembers = [
      ...currentEnrolled.filter((m: any) => m.customerId !== memberRecord.customerId && m.mobile !== memberRecord.mobile), 
      memberRecord
    ];
    const updatedGroup = { 
      ...currentGroup, 
      filled: updatedMembers.length,
      enrolledMembers: updatedMembers
    };
    setSelectedGroup(updatedGroup);
    
    const updatedGroups = allGroups.map((g: any) => (g.id === selectedGroup.id || g.name === selectedGroup.name) ? updatedGroup : g);
    setChitGroups(updatedGroups);
    localStorage.setItem('mockChitGroups', JSON.stringify(updatedGroups));

    // 3. Save to persistent chitGroupMemberships table in localStorage
    const allMemberships = JSON.parse(localStorage.getItem('chitGroupMemberships') || '[]');
    const newMemberships = [
      ...allMemberships.filter((m: any) => !( (m.groupId === selectedGroup.id || m.groupName === selectedGroup.name) && (m.customerId === memberRecord.customerId || m.mobile === memberRecord.mobile) )), 
      memberRecord
    ];
    localStorage.setItem('chitGroupMemberships', JSON.stringify(newMemberships));

    // 4. Dispatch storage event so customer dashboard / other tabs update immediately
    window.dispatchEvent(new Event('storage'));

    // 5. Persist to backend MongoDB
    const targetId = foundCustomer.mongoId || foundCustomer.id;
    if (targetId) {
      fetchClient(`/customers/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          chits: [...(foundCustomer.chits || []), newChit],
          pending: (Number(foundCustomer.pending) || 0) + installment,
        })
      }).catch(err => console.warn('Could not sync chit to backend:', err));
    }

    alert(`Customer ${memberRecord.customerName} enrolled successfully into ${selectedGroup.name || selectedGroup.id}! (Ticket #${ticketNumber})`);
    setIsAddCustomerModalOpen(false);
    setSearchMobile('');
    setFoundCustomer(null);
    setDueDate('');
  };

  // If a group is selected, show its customers
  if (selectedGroup) {
    const freshChitGroups = JSON.parse(localStorage.getItem('mockChitGroups') || '[]');
    const activeGroup = freshChitGroups.find((g: any) => g.id === selectedGroup.id || g.name === selectedGroup.name) || selectedGroup;

    // Resolve all enrolled customers from group.enrolledMembers, chitGroupMemberships, and localStorage customers
    const memberships = JSON.parse(localStorage.getItem('chitGroupMemberships') || '[]');
    const allCustomersFromDisk = JSON.parse(localStorage.getItem('mockCustomers') || '[]');

    const groupMembersFromStore = memberships.filter((m: any) => 
      m.groupId === activeGroup.id || 
      m.groupId === activeGroup.code || 
      (activeGroup.name && m.groupName === activeGroup.name) ||
      (activeGroup.name && m.groupId === activeGroup.name)
    );

    const directMembers = Array.isArray(activeGroup.enrolledMembers) ? activeGroup.enrolledMembers : [];

    const enrolledFromCustomers = allCustomersFromDisk.filter((c: any) => 
      c.chits?.some((ch: any) => 
        ch.groupId === activeGroup.id || 
        ch.groupId === activeGroup.code || 
        (activeGroup.name && ch.groupName === activeGroup.name) ||
        (activeGroup.name && ch.groupId === activeGroup.name)
      )
    );

    // Merge into comprehensive customer map so no member is ever missing
    const customerMap = new Map<string, any>();

    directMembers.forEach((m: any) => {
      const cleanMPhone = (m.mobile || m.phone || '').replace(/\D/g, '');
      const key = m.customerId || cleanMPhone || m.mobile || m.ticketNumber;
      if (key) {
        const fullCust = allCustomersFromDisk.find((c: any) => 
          c.id === m.customerId || (cleanMPhone && (c.mobile || c.phone || '').replace(/\D/g, '') === cleanMPhone)
        );
        customerMap.set(key, {
          id: m.customerId || cleanMPhone || 'CUST',
          name: fullCust?.name || fullCust?.fullName || m.customerName || 'Customer',
          mobile: m.mobile || m.phone || fullCust?.mobile || '—',
          phone: m.mobile || m.phone || fullCust?.phone || '—',
          pending: m.pending ?? fullCust?.pending ?? 0,
          totalPaid: m.totalPaid ?? fullCust?.totalPaid ?? 0,
          chits: [{
            groupId: activeGroup.id,
            groupName: activeGroup.name,
            chitValue: m.chitValue || activeGroup.value,
            monthlyInstallment: m.monthlyInstallment || (Number(activeGroup.value) * 0.05),
            ticketNumber: m.ticketNumber,
            paymentStatus: m.paymentStatus || 'DUE',
            dueDate: m.dueDate
          }]
        });
      }
    });

    groupMembersFromStore.forEach((m: any) => {
      const cleanMPhone = (m.mobile || m.phone || '').replace(/\D/g, '');
      const key = m.customerId || cleanMPhone || m.mobile || m.ticketNumber;
      if (key && !customerMap.has(key)) {
        const fullCust = allCustomersFromDisk.find((c: any) => 
          c.id === m.customerId || (cleanMPhone && (c.mobile || c.phone || '').replace(/\D/g, '') === cleanMPhone)
        );
        customerMap.set(key, {
          id: m.customerId || cleanMPhone || 'CUST',
          name: fullCust?.name || fullCust?.fullName || m.customerName || 'Customer',
          mobile: m.mobile || m.phone || fullCust?.mobile || '—',
          phone: m.mobile || m.phone || fullCust?.phone || '—',
          pending: m.pending ?? fullCust?.pending ?? 0,
          totalPaid: m.totalPaid ?? fullCust?.totalPaid ?? 0,
          chits: [{
            groupId: activeGroup.id,
            groupName: activeGroup.name,
            chitValue: m.chitValue || activeGroup.value,
            monthlyInstallment: m.monthlyInstallment || (Number(activeGroup.value) * 0.05),
            ticketNumber: m.ticketNumber,
            paymentStatus: m.paymentStatus || 'DUE',
            dueDate: m.dueDate
          }]
        });
      }
    });

    enrolledFromCustomers.forEach((c: any) => {
      const cleanCPhone = (c.mobile || c.phone || '').replace(/\D/g, '');
      const key = c.id || cleanCPhone || c.mobile;
      if (key) {
        const matchedChit = c.chits?.find((ch: any) => 
          ch.groupId === activeGroup.id || 
          ch.groupId === activeGroup.code || 
          ch.groupName === activeGroup.name || 
          ch.groupId === activeGroup.name
        ) || c.chits?.[0];
        
        const existing = customerMap.get(key);
        customerMap.set(key, {
          ...existing,
          ...c,
          name: c.name || c.fullName || existing?.name || 'Customer',
          mobile: c.mobile || c.phone || existing?.mobile || '—',
          chits: matchedChit ? [matchedChit] : existing?.chits
        });
      }
    });

    const groupCustomers = Array.from(customerMap.values());

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <button 
              onClick={handleBackToGroups}
              className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary-900 tracking-tight">{activeGroup.name || activeGroup.id}</h1>
              <p className="text-xs sm:text-sm text-neutral-500">
                {selectedCategory?.type} • {formatCurrency(selectedCategory?.value || activeGroup.value || 0)} • {groupCustomers.length} Customers Enrolled
              </p>
            </div>
          </div>
          <button 
            className="btn-primary flex items-center justify-center text-sm w-full sm:w-auto"
            onClick={() => {
              const defaultVal = activeGroup?.value?.toString() || selectedCategory?.value?.toString() || '100000';
              setCustomChitValue(defaultVal);
              const d = new Date();
              d.setDate(15);
              if (d.getTime() < Date.now()) {
                d.setMonth(d.getMonth() + 1);
              }
              setDueDate(d.toISOString().split('T')[0]);
              setSearchMobile('');
              setFoundCustomer(null);
              const diskCusts = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
              setSearchSuggestions(diskCusts.slice(0, 5));
              setIsAddCustomerModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50 whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Customer Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Chit Value</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Installment</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">Withdrawal Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">Payment Proof</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100 whitespace-nowrap">
                {groupCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">No customers enrolled in this group yet. Click "+ Add Customer" above to enroll.</td>
                  </tr>
                ) : (
                  groupCustomers.map((c) => {
                    const chit = c.chits?.find((ch: any) => (
                      ch.groupId === activeGroup.id || 
                      ch.groupId === activeGroup.code ||
                      ch.groupId === activeGroup.name ||
                      (activeGroup.name && ch.groupName === activeGroup.name)
                    )) || c.chits?.[0];
                    
                    // Verify if payment confirmation exists in ledger or chit record
                    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
                    const groupId = activeGroup.id || activeGroup.code;
                    const cleanCPhone = (c.mobile || c.phone || '').replace(/\D/g, '');
                    const hasConfirmedPayment = 
                      chit?.paymentStatus === 'PAID' || 
                      (Number(chit?.totalPaid) > 0) || 
                      (Number(chit?.paidAmount) > 0) ||
                      ledger.some((t: any) => 
                        (t.type === 'CREDIT' || t.category === 'INSTALLMENT') && 
                        ((t.reference?.includes(c.id) || t.reference?.includes(c.name) || t.description?.includes(c.name) || t.description?.includes(c.id) || t.customerName === c.name || t.customerId === c.id) &&
                        (t.reference?.includes(groupId) || t.description?.includes(groupId) || t.groupId === groupId))
                      );

                    // Withdrawal status calculation (Yes / No / Pending)
                    const wReqs = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
                    const groupWReq = wReqs.find((w: any) => {
                      const wPhone = (w.mobile || '').replace(/\D/g, '');
                      return (
                        (w.customerId === c.id || (cleanCPhone && wPhone === cleanCPhone)) &&
                        (w.groupId === groupId || w.groupId === activeGroup.id || w.groupId === activeGroup.name || (activeGroup.name && w.groupName === activeGroup.name))
                      );
                    });

                    const hasDisbursedInLedger = ledger.some((t: any) =>
                      t.type === 'DEBIT' &&
                      (t.category === 'DISBURSAL' || t.description?.toLowerCase().includes('disburs') || t.description?.toLowerCase().includes('withdraw')) &&
                      ((t.customerId === c.id || t.customerName === c.name || t.reference?.includes(c.id) || t.description?.includes(c.id)) &&
                       (t.groupId === groupId || t.reference?.includes(groupId) || t.description?.includes(groupId)))
                    );

                    const isWithdrawn = Boolean(chit?.isWithdrawn || (groupWReq && groupWReq.status === 'DISBURSED') || hasDisbursedInLedger);
                    const isWithdrawalPending = Boolean(groupWReq && groupWReq.status === 'PENDING_ADMIN_DISBURSAL');

                    // Payment Proof / Screenshot lookup from paymentRequests or ledger
                    const paymentReqs = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
                    const matchedPaymentReq = paymentReqs.find((r: any) => {
                      const rPhone = (r.mobile || '').replace(/\D/g, '');
                      return (
                        (r.customerId === c.id || (cleanCPhone && rPhone === cleanCPhone)) &&
                        (r.groupId === groupId || r.groupId === activeGroup.id || r.groupId === activeGroup.name || (activeGroup.name && r.groupName === activeGroup.name)) &&
                        (r.paymentScreenshot || r.screenshotUrl)
                      );
                    });

                    const matchedLedgerWithProof = ledger.find((t: any) =>
                      ((t.customerId === c.id || t.reference?.includes(c.id) || t.description?.includes(c.id)) &&
                       (t.groupId === groupId || t.reference?.includes(groupId) || t.description?.includes(groupId))) &&
                      (t.paymentScreenshot || t.screenshotUrl)
                    );

                    const proofUrl = matchedPaymentReq?.paymentScreenshot || matchedPaymentReq?.screenshotUrl || matchedLedgerWithProof?.paymentScreenshot || matchedLedgerWithProof?.screenshotUrl;

                    return (
                      <tr 
                        key={c.id || c.mobile} 
                        className="hover:bg-neutral-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/customers/${c.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary-900">{c.name}</div>
                          <div className="text-xs text-neutral-500 font-mono mt-0.5">{c.id}</div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 font-medium">{c.mobile || c.phone}</td>
                        <td className="px-6 py-4 text-neutral-600 font-bold">{formatCurrency(chit?.chitValue || activeGroup.value || 0)}</td>
                        <td className="px-6 py-4 text-neutral-600 font-bold">{formatCurrency(chit?.monthlyInstallment || (Number(activeGroup.value || 0) * 0.05))}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 font-bold text-xs uppercase rounded-full ${hasConfirmedPayment ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                            {hasConfirmedPayment ? 'Paid' : 'Dues Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isWithdrawn ? (
                            <span className="inline-flex items-center px-2.5 py-1 font-bold text-xs rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Yes {groupWReq?.disbursedRef ? `(${groupWReq.disbursedRef})` : ''}
                            </span>
                          ) : isWithdrawalPending ? (
                            <span className="inline-flex items-center px-2.5 py-1 font-bold text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1"></span>
                              Pending Claim
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 font-bold text-xs rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {proofUrl ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingScreenshot({
                                  imageUrl: proofUrl,
                                  customerName: c.name,
                                  customerId: c.id,
                                  mobile: c.mobile || c.phone,
                                  groupName: activeGroup.name || activeGroup.id,
                                  amount: matchedPaymentReq?.amount || chit?.monthlyInstallment || activeGroup.value,
                                  referenceNo: matchedPaymentReq?.referenceNo || matchedLedgerWithProof?.reference || 'N/A',
                                  paymentMode: matchedPaymentReq?.paymentMode || 'Online Payment',
                                  date: matchedPaymentReq?.submittedAt || matchedLedgerWithProof?.date || new Date().toISOString()
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-800 hover:bg-primary-100 border border-primary-200 shadow-2xs transition-all hover:scale-105"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary-600" />
                              View Proof
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">No Upload</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isAddCustomerModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg border border-neutral-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-100">
                <div>
                  <h2 className="text-lg font-bold text-primary-900">Enroll Customer</h2>
                  <p className="text-xs text-neutral-500">Group: {activeGroup.name || activeGroup.id}</p>
                </div>
                <button onClick={() => setIsAddCustomerModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Search Customer (Mobile, Name, or ID) *
                  </label>
                  <input 
                    type="text"
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    placeholder="Type 10-digit mobile number, name, or customer ID"
                    value={searchMobile}
                    onChange={(e) => handleSearchCustomer(e.target.value)}
                  />
                  
                  {foundCustomer ? (
                    <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                          ✓
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-950">{foundCustomer.name}</p>
                          <p className="text-xs text-emerald-700 font-mono">Mobile: {foundCustomer.mobile || foundCustomer.phone} · ID: {foundCustomer.id}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFoundCustomer(null); setSearchMobile(''); }}
                        className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    searchSuggestions.length > 0 && (
                      <div className="mt-2 border border-neutral-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-neutral-100 bg-neutral-50/50">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1.5 bg-neutral-100">
                          Select from Registered Customers
                        </p>
                        {searchSuggestions.map((c: any) => (
                          <div 
                            key={c.id || c.mobile}
                            onClick={() => {
                              setFoundCustomer(c);
                              setSearchMobile(c.mobile || c.phone || c.name);
                            }}
                            className="px-3 py-2 hover:bg-white hover:text-primary-700 cursor-pointer flex justify-between items-center transition-colors"
                          >
                            <div>
                              <p className="text-xs font-bold text-neutral-800">{c.name || c.fullName}</p>
                              <p className="text-[11px] text-neutral-500 font-mono">Mobile: {c.mobile || c.phone} · ID: {c.id}</p>
                            </div>
                            <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {!foundCustomer && searchMobile.length >= 3 && searchSuggestions.length === 0 && (
                    <p className="mt-2 text-xs text-rose-600 font-medium">
                      No customer found matching "{searchMobile}". Please check the number or register the customer first.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Chit Value (₹)
                    </label>
                    <input 
                      type="number"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={customChitValue}
                      onChange={(e) => setCustomChitValue(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Monthly Installment (5%)
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-700 font-bold"
                      value={formatCurrency(Number(customChitValue || 0) * 0.05)}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    First Due Date
                  </label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">Defaults to the 15th of the month.</p>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
                  <button 
                    className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
                    onClick={() => setIsAddCustomerModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    onClick={handleEnrollCustomer}
                    disabled={!foundCustomer}
                  >
                    Enroll Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If a category is selected, show its groups
  if (selectedCategory) {
    const matchingGroups = chitGroups.filter(g => g.type.toUpperCase() === selectedCategory.type.toUpperCase() && Number(g.value) === Number(selectedCategory.value));
    
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <button 
              onClick={handleBackToCategories}
              className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary-900 tracking-tight">
                {selectedCategory.type} Plan - {formatCurrency(selectedCategory.value)}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500">Select a group to view enrolled customers.</p>
            </div>
          </div>
          <button 
            className="btn-primary flex items-center justify-center text-sm w-full sm:w-auto"
            onClick={() => {
              setNewGroupValue(selectedCategory.value.toString());
              setNewGroupMembers('20');
              setNewGroupName(`${selectedCategory.type} ${formatCurrency(selectedCategory.value)} Group`);
              setIsAddGroupModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Group
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50 whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Group Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Group ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Occupancy</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100 whitespace-nowrap">
                {matchingGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      No groups found for this value. Click "Add Group" above to create one.
                    </td>
                  </tr>
                ) : (
                  matchingGroups.map(g => (
                    <tr 
                      key={g.id} 
                      onClick={() => handleGroupClick(g)}
                      className="hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary-900">{g.name || g.id}</div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 font-mono text-sm">{g.id}</td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">{g.duration} Months</td>
                      <td className="px-6 py-4 text-neutral-600 font-medium">{g.filled || 0} / {g.members}</td>
                      <td className="px-6 py-4 text-right text-primary-600 font-medium hover:text-primary-800">
                        View &rarr;
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isAddGroupModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary-900">Add New Group</h2>
                <button onClick={() => setIsAddGroupModalOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Group Name</label>
                  <input 
                    type="text"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Festival 1L Group A"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Chit Value (₹)</label>
                  <input 
                    type="number"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-neutral-100 cursor-not-allowed text-neutral-500"
                    value={newGroupValue}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Total Members</label>
                  <input 
                    type="number"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={newGroupMembers}
                    onChange={(e) => setNewGroupMembers(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                    onClick={() => setIsAddGroupModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || !newGroupValue || !newGroupMembers}
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Root level: Plan Overview
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-900 tracking-tight">Dashboard Overview</h1>
        <div className="text-sm text-neutral-500">Last updated: {now}</div>
      </div>

      {/* Plans Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isAuction = plan.id.toLowerCase().includes('auction');
          const Icon = isAuction ? TrendingUp : Layers;
          const title = plan.title.replace('Manage ', '').replace(' Categories', '');
          
          return (
            <div 
              key={plan.id}
              className={`card border-l-4 ${isAuction ? 'border-l-success' : 'border-l-primary-900'} p-6 cursor-pointer hover:shadow-md transition-all duration-200`}
              onClick={() => setActivePlanId(activePlanId === plan.id ? null : plan.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Plan Category</p>
                  <h3 className={`text-2xl font-bold ${isAuction ? 'text-success' : 'text-primary-900'}`}>{title}</h3>
                </div>
                <div className={`p-3 rounded-md ${isAuction ? 'bg-success-light' : 'bg-primary-100'}`}>
                  <Icon className={`h-6 w-6 ${isAuction ? 'text-success' : 'text-primary-900'}`} />
                </div>
              </div>
              <div className="mt-6 text-sm text-neutral-500">
                Click to view categories
              </div>
            </div>
          );
        })}
      </div>

      {activePlanId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {plans.find(p => p.id === activePlanId)?.categories?.map((cat: any) => {
            const isAuction = activePlanId.includes('auction');
            return (
              <div 
                key={cat.id} 
                onClick={() => handleCategoryClick(plans.find(p => p.id === activePlanId)!.title.replace('Manage ', '').replace(' Categories', ''), cat.value)}
                className={`card p-5 border-t-4 ${isAuction ? 'border-success hover:border-success-dark' : 'border-primary-500 hover:border-primary-700'} transition-colors cursor-pointer bg-white shadow-sm flex flex-col justify-center`}
              >
                <h4 className={`font-bold text-xl ${isAuction ? 'text-success' : 'text-primary-900'}`}>{formatCurrency(cat.value)}</h4>
                <p className="text-xs text-neutral-500 mt-2">{plans.find(p => p.id === activePlanId)!.title.replace('Manage ', '').replace(' Categories', '')}</p>
              </div>
            );
          })}
          {(!plans.find(p => p.id === activePlanId)?.categories || plans.find(p => p.id === activePlanId)!.categories.length === 0) && (
            <div className="col-span-full py-8 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">
              No categories available for this plan. Please add them in the 'Manage Plans' page.
            </div>
          )}
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Customer Growth */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary-600" />
              Customer Growth
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={
                customers.length === 0 ? [] : (() => {
                  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
                  return months.map(m => ({
                    month: m,
                    customers: m === 'Oct' ? customers.length : 0
                  }));
                })()
              }>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 12}} />
                <RechartsTooltip cursor={{stroke: '#e5e5e5', strokeWidth: 2}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="customers" stroke="#d97706" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collections Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary-900 flex items-center">
              <IndianRupee className="w-5 h-5 mr-2 text-primary-600" />
              Collections vs Pending
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                {
                  name: 'Overall', 
                  Collected: customers.reduce((acc, c) => acc + (c.totalPaid || 0), 0),
                  Pending: customers.reduce((acc, c) => acc + (c.pending || 0), 0)
                }
              ]} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} hide />
                <RechartsTooltip cursor={{fill: '#f5f5f5'}} formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="Collected" fill="#10b981" radius={[0, 4, 4, 0]} barSize={40} />
                <Bar dataKey="Pending" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chit Groups Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-primary-900 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-primary-600" />
              Chit Value Distribution
            </h3>
          </div>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(() => {
                    const fixedTotal = chitGroups.filter(g => g.type?.toUpperCase() === 'FIXED').reduce((acc, g) => acc + (g.value * g.members), 0);
                    const auctionTotal = chitGroups.filter(g => g.type?.toUpperCase() === 'AUCTION').reduce((acc, g) => acc + (g.value * g.members), 0);
                    
                    if (fixedTotal === 0 && auctionTotal === 0) {
                      return [{ name: 'No Data', value: 1 }];
                    }
                    
                    return [
                      { name: 'Fixed Plans', value: fixedTotal },
                      { name: 'Auction Plans', value: auctionTotal }
                    ].filter(item => item.value > 0);
                  })()}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}: any) => name === 'No Data' ? 'No Data' : `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#d97706" />
                  <Cell fill="#10b981" />
                </Pie>
                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Admin Payment Screenshot Viewer Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-primary-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary-200" />
                  Customer Payment Proof Screenshot
                </h3>
                <p className="text-xs text-primary-200 mt-0.5">
                  {viewingScreenshot.customerName} ({viewingScreenshot.customerId}) · {viewingScreenshot.groupName}
                </p>
              </div>
              <button 
                onClick={() => setViewingScreenshot(null)} 
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Transaction Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-500 font-semibold block text-[10px] uppercase tracking-wider">Amount Paid</span>
                  <span className="font-bold text-neutral-900 text-sm">{formatCurrency(viewingScreenshot.amount || 0)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-semibold block text-[10px] uppercase tracking-wider">Payment Mode</span>
                  <span className="font-bold text-primary-800">{viewingScreenshot.paymentMode}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-semibold block text-[10px] uppercase tracking-wider">UTR / Ref No.</span>
                  <span className="font-mono font-bold text-neutral-900">{viewingScreenshot.referenceNo}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-semibold block text-[10px] uppercase tracking-wider">Date Submitted</span>
                  <span className="font-semibold text-neutral-700">
                    {new Date(viewingScreenshot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Full Image Preview Box */}
              <div className="bg-neutral-900 rounded-xl p-2 flex items-center justify-center max-h-[55vh] overflow-auto border border-neutral-300">
                <img 
                  src={viewingScreenshot.imageUrl} 
                  alt="Payment Proof" 
                  className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-md"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <a
                  href={viewingScreenshot.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={`receipt-${viewingScreenshot.customerId}.png`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open / Download Full Resolution
                </a>
                <button
                  type="button"
                  onClick={() => setViewingScreenshot(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

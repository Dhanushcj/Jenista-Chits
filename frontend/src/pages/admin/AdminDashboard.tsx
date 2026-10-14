import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, TrendingUp, ArrowLeft, Plus, X, Users, IndianRupee, PieChart as PieChartIcon, Eye, CheckCircle2, ExternalLink, Wallet, UserCheck, ArrowRight, Table, CreditCard, Clock, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { fetchClient } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import { StaffDashboard } from '../staff/StaffDashboard';
import type { PaymentRequest } from '../../utils/paymentRequestsData';
import { 
  getStoredPaymentRequests, 
  isPendingPayment, 
  approvePaymentRequestAction, 
  rejectPaymentRequestAction 
} from '../../utils/paymentRequestsData';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  
  const [chitGroups, setChitGroups] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupValue, setNewGroupValue] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('20');
  const [newCustomerChitAmount, setNewCustomerChitAmount] = useState('5000');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<{type: string, value: number} | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [customChitValue, setCustomChitValue] = useState('');
  const [viewingScreenshot, setViewingScreenshot] = useState<any | null>(null);

  const { user } = useAuth();
  const [handovers, setHandovers] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('staffHandovers') || '[]');
    } catch {
      return [];
    }
  });
  const [pendingCustomerApprovals, setPendingCustomerApprovals] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [paymentActionInProgress, setPaymentActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    const loadStaffOversight = () => {
      try {
        const ho = localStorage.getItem('staffHandovers');
        if (ho) setHandovers(JSON.parse(ho));
        const custs = localStorage.getItem('mockCustomers');
        if (custs) {
          const parsed = JSON.parse(custs);
          setPendingCustomerApprovals(parsed.filter((c: any) => c.status === 'PENDING_APPROVAL'));
        }
        setPaymentRequests(getStoredPaymentRequests());
      } catch {}
    };
    loadStaffOversight();
    window.addEventListener('storage', loadStaffOversight);
    const interval = setInterval(loadStaffOversight, 4000);
    return () => {
      window.removeEventListener('storage', loadStaffOversight);
      clearInterval(interval);
    };
  }, []);

  const handleApprovePayment = (req: PaymentRequest) => {
    setPaymentActionInProgress(req.id);
    try {
      approvePaymentRequestAction(req);
      setPaymentRequests(getStoredPaymentRequests());
      alert(`Payment of ₹${Number(req.amount).toLocaleString('en-IN')} for ${req.customerName} verified & approved! Ledger updated.`);
    } catch (err) {
      console.error('Error approving payment:', err);
      alert('Failed to approve payment.');
    } finally {
      setPaymentActionInProgress(null);
    }
  };

  const handleRejectPayment = (req: PaymentRequest) => {
    if (!window.confirm(`Are you sure you want to reject payment request ${req.id} for ${req.customerName}?`)) {
      return;
    }
    setPaymentActionInProgress(req.id);
    try {
      rejectPaymentRequestAction(req.id);
      setPaymentRequests(getStoredPaymentRequests());
    } finally {
      setPaymentActionInProgress(null);
    }
  };

  const handleAcceptHandover = (handoverId: string) => {
    const updated = handovers.map((h: any) => {
      if (h.id === handoverId) {
        return { ...h, status: 'SETTLED', settledAt: new Date().toISOString(), settledBy: user?.name || 'Admin' };
      }
      return h;
    });
    setHandovers(updated);
    localStorage.setItem('staffHandovers', JSON.stringify(updated));

    const targetH = handovers.find((h: any) => h.id === handoverId);
    if (targetH) {
      const existingLedger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
      const ledgerEntry = {
        id: `LEDGER-HO-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        type: 'CREDIT',
        category: 'STAFF_HANDOVER',
        amount: Number(targetH.totalCashCollected || 0),
        reference: `${targetH.staffName} (${targetH.staffId})`,
        description: `EOD Cash Handover Reconciled - ${targetH.receiptsCount} Receipts Collected`,
      };
      localStorage.setItem('ledgerTransactions', JSON.stringify([ledgerEntry, ...existingLedger]));
    }

    window.dispatchEvent(new Event('storage'));
    alert(`Day-End Cash Handover of ${formatCurrency(targetH?.totalCashCollected || targetH?.countedTotal || 0)} has been verified and settled!`);
  };

  const handleApproveCustomer = async (cust: any) => {
    try {
      if (cust.mongoId || cust.id) {
        await fetchClient(`/customers/${cust.mongoId || cust.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'ACTIVE' }),
        }).catch(() => {});
      }
    } catch {}

    const diskCusts = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
    const updated = diskCusts.map((c: any) => {
      if (c.id === cust.id || c.mongoId === cust.mongoId) {
        return { ...c, status: 'ACTIVE' };
      }
      return c;
    });
    localStorage.setItem('mockCustomers', JSON.stringify(updated));
    setCustomers(updated);
    setPendingCustomerApprovals(updated.filter((c: any) => c.status === 'PENDING_APPROVAL'));
    window.dispatchEvent(new Event('storage'));
    alert(`Customer ${cust.name} approved and activated!`);
  };

  const now = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' });

  const generateSeedMembers = (groupId: string, groupName: string, groupValue: number, filled: number, members: number = 20) => {
    const customerNames = [
      'S. Murugan', 'K. Selvam', 'R. Priya', 'M. Kumar', 'A. Lakshmi',
      'V. Saravanan', 'P. Suresh', 'T. Anand', 'D. Kavitha', 'N. Ramesh',
      'B. Divya', 'J. Karthik', 'G. Balaji', 'S. Vijay', 'M. Senthil',
      'K. Revathi', 'P. Mani', 'R. Vignesh', 'E. Rajesh', 'S. Deepa'
    ];
    const monthlyAmount = Math.round(groupValue / members);
    const result: any[] = [];
    for (let i = 0; i < filled; i++) {
      const custName = customerNames[i % customerNames.length];
      const ticketNo = (i + 1).toString().padStart(3, '0');
      const custId = `CUST-${1000 + i + 1}`;
      const phone = `9840${(123456 + i).toString().slice(-6)}`;
      result.push({
        customerId: custId,
        customerName: custName,
        mobile: phone,
        phone: phone,
        ticketNumber: ticketNo,
        groupId: groupId,
        groupName: groupName,
        chitValue: groupValue,
        monthlyInstallment: monthlyAmount,
        chitAmount: monthlyAmount,
        paymentStatus: i % 4 === 0 ? 'DUE' : 'PAID',
        dueDate: '2026-10-15',
        joinedAt: '2026-06-01T10:00:00.000Z'
      });
    }
    return result;
  };

  useEffect(() => {
    const savedPlans = localStorage.getItem('mockPlans');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    } else {
      const savedRegular = localStorage.getItem('mockRegularCategories');
      const savedFixed = localStorage.getItem('mockFixedCategories');
      const savedAuction = localStorage.getItem('mockAuctionCategories');
      const initialPlans = [
        { id: 'regular', title: 'Manage Regular Categories', categories: savedRegular ? JSON.parse(savedRegular) : [{ id: 1, value: 100000 }, { id: 2, value: 200000 }, { id: 3, value: 500000 }, { id: 4, value: 1000000 }] },
        { id: 'fixed', title: 'Manage Fixed Categories', categories: savedFixed ? JSON.parse(savedFixed) : [{ id: 1, value: 100000 }, { id: 2, value: 200000 }, { id: 3, value: 500000 }, { id: 4, value: 1000000 }] },
        { id: 'auction', title: 'Manage Auction Categories', categories: savedAuction ? JSON.parse(savedAuction) : [{ id: 1, value: 500000 }, { id: 2, value: 1000000 }] }
      ];
      setPlans(initialPlans);
    }

    const defaultInitialGroups = [
      { id: 'CG-REG-101', name: 'Regular 1L - Group A', type: 'Regular', value: 100000, customerChitAmount: 5000, duration: 20, members: 20, filled: 16, currentMonth: 4, status: 'Active', enrolledMembers: generateSeedMembers('CG-REG-101', 'Regular 1L - Group A', 100000, 16, 20) },
      { id: 'CG-REG-102', name: 'Regular 2L - Group B', type: 'Regular', value: 200000, customerChitAmount: 10000, duration: 20, members: 20, filled: 12, currentMonth: 3, status: 'Active', enrolledMembers: generateSeedMembers('CG-REG-102', 'Regular 2L - Group B', 200000, 12, 20) },
      { id: 'CG-REG-103', name: 'Regular 5L - Group C', type: 'Regular', value: 500000, customerChitAmount: 25000, duration: 20, members: 20, filled: 18, currentMonth: 7, status: 'Active', enrolledMembers: generateSeedMembers('CG-REG-103', 'Regular 5L - Group C', 500000, 18, 20) },
      { id: 'CG-REG-104', name: 'Regular 10L - Group D', type: 'Regular', value: 1000000, customerChitAmount: 50000, duration: 20, members: 20, filled: 14, currentMonth: 2, status: 'Active', enrolledMembers: generateSeedMembers('CG-REG-104', 'Regular 10L - Group D', 1000000, 14, 20) },
      { id: 'CG-FIX-201', name: 'Fixed 1L - Series A', type: 'Fixed', value: 100000, customerChitAmount: 5000, duration: 20, members: 20, filled: 15, currentMonth: 5, status: 'Active', enrolledMembers: generateSeedMembers('CG-FIX-201', 'Fixed 1L - Series A', 100000, 15, 20) },
      { id: 'CG-FIX-202', name: 'Fixed 2L - Series B', type: 'Fixed', value: 200000, customerChitAmount: 10000, duration: 20, members: 20, filled: 11, currentMonth: 4, status: 'Active', enrolledMembers: generateSeedMembers('CG-FIX-202', 'Fixed 2L - Series B', 200000, 11, 20) },
      { id: 'CG-AUC-301', name: 'Auction 5L - Gold A', type: 'Auction', value: 500000, customerChitAmount: 25000, duration: 20, members: 20, filled: 20, currentMonth: 8, status: 'Active', enrolledMembers: generateSeedMembers('CG-AUC-301', 'Auction 5L - Gold A', 500000, 20, 20) },
      { id: 'CG-AUC-302', name: 'Auction 10L - Diamond B', type: 'Auction', value: 1000000, customerChitAmount: 50000, duration: 20, members: 20, filled: 17, currentMonth: 6, status: 'Active', enrolledMembers: generateSeedMembers('CG-AUC-302', 'Auction 10L - Diamond B', 1000000, 17, 20) }
    ];

    const enrichGroups = (groupsList: any[]) => {
      return groupsList.map((g: any) => {
        const memCount = Number(g.members || 20);
        const perCust = Number(g.customerChitAmount) || (Number(g.value) / memCount);
        const filledCount = Number(g.filled || 0);
        const currentEnrolled = Array.isArray(g.enrolledMembers) && g.enrolledMembers.length > 0
          ? g.enrolledMembers
          : (filledCount > 0 ? generateSeedMembers(g.id, g.name, g.value, filledCount, memCount) : []);
        return {
          ...g,
          customerChitAmount: perCust,
          enrolledMembers: currentEnrolled,
          filled: Math.max(filledCount, currentEnrolled.length)
        };
      });
    };

    const g = localStorage.getItem('mockChitGroups');
    if (g) {
      try {
        const parsed = JSON.parse(g);
        const hasRegular = parsed.some((item: any) => (item.type || '').toUpperCase() === 'REGULAR');
        let combinedList = parsed;
        if (!hasRegular) {
          const regularSeeds = defaultInitialGroups.filter(d => d.type === 'Regular');
          combinedList = [...parsed, ...regularSeeds];
        }
        const enriched = enrichGroups(combinedList);
        setChitGroups(enriched);
        localStorage.setItem('mockChitGroups', JSON.stringify(enriched));
      } catch {
        const enriched = enrichGroups(defaultInitialGroups);
        setChitGroups(enriched);
        localStorage.setItem('mockChitGroups', JSON.stringify(enriched));
      }
    } else {
      const enriched = enrichGroups(defaultInitialGroups);
      setChitGroups(enriched);
      localStorage.setItem('mockChitGroups', JSON.stringify(enriched));
    }
    
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


  const handlePlanClick = (plan: any) => {
    const planType = plan.title.replace('Manage ', '').replace(' Categories', '');
    setSelectedCategory({ type: planType, value: 0 });
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
    const mem = Number(newGroupMembers) || 20;
    const custAmt = Number(newCustomerChitAmount) || (Number(newGroupValue) / mem) || 5000;
    // Group Chit Value is calculated by all customers' chit amount values:
    const val = custAmt * mem;
    if (!val || !mem || !newGroupName.trim() || !selectedCategory) return;

    const newGroup = {
      id: newGroupName.replace(/\s+/g, '-').toUpperCase() + '-' + Date.now().toString().slice(-4),
      name: newGroupName,
      type: selectedCategory.type,
      value: val,
      customerChitAmount: custAmt,
      duration: mem,
      members: mem,
      filled: 0,
      enrolledMembers: [],
      status: 'Active'
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

  // If logged-in user is STAFF, display dedicated Staff Dashboard
  if (user?.role === 'STAFF') {
    return <StaffDashboard />;
  }

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

    const totalGroupMembers = Number(activeGroup.members || 20);
    const groupDuration = Number(activeGroup.duration || 20);
    const perCustomerChitAmount = Number(activeGroup.customerChitAmount) || (Number(activeGroup.value || 100000) / totalGroupMembers);
    const calculatedGroupChitValue = perCustomerChitAmount * totalGroupMembers;

    // Sum of all enrolled customers' monthly chit amount values:
    const enrolledMonthlyChitAmountSum = groupCustomers.reduce((sum, c) => {
      const chit = c.chits?.find((ch: any) => (
        ch.groupId === activeGroup.id || ch.groupId === activeGroup.code || ch.groupName === activeGroup.name || ch.groupId === activeGroup.name
      )) || c.chits?.[0];
      return sum + Number(chit?.monthlyInstallment || chit?.chitAmount || perCustomerChitAmount);
    }, 0);

    const enrolledTotalChitValueSum = groupCustomers.reduce((sum, c) => {
      const chit = c.chits?.find((ch: any) => (
        ch.groupId === activeGroup.id || ch.groupId === activeGroup.code || ch.groupName === activeGroup.name || ch.groupId === activeGroup.name
      )) || c.chits?.[0];
      return sum + Number(chit?.chitValue || (chit?.monthlyInstallment ? chit.monthlyInstallment * groupDuration : calculatedGroupChitValue));
    }, 0);

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
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-primary-900 tracking-tight">{activeGroup.name || activeGroup.id}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Chit Value: {formatCurrency(enrolledTotalChitValueSum || (groupCustomers.length * Number(activeGroup.value || 100000)) || calculatedGroupChitValue)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{selectedCategory?.type || activeGroup.type} Plan</span>
                <span>•</span>
                <span>{totalGroupMembers} Members Capacity</span>
                <span>•</span>
                <span>{groupDuration} Months Duration</span>
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Customer Chit Amount
                    <span className="block text-[10px] text-amber-700 font-semibold normal-case">(Monthly Installment)</span>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Chit Value
                    <span className="block text-[10px] text-neutral-400 font-medium normal-case">(Full Scheme Share)</span>
                  </th>
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
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md font-mono font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200">
                            {formatCurrency(chit?.monthlyInstallment || chit?.chitAmount || perCustomerChitAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-neutral-800">
                          {formatCurrency(chit?.chitValue || calculatedGroupChitValue)}
                        </td>
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
              <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                <tr className="font-bold text-xs text-neutral-700">
                  <td colSpan={2} className="px-6 py-3.5">
                    <span className="text-neutral-500 uppercase tracking-wider text-[11px]">Enrolled Members:</span>{' '}
                    <span className="text-neutral-900 font-extrabold">{groupCustomers.length} Customers Enrolled</span>
                  </td>
                  <td className="px-6 py-3.5 text-amber-900 font-black text-sm">
                    {formatCurrency(enrolledMonthlyChitAmountSum)} / mo
                  </td>
                  <td className="px-6 py-3.5 text-primary-900 font-black text-sm">
                    {formatCurrency(enrolledTotalChitValueSum)}
                  </td>
                  <td colSpan={3} className="px-6 py-3.5 text-neutral-600 text-right text-xs">
                    Total Group Chit Value: <strong className="text-neutral-900 font-extrabold">{formatCurrency(calculatedGroupChitValue)}</strong>
                  </td>
                </tr>
              </tfoot>
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
    const matchingGroups = chitGroups.filter(g => {
      const gType = (g.type || '').toUpperCase();
      const selType = (selectedCategory.type || '').toUpperCase();
      const matchesType = gType.includes(selType) || selType.includes(gType);
      if (selectedCategory.value && selectedCategory.value > 0) {
        return matchesType && Number(g.value) === Number(selectedCategory.value);
      }
      return matchesType;
    });
    
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <button 
              onClick={handleBackToCategories}
              className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shrink-0 mt-1 sm:mt-0"
              title="Back to Overview"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary-900 tracking-tight">
                {selectedCategory.type} Plan Groups
                {selectedCategory.value > 0 && ` - ${formatCurrency(selectedCategory.value)}`}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500">
                {matchingGroups.length} active group{matchingGroups.length !== 1 ? 's' : ''} available. Select a group to view enrolled customers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/chit-groups')}
              className="px-3.5 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors shadow-xs"
            >
              All Chit Groups Page →
            </button>
            <button 
              className="btn-primary flex items-center justify-center text-sm w-full sm:w-auto"
              onClick={() => {
                const defaultVal = selectedCategory.value > 0 ? selectedCategory.value.toString() : '100000';
                const defaultMem = '20';
                const defaultCustAmt = (Number(defaultVal) / Number(defaultMem)).toString();
                setNewGroupValue(defaultVal);
                setNewGroupMembers(defaultMem);
                setNewCustomerChitAmount(defaultCustAmt);
                setNewGroupName(`${selectedCategory.type} Group`);
                setIsAddGroupModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Group
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50 whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Group Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Group ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Chit Value</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Monthly Installment Receivables</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Installment Received</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider">Occupancy</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100 whitespace-nowrap">
                {matchingGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      No groups found for {selectedCategory.type} Plan. Click "Add Group" above to create one.
                    </td>
                  </tr>
                ) : (
                  matchingGroups.map(g => {
                    const totalMembers = Number(g.members || 20);
                    
                    // Resolve enrolled customers for this group
                    const allMemberships = JSON.parse(localStorage.getItem('chitGroupMemberships') || '[]');
                    const allDiskCustomers = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
                    
                    const directMembers = Array.isArray(g.enrolledMembers) ? g.enrolledMembers : [];
                    const storeMembers = allMemberships.filter((m: any) => 
                      m.groupId === g.id || m.groupId === g.code || (g.name && m.groupName === g.name) || (g.name && m.groupId === g.name)
                    );
                    const custMembers = allDiskCustomers.filter((c: any) =>
                      c.chits?.some((ch: any) =>
                        ch.groupId === g.id || ch.groupId === g.code || (g.name && ch.groupName === g.name) || (g.name && ch.groupId === g.name)
                      )
                    );

                    const memberSet = new Set<string>();
                    const enrolledList: any[] = [];
                    [...directMembers, ...storeMembers].forEach((m: any) => {
                      const key = m.customerId || (m.mobile || m.phone || '').replace(/\D/g, '') || m.ticketNumber;
                      if (key && !memberSet.has(key)) {
                        memberSet.add(key);
                        enrolledList.push(m);
                      }
                    });
                    custMembers.forEach((c: any) => {
                      const key = c.id || (c.mobile || c.phone || '').replace(/\D/g, '');
                      if (key && !memberSet.has(key)) {
                        memberSet.add(key);
                        const matchedChit = c.chits?.find((ch: any) =>
                          ch.groupId === g.id || ch.groupId === g.code || (g.name && ch.groupName === g.name) || (g.name && ch.groupId === g.name)
                        ) || c.chits?.[0];
                        enrolledList.push({ ...c, ...matchedChit });
                      }
                    });

                    const effectiveFilled = Math.max(enrolledList.length, Number(g.filled) || 0);

                    // Group Chit Value calculated from all enrolled customers' chit values:
                    const knownEnrolledSum = enrolledList.reduce(
                      (sum: number, m: any) => sum + Number(m.chitValue || g.value || 100000), 
                      0
                    );
                    const remainingSlots = Math.max(0, effectiveFilled - enrolledList.length);
                    const totalCustomerChitValue = knownEnrolledSum + (remainingSlots * Number(g.value || 100000));

                    // Monthly Installment Receivables & Installment Received calculations:
                    const monthlyPerMember = Number(g.customerChitAmount) || (Number(g.value || 100000) / totalMembers);
                    const monthlyReceivables = enrolledList.length > 0
                      ? enrolledList.reduce((sum: number, m: any) => sum + Number(m.monthlyInstallment || m.chitAmount || monthlyPerMember), 0) + (remainingSlots * monthlyPerMember)
                      : (effectiveFilled * monthlyPerMember);

                    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
                    const groupId = g.id || g.code;

                    let totalReceived = 0;
                    enrolledList.forEach((m: any) => {
                      const cleanPhone = (m.mobile || m.phone || '').replace(/\D/g, '');
                      const mInstallment = Number(m.monthlyInstallment || m.chitAmount || monthlyPerMember);
                      
                      const hasLedgerPay = ledger.some((t: any) =>
                        (t.type === 'CREDIT' || t.category === 'INSTALLMENT') &&
                        ((t.customerId === m.customerId || (cleanPhone && t.reference?.includes(cleanPhone)) || t.reference?.includes(m.customerId) || t.customerName === m.customerName || t.description?.includes(m.customerName)) &&
                         (t.groupId === groupId || t.reference?.includes(groupId) || (g.name && t.description?.includes(g.name))))
                      );

                      if (m.paymentStatus === 'PAID' || hasLedgerPay || Number(m.paidAmount) > 0 || Number(m.totalPaid) > 0) {
                        totalReceived += mInstallment;
                      }
                    });

                    if (enrolledList.length < effectiveFilled) {
                      const extraPaidSlots = Math.round(remainingSlots * 0.75);
                      totalReceived += extraPaidSlots * monthlyPerMember;
                    }

                    return (
                      <tr 
                        key={g.id} 
                        onClick={() => handleGroupClick(g)}
                        className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary-900 group-hover:text-primary-700">{g.name || g.id}</div>
                        </td>
                        <td className="px-6 py-4 text-neutral-500 font-mono text-sm">{g.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary-900 text-base">
                            {formatCurrency(totalCustomerChitValue)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-neutral-900 text-base">
                            {formatCurrency(monthlyReceivables)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-emerald-700 text-base">
                            {formatCurrency(totalReceived)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 font-medium">
                          <div className="font-semibold">{effectiveFilled} / {totalMembers}</div>
                          <div className="w-24 bg-neutral-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div 
                              className="bg-primary-600 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(100, (effectiveFilled / totalMembers) * 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {g.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isAddGroupModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-neutral-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-100">
                <div>
                  <h2 className="text-lg font-bold text-primary-900">Add New {selectedCategory.type} Group</h2>
                  <p className="text-xs text-neutral-500">Chit value is calculated from all customer chit amount values.</p>
                </div>
                <button onClick={() => setIsAddGroupModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Group Name *</label>
                  <input 
                    type="text"
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    placeholder={`e.g. ${selectedCategory.type} 1L Group A`}
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Customer Chit Amount (₹) *
                    </label>
                    <input 
                      type="number"
                      step="500"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. 5000"
                      value={newCustomerChitAmount}
                      onChange={(e) => {
                        const custAmt = e.target.value;
                        setNewCustomerChitAmount(custAmt);
                        const mem = Number(newGroupMembers) || 20;
                        setNewGroupValue((Number(custAmt || 0) * mem).toString());
                      }}
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">Per member monthly due</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Total Members *
                    </label>
                    <input 
                      type="number"
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={newGroupMembers}
                      onChange={(e) => {
                        const mem = e.target.value;
                        setNewGroupMembers(mem);
                        const custAmt = Number(newCustomerChitAmount) || 0;
                        setNewGroupValue((custAmt * Number(mem || 0)).toString());
                      }}
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">Total customer slots</p>
                  </div>
                </div>

                {/* Quick Presets for Customer Chit Amount */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Quick Chit Amount Presets (20 Members)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { custAmt: '5000', totalVal: '100000', label: '1L (₹5k/m)' },
                      { custAmt: '10000', totalVal: '200000', label: '2L (₹10k/m)' },
                      { custAmt: '25000', totalVal: '500000', label: '5L (₹25k/m)' },
                      { custAmt: '50000', totalVal: '1000000', label: '10L (₹50k/m)' }
                    ].map(preset => (
                      <button
                        key={preset.custAmt}
                        type="button"
                        onClick={() => {
                          setNewCustomerChitAmount(preset.custAmt);
                          setNewGroupMembers('20');
                          setNewGroupValue(preset.totalVal);
                        }}
                        className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                          newCustomerChitAmount === preset.custAmt 
                            ? 'bg-primary-600 text-white border-primary-600 shadow-xs' 
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-950 block">Calculated Chit Value</span>
                      <span className="text-xs text-amber-800 font-medium">
                        {newCustomerChitAmount ? formatCurrency(Number(newCustomerChitAmount)) : '₹0'} × {newGroupMembers || 20} members
                      </span>
                    </div>
                    <span className="text-xl font-black text-amber-950 font-mono">
                      {formatCurrency(Number(newCustomerChitAmount || 0) * Number(newGroupMembers || 20))}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-2 border-t border-amber-200/60 pt-2 font-medium">
                    ✓ Group Chit Value is calculated by all {newGroupMembers || 20} customers' chit amount values.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
                  <button 
                    className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
                    onClick={() => setIsAddGroupModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || !newCustomerChitAmount || !newGroupMembers}
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

      {/* Customer Online Payment Requests Desk */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-900 text-base">Customer Payment Requests Desk</h3>
                {paymentRequests.filter(r => isPendingPayment(r.status)).length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                    {paymentRequests.filter(r => isPendingPayment(r.status)).length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Review online chit installment payments submitted by customers via UPI, GPay, PhonePe, or Net Banking
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/payments')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors border border-primary-200 shrink-0 self-start sm:self-auto"
          >
            <span>Go to Payments Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4">
          {paymentRequests.filter(r => isPendingPayment(r.status)).length === 0 ? (
            <div className="py-8 text-center text-neutral-400 space-y-2 bg-neutral-50 rounded-xl border border-neutral-100 border-dashed">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-neutral-700">All customer payment requests verified</p>
              <p className="text-[11px] text-neutral-400">No incoming customer payment submissions waiting for admin verification.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentRequests
                  .filter(r => isPendingPayment(r.status))
                  .slice(0, 6)
                  .map((req) => (
                    <div key={req.id} className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 flex flex-col justify-between space-y-3 hover:shadow-xs transition-shadow">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-200/70 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                              {req.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 text-sm">{req.customerName}</div>
                              <div className="text-[11px] text-neutral-500 font-mono">
                                {req.customerId} {req.mobile ? `· ${req.mobile}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black text-emerald-700">
                              ₹{Number(req.amount).toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                              {req.paymentMode}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-amber-100 text-xs space-y-1">
                          <div className="flex items-center justify-between text-neutral-600">
                            <span className="text-[11px] font-medium text-neutral-500">Group & Ticket:</span>
                            <span className="font-bold text-neutral-800 text-[11px]">
                              {req.groupName || req.groupId} {req.ticketNumber ? `(#${req.ticketNumber})` : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-600">
                            <span className="text-[11px] font-medium text-neutral-500">Ref / UTR:</span>
                            <span className="font-mono font-bold text-neutral-800 text-[11px]">
                              {req.referenceNo}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(req.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            <span>{new Date(req.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-100">
                        {(req.paymentScreenshot || req.screenshotUrl) ? (
                          <button
                            type="button"
                            onClick={() => setViewingScreenshot({
                              imageUrl: req.paymentScreenshot || req.screenshotUrl,
                              customerName: req.customerName,
                              customerId: req.customerId,
                              groupName: req.groupName || req.groupId,
                              amount: req.amount,
                              paymentMode: req.paymentMode,
                              referenceNo: req.referenceNo,
                              date: req.submittedAt
                            })}
                            className="px-2.5 py-1.5 text-xs font-bold text-primary-700 bg-white hover:bg-primary-50 border border-primary-200 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Proof</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">No Upload</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRejectPayment(req)}
                            disabled={paymentActionInProgress === req.id}
                            className="px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                            title="Reject Payment"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprovePayment(req)}
                            disabled={paymentActionInProgress === req.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {paymentRequests.filter(r => isPendingPayment(r.status)).length > 6 && (
                <button
                  onClick={() => navigate('/admin/payments')}
                  className="w-full text-center py-2 text-xs font-bold text-primary-700 hover:underline"
                >
                  View all {paymentRequests.filter(r => isPendingPayment(r.status)).length} customer payment requests in Payments desk →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Staff Operations & Oversight Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Staff Day-End Cash Handover Queue */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-base">Staff Cash Handover Desk</h3>
                <p className="text-xs text-neutral-500">Verify and reconcile field collections into master cash ledger</p>
              </div>
            </div>
            {handovers.filter((h: any) => h.status === 'PENDING_APPROVAL').length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {handovers.filter((h: any) => h.status === 'PENDING_APPROVAL').length} Pending
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {handovers.filter((h: any) => h.status === 'PENDING_APPROVAL').length === 0 ? (
              <div className="py-8 text-center text-neutral-400 space-y-2 bg-neutral-50 rounded-xl border border-neutral-100 border-dashed">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-neutral-700">All staff cash handovers reconciled</p>
                <p className="text-[11px] text-neutral-400">No pending shift settlements awaiting sign-off.</p>
              </div>
            ) : (
              handovers.filter((h: any) => h.status === 'PENDING_APPROVAL').map((ho: any) => (
                <div key={ho.id} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-neutral-900 text-sm">{ho.staffName}</div>
                      <div className="text-xs text-neutral-500">
                        {ho.receiptsCount} Receipts Collected Today · {formatDate(ho.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-700">
                        {formatCurrency(ho.totalCashCollected || ho.countedTotal || 0)}
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Cash in Envelope
                      </span>
                    </div>
                  </div>

                  {ho.remarks && (
                    <p className="text-xs text-neutral-600 bg-white/80 p-2 rounded-lg border border-neutral-200 italic">
                      "{ho.remarks}"
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleAcceptHandover(ho.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Accept Cash Handover</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Pending Staff Customer Registrations */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-base">New Customer Approvals</h3>
                <p className="text-xs text-neutral-500">Review customers enrolled by staff and allocate chit tickets</p>
              </div>
            </div>
            {pendingCustomerApprovals.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                {pendingCustomerApprovals.length} Pending
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {pendingCustomerApprovals.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 space-y-2 bg-neutral-50 rounded-xl border border-neutral-100 border-dashed">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-neutral-700">No pending registrations</p>
                <p className="text-[11px] text-neutral-400">All customer registrations have been verified and activated.</p>
              </div>
            ) : (
              pendingCustomerApprovals.slice(0, 3).map((cust: any) => (
                <div key={cust.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-neutral-900 text-sm">{cust.name}</div>
                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                      <span>Phone: {cust.mobile || cust.phone || '—'}</span>
                      <span>•</span>
                      <span className="text-indigo-600 font-semibold">{cust.referredBy || 'Staff Enrolled'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveCustomer(cust)}
                      className="px-3 py-1.5 bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => navigate('/admin/customers/approvals')}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            {pendingCustomerApprovals.length > 3 && (
              <button
                onClick={() => navigate('/admin/customers/approvals')}
                className="w-full text-center py-2 text-xs font-bold text-primary-700 hover:underline"
              >
                View all {pendingCustomerApprovals.length} pending approvals →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plans Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isAuction = plan.id.toLowerCase().includes('auction');
          const isRegular = plan.id.toLowerCase().includes('regular');
          const Icon = isAuction ? TrendingUp : isRegular ? Layers : Table;
          const title = plan.title.replace('Manage ', '').replace(' Categories', '');
          
          return (
            <div 
              key={plan.id}
              className={`card border-l-4 ${
                isAuction 
                  ? 'border-l-purple-600' 
                  : isRegular 
                    ? 'border-l-amber-500' 
                    : 'border-l-emerald-600'
              } p-6 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-200 bg-white rounded-2xl`}
              onClick={() => handlePlanClick(plan)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Chit Plan</p>
                  <h3 className={`text-2xl font-bold ${
                    isAuction ? 'text-purple-900' : isRegular ? 'text-amber-950' : 'text-emerald-900'
                  }`}>{title}</h3>
                </div>
                <div className={`p-3 rounded-xl ${
                  isAuction ? 'bg-purple-50 text-purple-700' : isRegular ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-primary-700">
                <span>View {title} Groups Options</span>
                <span className="text-base">&rarr;</span>
              </div>
            </div>
          );
        })}
      </div>

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

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Printer, 
  RotateCcw, 
  Receipt, 
  ChevronRight, 
  CreditCard,
  ShieldCheck,
  Check
} from 'lucide-react';
import { fetchClient } from '../../../api/client';

type TabType = 'VERIFICATION' | 'DIRECT_ENTRY' | 'HISTORY';

interface PaymentRequest {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  groupId: string;
  groupName?: string;
  ticketNumber?: string;
  amount: number;
  paymentMode: string;
  referenceNo: string;
  submittedAt: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  remarks?: string;
}

const EMPTY_FORM = {
  receiptNo: '',
  txType: 'COLLECTION',
  customerId: '',
  customerName: '',
  mobileNumber: '',
  chitGroup: '',
  monthNumber: '',
  amount: '',
  paymentMode: '',
  referenceNo: '',
  receiptDate: new Date().toISOString().split('T')[0],
  executive: 'Admin User',
  remarks: '',
};

export const Payments = () => {
  const [activeTab, setActiveTab] = useState<TabType>('VERIFICATION');
  
  // Verification states
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Manual Receipt Form States
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saved, setSaved] = useState(false);
  const [customersDB, setCustomersDB] = useState<any[]>([]);
  const [chitGroups, setChitGroups] = useState<any[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  // Load data
  const loadData = () => {
    // Payment requests
    const reqs = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
    setPaymentRequests(reqs);

    // Customers
    const c = localStorage.getItem('mockCustomers');
    if (c) setCustomersDB(JSON.parse(c));

    // Groups
    const g = localStorage.getItem('mockChitGroups');
    if (g) setChitGroups(JSON.parse(g));
  };

  useEffect(() => {
    loadData();
    setForm(f => ({ ...f, receiptNo: `REC-${Date.now().toString().slice(-6)}` }));

    // Listen for storage changes
    window.addEventListener('storage', loadData);
    const interval = setInterval(loadData, 4000);

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
              pending: item.pending ?? local?.pending ?? 0,
              totalPaid: item.totalPaid ?? local?.totalPaid ?? 0,
              chits: chits,
            };
          });
          setCustomersDB(mapped);
          localStorage.setItem('mockCustomers', JSON.stringify(mapped));
        }
      })
      .catch((err: any) => console.warn('Could not sync payments customers:', err));

    return () => {
      window.removeEventListener('storage', loadData);
      clearInterval(interval);
    };
  }, []);

  const pendingCount = paymentRequests.filter(r => r.status === 'PENDING_VERIFICATION').length;

  // Filter requests
  const filteredRequests = paymentRequests.filter(req => {
    if (filterStatus === 'PENDING' && req.status !== 'PENDING_VERIFICATION') return false;
    if (filterStatus === 'APPROVED' && req.status !== 'APPROVED') return false;
    if (filterStatus === 'REJECTED' && req.status !== 'REJECTED') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = req.customerName?.toLowerCase().includes(q);
      const matchId = req.customerId?.toLowerCase().includes(q);
      const matchPhone = req.mobile?.includes(q);
      const matchGroup = req.groupId?.toLowerCase().includes(q);
      const matchRef = req.referenceNo?.toLowerCase().includes(q);
      return matchName || matchId || matchPhone || matchGroup || matchRef;
    }
    return true;
  });

  // Verify & Approve Request
  const handleApprove = (req: PaymentRequest) => {
    setActionInProgress(req.id);

    try {
      // 1. Update Payment Request status
      const allReqs = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
      const updatedReqs = allReqs.map((r: any) => 
        r.id === req.id ? { ...r, status: 'APPROVED', verifiedAt: new Date().toISOString() } : r
      );
      localStorage.setItem('paymentRequests', JSON.stringify(updatedReqs));

      // 2. Add to ledgerTransactions
      const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
      const newLedgerEntry = {
        id: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        type: 'CREDIT',
        category: 'INSTALLMENT',
        amount: Number(req.amount),
        reference: `${req.customerId} / ${req.groupId}`,
        description: `Customer Online Payment (${req.paymentMode} Ref: ${req.referenceNo}) - Verified by Admin`,
        customerName: req.customerName,
        customerId: req.customerId,
        groupId: req.groupId,
        status: 'VERIFIED'
      };
      localStorage.setItem('ledgerTransactions', JSON.stringify([newLedgerEntry, ...ledger]));

      // 3. Update mockCustomers (set chit status = PAID, update totalPaid & pending)
      const customers = JSON.parse(localStorage.getItem('mockCustomers') || '[]');
      const cleanReqPhone = (req.mobile || '').replace(/\D/g, '');
      const updatedCustomers = customers.map((c: any) => {
        const cPhone = (c.mobile || c.phone || '').replace(/\D/g, '');
        if (c.id === req.customerId || (cleanReqPhone && cPhone === cleanReqPhone)) {
          const chits = Array.isArray(c.chits) ? c.chits.map((ch: any) => {
            if (ch.groupId === req.groupId) {
              return { ...ch, paymentStatus: 'PAID' };
            }
            return ch;
          }) : [];
          const curPaid = Number(c.totalPaid || 0);
          const curPending = Number(c.pending || 0);
          return {
            ...c,
            chits,
            totalPaid: curPaid + Number(req.amount),
            pending: Math.max(0, curPending - Number(req.amount))
          };
        }
        return c;
      });
      localStorage.setItem('mockCustomers', JSON.stringify(updatedCustomers));

      // 4. Update Chit Group Memberships & enrolledMembers
      const memberships = JSON.parse(localStorage.getItem('chitGroupMemberships') || '[]');
      const updatedMemberships = memberships.map((m: any) => {
        const mPhone = (m.mobile || m.phone || '').replace(/\D/g, '');
        if ((m.customerId === req.customerId || (cleanReqPhone && mPhone === cleanReqPhone)) && m.groupId === req.groupId) {
          return { ...m, paymentStatus: 'PAID' };
        }
        return m;
      });
      localStorage.setItem('chitGroupMemberships', JSON.stringify(updatedMemberships));

      const groups = JSON.parse(localStorage.getItem('mockChitGroups') || '[]');
      const updatedGroups = groups.map((g: any) => {
        if (g.code === req.groupId || g.id === req.groupId) {
          const members = Array.isArray(g.enrolledMembers) ? g.enrolledMembers.map((m: any) => {
            const mPhone = (m.mobile || m.phone || '').replace(/\D/g, '');
            if (m.customerId === req.customerId || (cleanReqPhone && mPhone === cleanReqPhone)) {
              return { ...m, paymentStatus: 'PAID' };
            }
            return m;
          }) : [];
          return { ...g, enrolledMembers: members };
        }
        return g;
      });
      localStorage.setItem('mockChitGroups', JSON.stringify(updatedGroups));

      // Dispatch event to update all components in real-time
      window.dispatchEvent(new Event('storage'));
      loadData();

      setActionSuccessMsg(`Payment of ₹${Number(req.amount).toLocaleString('en-IN')} for ${req.customerName} verified & approved!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error approving payment:', err);
      alert('Failed to approve payment. Please check console.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Reject Request
  const handleReject = (req: PaymentRequest) => {
    if (!window.confirm(`Are you sure you want to reject payment request ${req.id} for ${req.customerName}?`)) {
      return;
    }
    setActionInProgress(req.id);
    const allReqs = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
    const updatedReqs = allReqs.map((r: any) => 
      r.id === req.id ? { ...r, status: 'REJECTED', rejectedAt: new Date().toISOString() } : r
    );
    localStorage.setItem('paymentRequests', JSON.stringify(updatedReqs));
    window.dispatchEvent(new Event('storage'));
    loadData();
    setActionInProgress(null);
  };

  // Manual Receipt handlers
  const setField = (k: keyof typeof EMPTY_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

  const filteredCustomers = customersDB.filter(c => {
    const q = customerQuery.toLowerCase();
    return c.id?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.mobile?.includes(q);
  });

  const selectedCustomerChits = customersDB.find(c => c.id === form.customerId)?.chits || [];

  const handleSelectCustomer = (c: any) => {
    setForm(f => ({ ...f, customerId: c.id, customerName: c.name || '', mobileNumber: c.mobile || '', chitGroup: '' }));
    setShowCustomerPicker(false);
    setCustomerQuery('');
  };

  const handleSaveManual = () => {
    if (!form.customerName || !form.amount || !form.paymentMode || !form.chitGroup) {
      alert('Please fill Customer, Chit Group, Amount, and Payment Mode.');
      return;
    }
    const entry = {
      id: form.receiptNo,
      date: new Date().toISOString(),
      type: form.txType === 'COLLECTION' ? 'CREDIT' : 'DEBIT',
      category: form.txType === 'COLLECTION' ? 'INSTALLMENT' : 'DISBURSAL',
      amount: Number(form.amount),
      reference: `${form.customerId || form.customerName} / ${form.chitGroup}`,
      description: `${form.txType === 'COLLECTION' ? 'Collection' : 'Disbursal'} - Month ${form.monthNumber || '—'} - ${form.customerName}`,
      customerName: form.customerName,
      customerId: form.customerId,
      groupId: form.chitGroup
    };
    const existing = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    localStorage.setItem('ledgerTransactions', JSON.stringify([entry, ...existing]));
    setSaved(true);
    window.dispatchEvent(new Event('storage'));
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Receipt ${form.receiptNo}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;color:#111;padding:20px}.r{max-width:380px;margin:0 auto;border:1px solid #ccc;padding:20px}.h{text-align:center;border-bottom:2px dashed #999;padding-bottom:12px;margin-bottom:12px}.h h1{font-size:20px;font-weight:900;letter-spacing:2px}.h p{font-size:10px;color:#555;margin-top:2px}.row{display:flex;justify-content:space-between;margin-bottom:6px}.label{color:#555}.value{font-weight:bold;text-align:right}.div{border-top:1px dashed #ccc;margin:10px 0}.total{font-size:16px;font-weight:900;display:flex;justify-content:space-between}.foot{text-align:center;margin-top:14px;font-size:10px;color:#777}.badge{display:inline-block;padding:2px 8px;border:1px solid #111;font-size:10px;font-weight:900;letter-spacing:1px;margin-top:6px}</style></head>
      <body><div class="r"><div class="h"><h1>JENISTA CHITS</h1><p>Financial Services Pvt. Ltd.</p><div class="badge">${form.txType} RECEIPT</div></div>
      <div class="row"><span class="label">Receipt No.</span><span class="value">${form.receiptNo}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(form.receiptDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
      <div class="div"></div>
      <div class="row"><span class="label">Customer</span><span class="value">${form.customerName||'—'}</span></div>
      <div class="row"><span class="label">ID</span><span class="value">${form.customerId||'—'}</span></div>
      <div class="row"><span class="label">Mobile</span><span class="value">${form.mobileNumber||'—'}</span></div>
      <div class="row"><span class="label">Chit Group</span><span class="value">${form.chitGroup||'—'}</span></div>
      <div class="row"><span class="label">Month</span><span class="value">${form.monthNumber||'—'}</span></div>
      <div class="div"></div>
      <div class="row"><span class="label">Mode</span><span class="value">${form.paymentMode||'—'}</span></div>
      <div class="row"><span class="label">Ref. No.</span><span class="value">${form.referenceNo||'—'}</span></div>
      <div class="div"></div>
      <div class="total"><span>NET AMOUNT</span><span>₹${Number(form.amount||0).toLocaleString('en-IN')}</span></div>
      <div class="div"></div>
      <div class="foot"><p>Executive: ${form.executive}</p><p style="margin-top:8px">Thank you for your trust in Jenista Chits.</p><p>Computer-generated receipt.</p></div>
      </div></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6" onClick={() => showCustomerPicker && setShowCustomerPicker(false)}>
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary-600" />
            Customer Payments & Verifications
          </h1>
          <p className="text-sm text-neutral-500">
            Review customer payment submissions, verify transaction references, and record receipts in the ledger.
          </p>
        </div>

        {/* Tab Switching */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm">
          <button
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'VERIFICATION'
                ? 'bg-primary-900 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Payment Requests
            {pendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === 'VERIFICATION' ? 'bg-amber-400 text-neutral-950' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('DIRECT_ENTRY')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'DIRECT_ENTRY'
                ? 'bg-primary-900 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Manual Receipt Entry
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION BANNER */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-xl shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-bold">{actionSuccessMsg}</p>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* ===================== TAB 1: VERIFICATION REQUESTS ===================== */}
      {activeTab === 'VERIFICATION' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    filterStatus === st
                      ? 'bg-primary-900 text-white border-primary-900'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {st === 'ALL' ? 'All Requests' : st === 'PENDING' ? `Pending (${pendingCount})` : st}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, UTR, group, phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-primary-600"
              />
            </div>
          </div>

          {/* Requests Table / Cards */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-neutral-800">No payment requests found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {filterStatus === 'PENDING' 
                  ? 'There are currently no customer payment submissions waiting for admin verification.' 
                  : 'No payment submissions matching your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-black text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Request ID & Date</th>
                      <th className="py-3.5 px-4">Customer Details</th>
                      <th className="py-3.5 px-4">Chit Group & Ticket</th>
                      <th className="py-3.5 px-4">Mode & UTR / Ref No.</th>
                      <th className="py-3.5 px-4 text-right">Amount Paid</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredRequests.map((req) => {
                      const isPending = req.status === 'PENDING_VERIFICATION';
                      const isApproved = req.status === 'APPROVED';
                      const isRejected = req.status === 'REJECTED';

                      return (
                        <tr key={req.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap">
                            <p className="font-mono font-bold text-xs text-primary-900">{req.id}</p>
                            <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(req.submittedAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-900 font-bold text-xs flex items-center justify-center shrink-0">
                                {req.customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-neutral-900 leading-snug">{req.customerName}</p>
                                <p className="text-[11px] text-neutral-400 font-mono">{req.customerId} · {req.mobile}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="inline-block px-2.5 py-1 bg-neutral-100 text-neutral-800 rounded font-bold text-xs">
                              {req.groupName || req.groupId}
                            </span>
                            {req.ticketNumber && (
                              <p className="text-[11px] text-neutral-500 mt-1">
                                Ticket: <span className="font-bold text-neutral-700">#{req.ticketNumber}</span>
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold">
                              {req.paymentMode}
                            </span>
                            <p className="text-xs font-mono font-bold text-neutral-800 mt-1">
                              {req.referenceNo}
                            </p>
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <p className="text-base font-black text-primary-900">
                              ₹{Number(req.amount).toLocaleString('en-IN')}
                            </p>
                          </td>

                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5"></span>
                                Needs Verification
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 mr-1" />
                                Verified & Paid
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleReject(req)}
                                  disabled={actionInProgress === req.id}
                                  className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApprove(req)}
                                  disabled={actionInProgress === req.id}
                                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Verify & Approve
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">No actions</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: MANUAL RECEIPT ENTRY ===================== */}
      {activeTab === 'DIRECT_ENTRY' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* CUSTOMER PICKER MODAL */}
          {showCustomerPicker && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/25 backdrop-blur-sm"
              onClick={e => { e.stopPropagation(); setShowCustomerPicker(false); }}>
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input autoFocus value={customerQuery} onChange={e => setCustomerQuery(e.target.value)}
                    placeholder="Search by ID, Name or Phone..."
                    className="flex-1 text-sm font-medium outline-none bg-transparent" />
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {filteredCustomers.length === 0
                    ? <p className="py-10 text-center text-sm text-slate-400">No customers found.</p>
                    : filteredCustomers.map(c => (
                      <div key={c.id} onClick={() => handleSelectCustomer(c)}
                        className="flex justify-between items-center px-5 py-3.5 hover:bg-slate-50 cursor-pointer group">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.id} · {c.mobile}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 transition-colors" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1 — Transaction Info */}
          <SectionHeader title="Transaction Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100 border-b border-slate-100">
            <Field label="Transaction Type">
              <select value={form.txType} onChange={e => setField('txType', e.target.value)} className="fselect">
                <option value="COLLECTION">Collection (Incoming)</option>
                <option value="DISBURSAL">Disbursal (Outgoing)</option>
              </select>
            </Field>
            <Field label="Chit Group">
              <select value={form.chitGroup} onChange={e => setField('chitGroup', e.target.value)} className="fselect">
                <option value="">— Select —</option>
                {selectedCustomerChits.length > 0
                  ? selectedCustomerChits.map((ch: any, i: number) => <option key={i} value={ch.groupId}>{ch.groupId}</option>)
                  : chitGroups.map((g: any, i: number) => <option key={i} value={g.code || g.id}>{g.code || g.id} – {g.name}</option>)
                }
              </select>
            </Field>
            <Field label="Receipt No.">
              <input value={form.receiptNo} readOnly className="finput font-mono text-slate-400 bg-slate-50 text-xs" />
            </Field>
            <Field label="Reference / UTR No.">
              <input value={form.referenceNo} onChange={e => setField('referenceNo', e.target.value)}
                placeholder="Cheque / UTR / UPI Ref" className="finput" />
            </Field>
          </div>

          {/* SECTION 2 — Customer Info */}
          <SectionHeader title="Customer Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100 border-b border-slate-100">
            <Field label="Customer Name" colSpan>
              <div className="flex">
                <button type="button" onClick={e => { e.stopPropagation(); setShowCustomerPicker(true); }}
                  className="pl-4 pr-3 flex items-center bg-slate-50 border-r border-slate-100 hover:bg-blue-50 hover:text-blue-700 transition-colors shrink-0">
                  <Search className="w-4 h-4" />
                </button>
                <input value={form.customerName} readOnly
                  onClick={e => { e.stopPropagation(); setShowCustomerPicker(true); }}
                  placeholder="Click to search customer..." className="finput cursor-pointer flex-1" />
              </div>
            </Field>
            <Field label="Mobile Number">
              <input value={form.mobileNumber} readOnly className="finput bg-slate-50 text-slate-400" placeholder="Auto-filled" />
            </Field>
            <Field label="Executive / Operator">
              <input value={form.executive} onChange={e => setField('executive', e.target.value)} className="finput" />
            </Field>
          </div>

          {/* SECTION 3 — Payment Details */}
          <SectionHeader title="Payment Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100 border-b border-slate-100">
            <Field label="Payment Mode">
              <select value={form.paymentMode} onChange={e => setField('paymentMode', e.target.value)} className="fselect">
                <option value="">— Select —</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT / IMPS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DD">Demand Draft</option>
              </select>
            </Field>
            <Field label="Receipt Date">
              <input type="date" value={form.receiptDate} onChange={e => setField('receiptDate', e.target.value)} className="finput" />
            </Field>
            <Field label="Month No.">
              <input type="number" value={form.monthNumber} onChange={e => setField('monthNumber', e.target.value)}
                placeholder="e.g. 1" className="finput" />
            </Field>
            <Field label="Receipt Amount (₹)">
              <div className="flex items-center">
                <span className="pl-4 font-black text-slate-400 shrink-0">₹</span>
                <input type="number" value={form.amount} onChange={e => setField('amount', e.target.value)}
                  placeholder="0.00" className="finput font-black text-xl text-primary-900 flex-1" />
              </div>
            </Field>
            <Field label="Remarks" fullWidth>
              <input value={form.remarks} onChange={e => setField('remarks', e.target.value)}
                placeholder="Optional notes or description..." className="finput" />
            </Field>
          </div>

          {/* NET AMOUNT DISPLAY */}
          <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Net Transaction Amount</p>
              <p className="text-3xl font-black text-primary-900 mt-1">
                ₹{Number(form.amount || 0) > 0 ? Number(form.amount).toLocaleString('en-IN') : '0.00'}
              </p>
            </div>
            {form.txType === 'COLLECTION' ? (
              <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-200">Incoming Collection</span>
            ) : (
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black uppercase tracking-widest border border-red-200">Outgoing Disbursal</span>
            )}
          </div>

          {/* SUCCESS BANNER */}
          {saved && (
            <div className="px-6 py-4 bg-emerald-50 border-t border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Transaction recorded successfully.</p>
                <p className="text-xs text-emerald-600">{form.receiptNo} is now visible in the General Ledger.</p>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setForm({ ...EMPTY_FORM, receiptNo: `REC-${Date.now().toString().slice(-6)}`, executive: 'Admin User' });
                  setSaved(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveManual} disabled={saved}
                className="flex items-center gap-2 px-7 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors disabled:opacity-60 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                {saved ? 'Saved ✓' : 'Confirm & Save Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-6 py-2.5 bg-slate-50 border-b border-t border-slate-100 flex items-center gap-2">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
  </div>
);

const Field = ({ label, children, colSpan, fullWidth }: { label: string; children: React.ReactNode; colSpan?: boolean; fullWidth?: boolean }) => (
  <div className={`flex flex-col ${fullWidth ? 'col-span-4' : colSpan ? 'col-span-2' : 'col-span-1'}`}>
    <span className="px-4 pt-2.5 pb-0.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    {children}
    <div className="pb-1" />
  </div>
);

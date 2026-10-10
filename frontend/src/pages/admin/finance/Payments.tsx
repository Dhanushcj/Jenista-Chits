import { useState, useEffect } from 'react';
import { Search, Printer, RotateCcw, CheckCircle2, Receipt, ChevronRight } from 'lucide-react';

type ActionType = 'ADD' | 'MODIFY' | 'APPROVE' | null;

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
  const [activeAction, setActiveAction] = useState<ActionType>('ADD');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saved, setSaved] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [customersDB, setCustomersDB] = useState<any[]>([]);
  const [chitGroups, setChitGroups] = useState<any[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  useEffect(() => {
    const c = localStorage.getItem('mockCustomers');
    if (c) setCustomersDB(JSON.parse(c));
    const g = localStorage.getItem('mockChitGroups');
    if (g) setChitGroups(JSON.parse(g));
    setForm(f => ({ ...f, receiptNo: `REC-${Date.now().toString().slice(-6)}` }));
  }, []);

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

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

  const handleReset = () => {
    setForm({ ...EMPTY_FORM, receiptNo: `REC-${Date.now().toString().slice(-6)}`, executive: 'Admin User' });
    setSaved(false);
    setHasSearched(false);
    setSearchId('');
  };

  const handleActionSelect = (action: ActionType) => {
    setActiveAction(action);
    handleReset();
  };

  const handleFetch = () => {
    if (!searchId.trim()) { alert('Please enter a Receipt ID.'); return; }
    const txns = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    const found = txns.find((t: any) => t.id === searchId.trim());
    if (found) {
      setForm(f => ({ ...f, receiptNo: found.id, amount: String(found.amount), txType: found.type === 'CREDIT' ? 'COLLECTION' : 'DISBURSAL' }));
      setHasSearched(true);
    } else {
      alert(`No record found with ID: ${searchId}`);
    }
  };

  const handleSave = () => {
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
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Receipt ${form.receiptNo}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;color:#111;padding:20px}.r{max-width:380px;margin:0 auto;border:1px solid #ccc;padding:20px}.h{text-align:center;border-bottom:2px dashed #999;padding-bottom:12px;margin-bottom:12px}.h h1{font-size:20px;font-weight:900;letter-spacing:2px}.h p{font-size:10px;color:#555;margin-top:2px}.row{display:flex;justify-content:space-between;margin-bottom:6px}.label{color:#555}.value{font-weight:bold;text-align:right}.div{border-top:1px dashed #ccc;margin:10px 0}.total{font-size:16px;font-weight:900;display:flex;justify-content:space-between}.foot{text-align:center;margin-top:14px;font-size:10px;color:#777}.badge{display:inline-block;padding:2px 8px;border:1px solid #111;font-size:10px;font-weight:900;letter-spacing:1px;margin-top:6px}</style></head>
      <body><div class="r"><div class="h"><h1>TRUSTCHIT</h1><p>Financial Services Pvt. Ltd.</p><div class="badge">${form.txType} RECEIPT</div></div>
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
      <div class="foot"><p>Executive: ${form.executive}</p><p style="margin-top:8px">Thank you for your trust in TrustChit.</p><p>Computer-generated receipt.</p></div>
      </div></body></html>`);
    win.document.close();
    win.print();
  };

  const amtNum = Number(form.amount || 0);

  return (
    <div className="space-y-5" onClick={() => showCustomerPicker && setShowCustomerPicker(false)}>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 tracking-tight">Financial Transactions</h1>
          <p className="text-sm text-neutral-500">Record chit fund collections, disbursals and approvals.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['ADD', 'MODIFY', 'APPROVE'] as ActionType[]).map(action => (
            <button
              key={action}
              onClick={() => handleActionSelect(action)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all border ${
                activeAction === action
                  ? 'bg-primary-900 text-white border-primary-900 shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800'
              }`}
            >
              {action === 'ADD' ? '+ Add' : action === 'MODIFY' ? '✎ Modify' : '✓ Approve'}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOMER PICKER */}
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

      {/* FETCH FORM FOR MODIFY / APPROVE */}
      {(activeAction === 'MODIFY' || activeAction === 'APPROVE') && !hasSearched && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 pt-8 pb-10 flex flex-col items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeAction === 'APPROVE' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
              <Receipt className={`w-7 h-7 ${activeAction === 'APPROVE' ? 'text-emerald-600' : 'text-blue-600'}`} />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-800">{activeAction === 'APPROVE' ? 'Approve a Transaction' : 'Modify a Transaction'}</h2>
              <p className="text-sm text-slate-400 mt-1">Enter the Receipt ID to fetch the transaction record.</p>
            </div>
            <div className="flex w-full max-w-md border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-primary-900 transition-colors">
              <input value={searchId} onChange={e => setSearchId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFetch()}
                placeholder="e.g. REC-102938"
                className="flex-1 px-5 py-3 text-base font-bold font-mono text-slate-800 outline-none" />
              <button onClick={handleFetch}
                className="px-8 py-3 bg-primary-900 text-white font-bold text-sm uppercase tracking-wider hover:bg-primary-800 transition-colors">
                Fetch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN FORM */}
      {(activeAction === 'ADD' || hasSearched) && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


          {/* SECTION 1 — Transaction Info */}
          <SectionHeader title="Transaction Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100 border-b border-slate-100">
            <Field label="Transaction Type">
              <select value={form.txType} onChange={e => set('txType', e.target.value)} className="fselect">
                <option value="COLLECTION">Collection (Incoming)</option>
                <option value="DISBURSAL">Disbursal (Outgoing)</option>
              </select>
            </Field>
            <Field label="Chit Group">
              <select value={form.chitGroup} onChange={e => set('chitGroup', e.target.value)} className="fselect">
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
              <input value={form.referenceNo} onChange={e => set('referenceNo', e.target.value)}
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
              <input value={form.executive} onChange={e => set('executive', e.target.value)} className="finput" />
            </Field>
          </div>

          {/* SECTION 3 — Payment Details */}
          <SectionHeader title="Payment Details" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100 border-b border-slate-100">
            <Field label="Payment Mode">
              <select value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)} className="fselect">
                <option value="">— Select —</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT / IMPS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DD">Demand Draft</option>
              </select>
            </Field>
            <Field label="Receipt Date">
              <input type="date" value={form.receiptDate} onChange={e => set('receiptDate', e.target.value)} className="finput" />
            </Field>
            <Field label="Month No.">
              <input type="number" value={form.monthNumber} onChange={e => set('monthNumber', e.target.value)}
                placeholder="e.g. 12" className="finput" />
            </Field>
            <Field label="Receipt Amount (₹)">
              <div className="flex items-center">
                <span className="pl-4 font-black text-slate-400 shrink-0">₹</span>
                <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                  placeholder="0.00" className="finput font-black text-xl text-primary-900 flex-1" />
              </div>
            </Field>
            <Field label="Remarks" fullWidth>
              <input value={form.remarks} onChange={e => set('remarks', e.target.value)}
                placeholder="Optional notes or description..." className="finput" />
            </Field>
          </div>

          {/* NET AMOUNT DISPLAY */}
          <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Net Transaction Amount</p>
              <p className="text-3xl font-black text-primary-900 mt-1">
                ₹{amtNum > 0 ? amtNum.toLocaleString('en-IN') : '0.00'}
              </p>
            </div>
            {form.txType === 'COLLECTION' ? (
              <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-200">Incoming Collection</span>
            ) : (
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black uppercase tracking-widest border border-red-200">Outgoing Disbursal</span>
            )}
          </div>

          {/* APPROVE BLOCK */}
          {activeAction === 'APPROVE' && (
            <div className="px-8 py-6 bg-emerald-900 text-white">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span className="text-sm font-black uppercase tracking-widest">Manager Authorization</span>
              </div>
              <p className="text-xs text-emerald-200 mb-4 leading-relaxed">
                By authorizing, you confirm funds are received/settled. This action is permanent and recorded in the immutable ledger.
              </p>
              <input placeholder="Authorization remarks (optional)..."
                className="w-full bg-emerald-950/60 border border-emerald-700 rounded-xl py-3 px-4 text-sm text-white placeholder:text-emerald-600 focus:outline-none focus:border-emerald-400 transition-colors" />
            </div>
          )}

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
              <button onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setActiveAction(null); handleReset(); }}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saved}
                className="flex items-center gap-2 px-7 py-2.5 bg-primary-900 text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors disabled:opacity-60 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                {activeAction === 'APPROVE' ? 'Authorize & Confirm' : saved ? 'Saved ✓' : 'Confirm & Save'}
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

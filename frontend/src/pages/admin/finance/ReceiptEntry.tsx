import { useState, useEffect, useRef } from 'react';
import { Search, Printer, CheckCircle2, RotateCcw } from 'lucide-react';
import { fetchClient } from '../../../api/client';

interface ReceiptData {
  receiptNo: string;
  receiptDate: string;
  receiptMode: string;
  type: string;
  customerId: string;
  customerName: string;
  mobileNumber: string;
  chitGroup: string;
  monthNumber: string;
  receiptAmt: string;
  referenceNo: string;
  executive: string;
  remarks: string;
}

const EMPTY: ReceiptData = {
  receiptNo: '',
  receiptDate: new Date().toISOString().split('T')[0],
  receiptMode: '',
  type: 'COLLECTION',
  customerId: '',
  customerName: '',
  mobileNumber: '',
  chitGroup: '',
  monthNumber: '',
  receiptAmt: '',
  referenceNo: '',
  executive: 'Admin User',
  remarks: '',
};

export const ReceiptEntry = () => {
  const [form, setForm] = useState<ReceiptData>({ ...EMPTY });
  const [saved, setSaved] = useState(false);
  const [customersDB, setCustomersDB] = useState<any[]>([]);
  const [chitGroups, setChitGroups] = useState<any[]>([]);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = localStorage.getItem('mockCustomers');
    if (c) setCustomersDB(JSON.parse(c));
    const g = localStorage.getItem('mockChitGroups');
    if (g) setChitGroups(JSON.parse(g));
    // Auto-generate receipt number
    const nextNo = `REC-${Date.now().toString().slice(-6)}`;
    setForm(f => ({ ...f, receiptNo: nextNo }));

    fetchClient('/customers')
      .then((res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          const mapped = res.data.map((item: any) => ({
            id: item.customerCode || item._id,
            mongoId: item._id,
            name: item.fullName || item.name,
            mobile: item.phone || item.mobile,
            chits: item.chits || [],
          }));
          setCustomersDB(mapped);
          localStorage.setItem('mockCustomers', JSON.stringify(mapped));
        }
      })
      .catch((err: any) => console.warn('Could not sync receipt entry customers:', err));
  }, []);

  const set = (key: keyof ReceiptData, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const filteredCustomers = customersDB.filter(c => {
    const q = customerQuery.toLowerCase();
    return c.id?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.mobile?.includes(q);
  });

  const selectedCustomerChits = customersDB
    .find(c => c.id === form.customerId)
    ?.chits || [];

  const handleSelectCustomer = (c: any) => {
    setForm(f => ({ ...f, customerId: c.id, customerName: c.name || '', mobileNumber: c.mobile || '', chitGroup: '' }));
    setShowCustomerPicker(false);
    setCustomerQuery('');
  };

  const handleSave = () => {
    if (!form.customerName || !form.receiptAmt || !form.receiptMode) {
      alert('Please fill Customer, Amount, and Payment Mode.');
      return;
    }
    // Save to ledger
    const existing = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
    const entry = {
      id: form.receiptNo,
      date: new Date().toISOString(),
      type: form.type === 'COLLECTION' ? 'CREDIT' : 'DEBIT',
      category: form.type === 'COLLECTION' ? 'INSTALLMENT' : 'DISBURSAL',
      amount: Number(form.receiptAmt),
      reference: `${form.customerId} / ${form.chitGroup}`,
      description: `${form.type === 'COLLECTION' ? 'Collection' : 'Disbursal'} - Month ${form.monthNumber || '—'}`,
    };
    localStorage.setItem('ledgerTransactions', JSON.stringify([entry, ...existing]));
    setSaved(true);
  };

  const handleReset = () => {
    const nextNo = `REC-${Date.now().toString().slice(-6)}`;
    setForm({ ...EMPTY, receiptNo: nextNo, executive: 'Admin User' });
    setSaved(false);
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Receipt ${form.receiptNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; color: #111; padding: 20px; }
            .receipt { max-width: 380px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
            .header { text-align: center; border-bottom: 2px dashed #999; padding-bottom: 12px; margin-bottom: 12px; }
            .header h1 { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
            .header p { font-size: 10px; color: #555; margin-top: 2px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .label { color: #555; }
            .value { font-weight: bold; text-align: right; }
            .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
            .total { font-size: 16px; font-weight: 900; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 14px; font-size: 10px; color: #777; }
            .badge { display: inline-block; padding: 2px 8px; border: 1px solid #111; font-size: 10px; font-weight: 900; letter-spacing: 1px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>TRUSTCHIT</h1>
              <p>Financial Services Pvt. Ltd.</p>
              <p>GST: 29ABCDE1234F1Z5</p>
              <div class="badge">${form.type === 'COLLECTION' ? 'COLLECTION RECEIPT' : 'DISBURSAL RECEIPT'}</div>
            </div>
            <div class="row"><span class="label">Receipt No.</span><span class="value">${form.receiptNo}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${new Date(form.receiptDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span></div>
            <div class="divider"></div>
            <div class="row"><span class="label">Customer</span><span class="value">${form.customerName || '—'}</span></div>
            <div class="row"><span class="label">Customer ID</span><span class="value">${form.customerId || '—'}</span></div>
            <div class="row"><span class="label">Mobile</span><span class="value">${form.mobileNumber || '—'}</span></div>
            <div class="row"><span class="label">Chit Group</span><span class="value">${form.chitGroup || '—'}</span></div>
            <div class="row"><span class="label">Month</span><span class="value">${form.monthNumber || '—'}</span></div>
            <div class="divider"></div>
            <div class="row"><span class="label">Payment Mode</span><span class="value">${form.receiptMode || '—'}</span></div>
            <div class="row"><span class="label">Reference No.</span><span class="value">${form.referenceNo || '—'}</span></div>
            ${form.remarks ? `<div class="row"><span class="label">Remarks</span><span class="value">${form.remarks}</span></div>` : ''}
            <div class="divider"></div>
            <div class="total"><span>NET AMOUNT</span><span>₹${Number(form.receiptAmt || 0).toLocaleString('en-IN')}</span></div>
            <div class="divider"></div>
            <div class="footer">
              <p>Executive: ${form.executive}</p>
              <p style="margin-top:8px">Thank you for your trust in TrustChit.</p>
              <p>This is a computer-generated receipt.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const amtNum = Number(form.receiptAmt || 0);

  return (
    <div className="space-y-6" onClick={() => showCustomerPicker && setShowCustomerPicker(false)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 tracking-tight">Receipt Entry</h1>
          <p className="text-sm text-neutral-500">Generate and record chit fund collection / disbursal receipts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> New / Reset
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center gap-2 px-5 py-2 bg-primary-900 text-white rounded-lg text-sm font-bold hover:bg-primary-800 transition-colors disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saved ? 'Saved' : 'Save & Record'}
          </button>
        </div>
      </div>

      {/* CUSTOMER PICKER MODAL */}
      {showCustomerPicker && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/20 backdrop-blur-sm"
          onClick={e => { e.stopPropagation(); setShowCustomerPicker(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={customerQuery}
                onChange={e => setCustomerQuery(e.target.value)}
                placeholder="Search by ID, Name or Phone..."
                className="flex-1 text-sm font-medium outline-none bg-transparent"
              />
            </div>
            <div className="max-h-72 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">No customers found.</p>
              ) : filteredCustomers.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="flex justify-between items-center px-5 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{c.id} · {c.mobile}</p>
                  </div>
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Select</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT – FORM */}
        <div className="flex-1 space-y-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* SECTION 1 */}
          <div className="bg-slate-800 text-white px-6 py-3 text-xs font-black uppercase tracking-widest">
            Transaction Information
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-slate-100 border-b border-slate-100">
            {/* Row 1 */}
            <Field label="Receipt Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className="field-select">
                <option value="COLLECTION">Collection</option>
                <option value="DISBURSAL">Disbursal</option>
              </select>
            </Field>
            <Field label="Chit Group">
              <select value={form.chitGroup} onChange={e => set('chitGroup', e.target.value)} className="field-select">
                <option value="">-- Select --</option>
                {selectedCustomerChits.length > 0
                  ? selectedCustomerChits.map((ch: any, i: number) => <option key={i} value={ch.groupId}>{ch.groupId}</option>)
                  : chitGroups.map((g: any, i: number) => <option key={i} value={g.code || g.id}>{g.code || g.id} – {g.name}</option>)
                }
              </select>
            </Field>
            <Field label="Receipt No.">
              <input value={form.receiptNo} readOnly className="field-input font-mono bg-slate-50" />
            </Field>
            <Field label="Reference No.">
              <input value={form.referenceNo} onChange={e => set('referenceNo', e.target.value)} placeholder="UTR / Cheque No." className="field-input" />
            </Field>

            {/* Row 2 */}
            <Field label="Customer Name" colSpan>
              <div className="relative flex">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setShowCustomerPicker(true); }}
                  className="pl-3 pr-2 flex items-center bg-slate-50 border-r border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4 text-slate-500" />
                </button>
                <input
                  value={form.customerName}
                  readOnly
                  onClick={e => { e.stopPropagation(); setShowCustomerPicker(true); }}
                  placeholder="Click lens to search..."
                  className="field-input cursor-pointer"
                />
              </div>
            </Field>
            <Field label="Mobile Number">
              <input value={form.mobileNumber} readOnly className="field-input bg-slate-50" placeholder="Auto-filled" />
            </Field>
            <Field label="Executive">
              <input value={form.executive} onChange={e => set('executive', e.target.value)} className="field-input" />
            </Field>

            {/* Row 3 */}
            <Field label="Payment Mode">
              <select value={form.receiptMode} onChange={e => set('receiptMode', e.target.value)} className="field-select">
                <option value="">-- Select --</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT / IMPS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DD">Demand Draft</option>
              </select>
            </Field>
            <Field label="Receipt Date">
              <input type="date" value={form.receiptDate} onChange={e => set('receiptDate', e.target.value)} className="field-input" />
            </Field>
            <Field label="Month No.">
              <input type="number" value={form.monthNumber} onChange={e => set('monthNumber', e.target.value)} placeholder="e.g. 12" className="field-input" />
            </Field>
            <Field label="Receipt Amount (₹)">
              <input type="number" value={form.receiptAmt} onChange={e => set('receiptAmt', e.target.value)} placeholder="0.00" className="field-input font-bold text-lg" />
            </Field>

            {/* Row 4 - Remarks full width */}
            <Field label="Remarks" fullWidth>
              <input value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional notes..." className="field-input" />
            </Field>
          </div>

          {saved && (
            <div className="px-6 py-4 bg-green-50 border-t border-green-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-bold text-green-800">Transaction recorded successfully in the General Ledger.</p>
            </div>
          )}
        </div>

        {/* RIGHT – RECEIPT PREVIEW */}
        <div className="w-full xl:w-80 shrink-0">
          <div ref={printRef} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-mono text-xs">
            {/* Perforated top */}
            <div className="h-3 bg-[repeating-linear-gradient(90deg,_transparent_0px,_transparent_8px,_#e2e8f0_8px,_#e2e8f0_10px)]" />

            <div className="px-6 pt-5 pb-4 border-b-2 border-dashed border-slate-200">
              <div className="text-center mb-4">
                <p className="text-lg font-black tracking-widest uppercase text-slate-900">TrustChit</p>
                <p className="text-[10px] text-slate-400 tracking-wider mt-0.5">Financial Services Pvt. Ltd.</p>
                <span className="inline-block mt-2 px-3 py-0.5 border border-slate-800 text-[9px] font-black tracking-widest uppercase text-slate-800">
                  {form.type === 'COLLECTION' ? 'Collection Receipt' : 'Disbursal Receipt'}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <ReceiptRow label="Receipt No." value={form.receiptNo} mono />
                <ReceiptRow label="Date" value={form.receiptDate ? new Date(form.receiptDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'} />
              </div>
            </div>

            <div className="px-6 py-4 border-b border-dashed border-slate-200 space-y-1.5 text-[11px]">
              <ReceiptRow label="Customer" value={form.customerName || '—'} bold />
              <ReceiptRow label="ID" value={form.customerId || '—'} mono />
              <ReceiptRow label="Mobile" value={form.mobileNumber || '—'} mono />
              <ReceiptRow label="Chit Group" value={form.chitGroup || '—'} />
              <ReceiptRow label="Month" value={form.monthNumber || '—'} />
            </div>

            <div className="px-6 py-4 border-b border-dashed border-slate-200 space-y-1.5 text-[11px]">
              <ReceiptRow label="Mode" value={form.receiptMode || '—'} />
              <ReceiptRow label="Ref. No." value={form.referenceNo || '—'} mono />
              {form.remarks && <ReceiptRow label="Remarks" value={form.remarks} />}
            </div>

            <div className="px-6 py-4 border-b-2 border-dashed border-slate-200">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Amount</span>
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  ₹{amtNum > 0 ? amtNum.toLocaleString('en-IN') : '0.00'}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 text-center space-y-1">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Executive: {form.executive}</p>
              <p className="text-[9px] text-slate-400">Thank you for your trust in TrustChit.</p>
              <p className="text-[9px] text-slate-400">Computer-generated receipt.</p>
            </div>

            {/* Perforated bottom */}
            <div className="h-3 bg-[repeating-linear-gradient(90deg,_transparent_0px,_transparent_8px,_#e2e8f0_8px,_#e2e8f0_10px)]" />
          </div>
        </div>
      </div>

      <style>{`
        .field-input { width: 100%; padding: 10px 12px; font-size: 13px; background: white; outline: none; transition: background 0.15s; }
        .field-input:focus { background: #f8fafc; }
        .field-select { width: 100%; padding: 10px 12px; font-size: 13px; background: white; outline: none; appearance: none; cursor: pointer; }
        .field-select:focus { background: #f8fafc; }
      `}</style>
    </div>
  );
};

const Field = ({ label, children, colSpan, fullWidth }: { label: string; children: React.ReactNode; colSpan?: boolean; fullWidth?: boolean }) => (
  <div className={`flex flex-col ${fullWidth ? 'col-span-4' : colSpan ? 'col-span-2' : 'col-span-1'}`}>
    <span className="px-3 pt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    {children}
  </div>
);

const ReceiptRow = ({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) => (
  <div className="flex justify-between items-start gap-2">
    <span className="text-slate-400 shrink-0">{label}</span>
    <span className={`text-right text-slate-800 break-all ${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : ''}`}>{value}</span>
  </div>
);

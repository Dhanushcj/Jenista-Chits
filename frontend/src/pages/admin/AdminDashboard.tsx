import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, TrendingUp, ArrowLeft, Plus, X, CheckCircle2, Users, IndianRupee, PieChart as PieChartIcon } from 'lucide-react';
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

    // Fetch live customers from MongoDB
    fetchClient('/customers')
      .then((res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          const mapped = res.data.map((item: any) => ({
            id: item.customerCode || item._id,
            mongoId: item._id,
            name: item.fullName || item.name,
            mobile: item.phone || item.mobile,
            phone: item.phone || item.mobile,
            address: item.address,
            branch: item.branchId?.branchName || 'Head Office',
            status: item.status || 'ACTIVE',
            totalPaid: item.totalPaid || 0,
            pending: item.pending || 0,
            chits: item.chits || [],
          }));
          setCustomers(mapped);
          localStorage.setItem('mockCustomers', JSON.stringify(mapped));
        }
      })
      .catch((err: any) => console.warn('Could not sync admin dashboard customers:', err));
  }, []);

  const handleCategoryClick = (type: string, value: number) => {
    setSelectedCategory({ type, value });
    setSelectedGroup(null);
  };

  const handleGroupClick = (group: any) => {
    setSelectedGroup(group);
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

  const handleSearchCustomer = (mobile: string) => {
    setSearchMobile(mobile);
    if (mobile.length >= 10) {
      const match = customers.find(c => 
        (c.mobile && c.mobile.includes(mobile)) || 
        (c.phone && c.phone.includes(mobile)) || 
        (c.id && c.id.includes(mobile))
      );
      setFoundCustomer(match || null);
    } else {
      setFoundCustomer(null);
    }
  };

  const handleEnrollCustomer = () => {
    const val = Number(customChitValue);
    if (!foundCustomer || !dueDate || !selectedGroup || isNaN(val) || val <= 0) return;
    
    const installment = val * 0.05;
    const newChit = {
      groupId: selectedGroup.id,
      groupName: selectedGroup.name || selectedGroup.id,
      ticketNumber: ((selectedGroup.filled || 0) + 1).toString().padStart(3, '0'),
      status: 'Active',
      joinedAt: new Date().toISOString(),
      dueDate: dueDate,
      chitValue: val,
      monthlyInstallment: installment,
      paymentStatus: 'DUE',
      totalPaid: 0,
      paidAmount: 0,
      pending: installment,
      customerName: foundCustomer.name || foundCustomer.fullName,
      customerId: foundCustomer.id
    };

    const updatedCustomer = { 
      ...foundCustomer, 
      pending: (Number(foundCustomer.pending) || 0) + installment,
      totalPending: (Number(foundCustomer.totalPending) || 0) + installment,
      chits: [...(foundCustomer.chits || []), newChit] 
    };
    const updatedCustomers = customers.map(c => c.id === foundCustomer.id ? updatedCustomer : c);
    
    setCustomers(updatedCustomers);
    localStorage.setItem('mockCustomers', JSON.stringify(updatedCustomers));

    const updatedGroup = { ...selectedGroup, filled: (selectedGroup.filled || 0) + 1 };
    setSelectedGroup(updatedGroup);
    
    const updatedGroups = chitGroups.map(g => g.id === selectedGroup.id ? updatedGroup : g);
    setChitGroups(updatedGroups);
    localStorage.setItem('mockChitGroups', JSON.stringify(updatedGroups));

    setIsAddCustomerModalOpen(false);
    setSearchMobile('');
    setFoundCustomer(null);
    setDueDate('');
  };

  // If a group is selected, show its customers
  if (selectedGroup) {
    const groupCustomers = customers.filter(c => 
      c.chits?.some((ch: any) => (ch.groupId === selectedGroup.id || ch.groupId === selectedGroup.code))
    );

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
              <h1 className="text-xl sm:text-2xl font-bold text-primary-900 tracking-tight">{selectedGroup.name || selectedGroup.id}</h1>
              <p className="text-xs sm:text-sm text-neutral-500">
                {selectedCategory?.type} • {formatCurrency(selectedCategory?.value || 0)} • {groupCustomers.length} Customers Enrolled
              </p>
            </div>
          </div>
          <button 
            className="btn-primary flex items-center justify-center text-sm w-full sm:w-auto"
            onClick={() => {
              setCustomChitValue(selectedGroup?.value?.toString() || '');
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100 whitespace-nowrap">
                {groupCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">No customers enrolled in this group yet.</td>
                  </tr>
                ) : (
                  groupCustomers.map((c) => {
                    const chit = c.chits?.find((ch: any) => (ch.groupId === selectedGroup.id || ch.groupId === selectedGroup.code));
                    
                    // Verify if payment confirmation exists in ledger or chit record
                    const ledger = JSON.parse(localStorage.getItem('ledgerTransactions') || '[]');
                    const groupId = selectedGroup.id || selectedGroup.code;
                    const hasConfirmedPayment = 
                      chit?.paymentStatus === 'PAID' || 
                      (Number(chit?.totalPaid) > 0) || 
                      (Number(chit?.paidAmount) > 0) ||
                      ledger.some((t: any) => 
                        (t.type === 'CREDIT' || t.category === 'INSTALLMENT') && 
                        ((t.reference?.includes(c.id) || t.reference?.includes(c.name) || t.description?.includes(c.name) || t.description?.includes(c.id) || t.customerName === c.name || t.customerId === c.id) &&
                        (t.reference?.includes(groupId) || t.description?.includes(groupId) || t.groupId === groupId))
                      );

                    return (
                      <tr 
                        key={c.id} 
                        className="hover:bg-neutral-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/customers/${c.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary-900">{c.name}</div>
                          <div className="text-xs text-neutral-500 font-mono mt-0.5">{c.id}</div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 font-medium">{c.mobile || c.phone}</td>
                        <td className="px-6 py-4 text-neutral-600 font-bold">{formatCurrency(chit?.chitValue || 0)}</td>
                        <td className="px-6 py-4 text-neutral-600 font-bold">{formatCurrency(chit?.monthlyInstallment || 0)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 font-bold text-xs uppercase rounded-full ${hasConfirmedPayment ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                            {hasConfirmedPayment ? 'Paid' : 'Dues Pending'}
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

        {isAddCustomerModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary-900">Enroll Customer</h2>
                <button onClick={() => setIsAddCustomerModalOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Search Customer (Mobile or ID)</label>
                  <input 
                    type="text"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter mobile number"
                    value={searchMobile}
                    onChange={(e) => handleSearchCustomer(e.target.value)}
                  />
                  {foundCustomer ? (
                    <div className="mt-3 p-3 bg-success-light border border-success/30 rounded-lg flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-white p-1.5 rounded-full shadow-sm shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{foundCustomer.name}</p>
                        <p className="text-xs text-neutral-600 font-mono mt-0.5">{foundCustomer.id}</p>
                        <p className="text-xs text-neutral-500 mt-1">Mobile: {foundCustomer.phone || foundCustomer.mobile}</p>
                      </div>
                    </div>
                  ) : searchMobile.length >= 10 ? (
                    <p className="mt-2 text-sm text-danger font-medium animate-in fade-in">No customer found.</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Chit Value (₹)</label>
                  <input 
                    type="number"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={customChitValue}
                    onChange={(e) => setCustomChitValue(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Monthly Installment (5%)</label>
                  <input 
                    type="text"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-500 font-bold"
                    value={formatCurrency(Number(customChitValue) * 0.05)}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Due Date</label>
                  <input 
                    type="date"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                    onClick={() => setIsAddCustomerModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleEnrollCustomer}
                    disabled={!foundCustomer || !dueDate}
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
    </div>
  );
};

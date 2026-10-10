import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const initialFixedCategories = [
  { id: 1, value: 100000 },
  { id: 2, value: 200000 },
  { id: 3, value: 500000 },
  { id: 4, value: 1000000 },
];

const initialAuctionCategories = [
  { id: 1, value: 500000 },
  { id: 2, value: 1000000 },
];

const ManageCategoryList = ({ title, categories, onSave }: { title: string, categories: any[], onSave: (cats: any[]) => void }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleDelete = (id: number) => {
    onSave(categories.filter(c => c.id !== id));
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditValue(cat.value.toString());
  };

  const handleSaveEdit = () => {
    const val = Number(editValue);
    if (!isNaN(val) && val > 0) {
      onSave(categories.map(c => c.id === editingId ? { ...c, value: val } : c));
    }
    setEditingId(null);
  };

  const handleAdd = () => {
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    onSave([...categories, { id: newId, value: 0 }]);
    setEditingId(newId);
    setEditValue('');
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
        <button onClick={handleAdd} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 transition-colors px-3 py-1.5 rounded-md">
          <Plus className="w-4 h-4 mr-1" /> Add Category
        </button>
      </div>

      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-md bg-white">
            {editingId === cat.id ? (
              <div className="flex items-center space-x-2 flex-grow mr-4">
                <input 
                  type="number" 
                  className="flex-grow border border-neutral-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  value={editValue} 
                  onChange={e => setEditValue(e.target.value)} 
                  placeholder="Enter chit value"
                  autoFocus
                />
                <button onClick={handleSaveEdit} className="p-2 text-success hover:bg-success-light rounded transition-colors"><Save className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-2 text-neutral-500 hover:bg-neutral-100 rounded transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <span className="font-bold text-lg text-primary-900">{cat.value === 0 ? 'New Category' : formatCurrency(cat.value)}</span>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(cat)} className="p-2 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 rounded transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-neutral-500 hover:bg-neutral-100 hover:text-danger rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="text-neutral-500 text-sm text-center py-4">No categories defined.</p>}
      </div>
    </div>
  );
};

export const ManagePlans = () => {
  const [plans, setPlans] = useState<{ id: string, title: string, categories: {id: number, value: number}[] }[]>([]);

  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');

  useEffect(() => {
    const savedPlans = localStorage.getItem('mockPlans');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    } else {
      // Migrate from old state if exists
      const savedFixed = localStorage.getItem('mockFixedCategories');
      const savedAuction = localStorage.getItem('mockAuctionCategories');
      const initialPlans = [
        { id: 'fixed', title: 'Manage Fixed Categories', categories: savedFixed ? JSON.parse(savedFixed) : initialFixedCategories },
        { id: 'auction', title: 'Manage Auction Categories', categories: savedAuction ? JSON.parse(savedAuction) : initialAuctionCategories },
      ];
      setPlans(initialPlans);
      localStorage.setItem('mockPlans', JSON.stringify(initialPlans));
    }
  }, []);

  const savePlanCategories = (planId: string, cats: {id: number, value: number}[]) => {
    const updatedPlans = plans.map(p => p.id === planId ? { ...p, categories: cats } : p);
    setPlans(updatedPlans);
    localStorage.setItem('mockPlans', JSON.stringify(updatedPlans));
  };

  const handleAddNewPlan = () => {
    if (newPlanTitle.trim()) {
      const newId = newPlanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      const updatedPlans = [...plans, { id: newId, title: newPlanTitle, categories: [] }];
      setPlans(updatedPlans);
      localStorage.setItem('mockPlans', JSON.stringify(updatedPlans));
      setIsAddPlanModalOpen(false);
      setNewPlanTitle('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-900 tracking-tight">Manage Plans</h1>
        <button className="btn-primary flex items-center text-sm" onClick={() => setIsAddPlanModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map(plan => (
          <ManageCategoryList 
            key={plan.id}
            title={plan.title} 
            categories={plan.categories} 
            onSave={(cats) => savePlanCategories(plan.id, cats)} 
          />
        ))}
      </div>

      {isAddPlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">Add New Plan Type</h2>
              <button onClick={() => setIsAddPlanModalOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Plan Name</label>
                <input 
                  type="text"
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Special Festival Plan"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                  onClick={() => setIsAddPlanModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleAddNewPlan}
                  disabled={!newPlanTitle.trim()}
                >
                  Create Plan Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

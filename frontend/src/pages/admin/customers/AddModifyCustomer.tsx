import { useState, useRef, useEffect } from 'react';
import { ActionLayout } from '../../../components/layout/ActionLayout';
import type { ActionType } from '../../../components/layout/ActionLayout';
import { Search, User, Camera, Phone, FileText, Upload } from 'lucide-react';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

interface UploadMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onUpload: (file: File) => void;
  accept: string;
}

const UploadMethodDialog = ({ isOpen, onClose, title, onUpload, accept }: UploadMethodDialogProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleClose = () => {
    stopStream();
    setIsCapturing(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setIsCapturing(false);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert("Unable to access camera. Please check permissions.");
      setIsCapturing(false);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          onUpload(file);
          handleClose();
        }
      }, 'image/jpeg');
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <h3 className="text-lg font-bold text-neutral-800 mb-4">{title}</h3>
        
        {isCapturing ? (
          <div className="flex flex-col gap-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { stopStream(); setIsCapturing(false); }} className="flex-1">Back</Button>
              <Button variant="primary" onClick={takeSnapshot} className="flex-1">Snap Photo</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer group">
              <input type="file" className="hidden" accept={accept} onChange={(e) => { 
                if (e.target.files?.[0]) {
                  onUpload(e.target.files[0]);
                  handleClose();
                }
              }} />
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-semibold text-neutral-800 group-hover:text-primary-700">Upload File</span>
                <span className="block text-xs text-neutral-500">From computer</span>
              </div>
            </label>
            
            <button onClick={startCamera} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-white group-hover:text-primary-600 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-semibold text-neutral-800 group-hover:text-primary-700">Capture</span>
                <span className="block text-xs text-neutral-500">Use webcam</span>
              </div>
            </button>
          </div>
        )}

        {!isCapturing && (
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={handleClose} className="w-full">Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AddModifyCustomer = () => {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchId, setSearchId] = useState('');
  
  const [mockCustomers, setMockCustomers] = useState<any[]>(() => {
    const saved = localStorage.getItem('mockCustomers');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'TC-10045', name: 'Rahul Sharma', mobile: '+91 9876543210', dob: '1990-05-15', gender: 'Male', email: 'rahul.sharma@example.com', address: 'New Delhi, DL', aadhar: '1234 5678 9012', pan: 'ABCDE1234F' }
    ];
  });
  const [activeCustomer, setActiveCustomer] = useState<any>(null);

  const handleActionSelect = (action: ActionType) => {
    setActiveAction(action);
    setHasSearched(false);
    setSearchId('');
    setActiveCustomer(null);
  };

  const handleClear = () => {
    setHasSearched(false);
    setSearchId('');
    setActiveCustomer(null);
  };

  const CustomerForm = ({ disabled = false, customer = null }: { disabled?: boolean, customer?: any }) => {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploadDialog, setUploadDialog] = useState<{type: 'photo' | 'aadhar' | 'pan', title: string, accept: string} | null>(null);

    const handlePhotoChange = (file: File) => {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    };

    const handleDocumentChange = (file: File) => {
      console.log('Document selected:', file.name);
    };

    const handleUploadComplete = (file: File) => {
       if (uploadDialog?.type === 'photo') {
         handlePhotoChange(file);
       } else {
         handleDocumentChange(file);
       }
    };

  return (
    <>
    <UploadMethodDialog 
      isOpen={!!uploadDialog}
      onClose={() => setUploadDialog(null)}
      title={uploadDialog?.title || "Choose Upload Method"}
      accept={uploadDialog?.accept || "image/*, .pdf"}
      onUpload={handleUploadComplete}
    />
    <form id="customer-form" className={`bg-white p-8 rounded-lg shadow-sm border border-neutral-200 ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="space-y-10">
        
        {/* Personal Details */}
        <section>
          <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3 mb-6">
            <User className="w-5 h-5 text-primary-900" />
            <h4 className="text-lg font-bold text-neutral-800">Personal Details</h4>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-3 shrink-0">
              <div 
                onClick={() => !disabled && setUploadDialog({type: 'photo', title: 'Upload Photo', accept: 'image/jpeg, image/png'})}
                className={`w-32 h-32 rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center text-neutral-400 transition-colors relative overflow-hidden ${disabled ? 'cursor-not-allowed' : 'hover:bg-neutral-100 hover:border-primary-500 cursor-pointer'}`}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Customer Photo" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 mb-2 text-neutral-300" />
                    <span className="text-xs font-semibold">Upload Photo</span>
                  </>
                )}
              </div>
              <p className="text-xs text-neutral-500">JPG or PNG (Max 2MB)</p>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Full Name *</label>
                <Input name="name" defaultValue={customer?.name || ""} placeholder="Enter full name" disabled={disabled} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Date of Birth</label>
                <Input name="dob" type="date" defaultValue={customer?.dob || ""} disabled={disabled} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Gender</label>
                <select 
                  name="gender"
                  disabled={disabled} 
                  defaultValue={customer?.gender || ""}
                  className="w-full h-[42px] px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-900 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Details */}
        <section>
          <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3 mb-6">
            <Phone className="w-5 h-5 text-primary-900" />
            <h4 className="text-lg font-bold text-neutral-800">Contact Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Mobile Number *</label>
              <Input name="mobile" defaultValue={customer?.mobile || ""} placeholder="Enter 10-digit mobile number" disabled={disabled} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Email Address</label>
              <Input name="email" type="email" defaultValue={customer?.email || ""} placeholder="Enter email address" disabled={disabled} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-1">Residential Address *</label>
              <Input name="address" defaultValue={customer?.address || ""} placeholder="Enter full residential address" disabled={disabled} />
            </div>
          </div>
        </section>

        {/* Identity & Documents */}
        <section>
          <div className="flex items-center space-x-2 border-b border-neutral-100 pb-3 mb-6">
            <FileText className="w-5 h-5 text-primary-900" />
            <h4 className="text-lg font-bold text-neutral-800">Identity & Documents</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Aadhar Number *</label>
                <Input name="aadhar" defaultValue={customer?.aadhar || ""} placeholder="Enter 12-digit Aadhar" disabled={disabled} />
              </div>
              <div 
                onClick={() => !disabled && setUploadDialog({type: 'aadhar', title: 'Upload Aadhar Document', accept: '.pdf, image/jpeg, image/png'})}
                className={`border-2 border-dashed border-neutral-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-neutral-50 transition-colors ${disabled ? 'cursor-not-allowed' : 'hover:bg-neutral-100 hover:border-primary-500 cursor-pointer'}`}
              >
                <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-sm font-medium text-neutral-700">Upload Aadhar Document</span>
                <span className="text-xs text-neutral-500 mt-1">PDF, JPG or PNG up to 5MB</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">PAN Number *</label>
                <Input name="pan" defaultValue={customer?.pan || ""} placeholder="Enter PAN number" disabled={disabled} />
              </div>
              <div 
                onClick={() => !disabled && setUploadDialog({type: 'pan', title: 'Upload PAN Document', accept: '.pdf, image/jpeg, image/png'})}
                className={`border-2 border-dashed border-neutral-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-neutral-50 transition-colors ${disabled ? 'cursor-not-allowed' : 'hover:bg-neutral-100 hover:border-primary-500 cursor-pointer'}`}
              >
                <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-sm font-medium text-neutral-700">Upload PAN Document</span>
                <span className="text-xs text-neutral-500 mt-1">PDF, JPG or PNG up to 5MB</span>
              </div>
            </div>
          </div>
        </section>

        {/* Active Chits Section */}
        {customer?.chits && customer.chits.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-6">
              <h4 className="text-lg font-bold text-slate-800">Active Chit Groups</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {customer.chits.map((chit: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-primary-700">{chit.groupId} - {chit.scheme}</p>
                    <p className="text-xs text-slate-500 mt-1">Ticket: {chit.ticketNumber} | Joined: {chit.joiningDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">{chit.amount}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">{chit.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
      </div>
    </form>
    </>
  );
};

  const executeSearch = () => {
    const found = mockCustomers.find(c => 
      c.id.toLowerCase() === searchId.toLowerCase() || 
      c.mobile === searchId || 
      c.name.toLowerCase().includes(searchId.toLowerCase())
    );
    if (found) {
      setActiveCustomer(found);
      setHasSearched(true);
    } else {
      alert("Customer not found!");
      setHasSearched(false);
      setActiveCustomer(null);
    }
  };

  const renderContent = (action: ActionType) => {
    if (action === 'MODIFY') {
      return (
        <div className="w-full pb-10">
          <div className="w-full space-y-6">
            <div className="card p-0 overflow-hidden bg-white border border-neutral-200 shadow-sm">
              <div className="p-8 bg-white flex justify-center">
                <div className="w-full max-w-2xl">
                  <h3 className="text-lg font-bold text-neutral-800 mb-6 text-center border-b pb-4">Search Customer to Modify</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex border border-neutral-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary-900 transition-all">
                      <div className="bg-neutral-100 px-4 py-2.5 flex items-center border-r border-neutral-300 w-48 text-sm font-semibold text-neutral-700 shrink-0">
                        Customer ID / Mobile
                      </div>
                      <div className="flex-1 relative flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-neutral-400" />
                        </div>
                        <input 
                          className="w-full pl-9 pr-3 py-2.5 text-sm outline-none bg-white" 
                          value={searchId}
                          onChange={(e) => setSearchId(e.target.value)}
                          placeholder="Search..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-center pt-4">
                      <Button variant="primary" className="w-48" onClick={executeSearch}>
                        Search Customer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hasSearched && activeCustomer && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-end mt-8 mb-2 px-2">
                  <span className="px-3 py-1 bg-primary-50 text-primary-900 rounded-md text-sm font-semibold border border-primary-100 shadow-sm">
                    Modifying: {activeCustomer.name} ({activeCustomer.id})
                  </span>
                </div>
                <CustomerForm customer={activeCustomer} />
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // For ADD or when no action is selected (default)
    const isAdd = action === 'ADD';
    return (
      <div className="w-full pb-10">
        <div className="w-full space-y-6">
          <CustomerForm disabled={!isAdd} />
        </div>
      </div>
    );
  };

  const handleConfirm = () => {
    if (activeAction === 'ADD') {
      const form = document.getElementById('customer-form') as HTMLFormElement;
      if (form) {
        const formData = new FormData(form);
        const newCustomer = {
          id: `TC-${Math.floor(10000 + Math.random() * 90000)}`,
          name: formData.get('name') as string,
          mobile: formData.get('mobile') as string,
          dob: formData.get('dob') as string,
          gender: formData.get('gender') as string,
          email: formData.get('email') as string,
          address: formData.get('address') as string,
          aadhar: formData.get('aadhar') as string,
          pan: formData.get('pan') as string,
        };
        setMockCustomers(prev => {
          const updated = [...prev, newCustomer];
          localStorage.setItem('mockCustomers', JSON.stringify(updated));
          return updated;
        });
        alert(`Success: New customer ${newCustomer.name} (${newCustomer.id}) has been successfully created!`);
      } else {
        alert('Success: New customer has been successfully created!');
      }
    } else if (activeAction === 'MODIFY') {
      alert('Success: Customer details have been successfully updated!');
    }
    handleClear();
    setActiveAction(null);
  };

  const handleConfirmApprove = () => {
    alert('Success: Customer details updated and instantly approved by Admin!');
    handleClear();
    setActiveAction(null);
  };

  return (
    <ActionLayout 
      title="Add / Modify Customer"
      allowedActions={['ADD', 'MODIFY']}
      onActionSelect={handleActionSelect}
      renderContent={renderContent}
      onClear={handleClear}
      onCancel={() => {
        handleClear();
        setActiveAction(null);
      }}
      onConfirm={activeAction ? handleConfirm : undefined}
      onConfirmApprove={activeAction === 'MODIFY' ? handleConfirmApprove : undefined}
    />
  );
};

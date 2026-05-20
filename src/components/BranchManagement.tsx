import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  Settings, 
  DollarSign, 
  Percent, 
  Tag, 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Check, 
  X, 
  AlertTriangle, 
  Upload, 
  MapPin, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { fC } from '../App';

export interface Branch {
  id: string;
  shopId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  managerId: string;
  managerName: string;
  openingDate: string;
  logo: string;
  status: 'active' | 'inactive';
  timing?: string;
  departments?: string[];
  currency?: string;
  taxSettings?: number;
  invoicePrefix?: string;
}

interface Employee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email?: string;
  salary: number;
  joiningDate?: string;
  schedule?: string;
  status: 'active' | 'inactive';
}

interface BranchManagementProps {
  branches: Branch[];
  employees: Employee[];
  onAdd: (data: Omit<Branch, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Branch>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  settings: any;
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
}

export default function BranchManagement({ 
  branches, 
  employees, 
  onAdd, 
  onUpdate, 
  onDelete, 
  settings, 
  selectedBranchId, 
  onSelectBranch 
}: BranchManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states for Branch Settings
  const [configuringBranch, setConfiguringBranch] = useState<Branch | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  // Branch Timing form states
  const [branchTiming, setBranchTiming] = useState('09:00 AM - 08:00 PM');
  const [departmentsInput, setDepartmentsInput] = useState('');
  const [branchDepartments, setBranchDepartments] = useState<string[]>([]);
  const [branchCurrency, setBranchCurrency] = useState('৳');
  const [branchTax, setBranchTax] = useState(0);
  const [branchPrefix, setBranchPrefix] = useState('');

  // Main branch form states
  const [logoBase64, setLogoBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter employees whose position/designation starts with or equals or contains "manager"
  const availableManagers = employees.filter(emp => 
    emp.status === 'active' && 
    (emp.designation.toLowerCase() === 'manager' || 
     emp.designation.toLowerCase().includes('manager') || 
     emp.designation.toLowerCase().startsWith('manager'))
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setLogoBase64(reader.result as string);
      };
    }
  };

  const clearForm = () => {
    setLogoBase64('');
    setEditingBranch(null);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const managerId = formData.get('managerId') as string;
    const selectedEmp = employees.find(emp => emp.id === managerId);
    const managerName = selectedEmp ? selectedEmp.name : 'Unknown';

    const branchData: Omit<Branch, 'id'> = {
      shopId: settings?.shopId || '',
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      managerId,
      managerName,
      openingDate: formData.get('openingDate') as string,
      logo: logoBase64,
      status: formData.get('status') as 'active' | 'inactive',
      timing: editingBranch?.timing || '09:00 AM - 08:10 PM',
      departments: editingBranch?.departments || ['Grocery', 'Cosmetics', 'Clothing'],
      currency: editingBranch?.currency || '৳',
      taxSettings: editingBranch?.taxSettings || 5,
      invoicePrefix: editingBranch?.invoicePrefix || (formData.get('code') as string ? `${formData.get('code') as string}-` : 'BR-')
    };

    try {
      setSubmitting(true);
      if (editingBranch) {
        await onUpdate(editingBranch.id, branchData);
      } else {
        await onAdd(branchData);
      }
      setActiveSubTab('list');
      clearForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConfig = (branch: Branch) => {
    setConfiguringBranch(branch);
    setBranchTiming(branch.timing || '09:00 AM - 08:00 PM');
    setBranchDepartments(branch.departments || ['Grocery', 'Cosmetics', 'Clothing']);
    setBranchCurrency(branch.currency || '৳');
    setBranchTax(branch.taxSettings || 0);
    setBranchPrefix(branch.invoicePrefix || `${branch.code}-`);
  };

  const handleSaveConfig = async () => {
    if (!configuringBranch) return;
    try {
      setSubmitting(true);
      await onUpdate(configuringBranch.id, {
        timing: branchTiming,
        departments: branchDepartments,
        currency: branchCurrency,
        taxSettings: Number(branchTax),
        invoicePrefix: branchPrefix
      });
      setConfiguringBranch(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addDepartment = () => {
    const cleanDept = departmentsInput.trim();
    if (cleanDept && !branchDepartments.includes(cleanDept)) {
      setBranchDepartments([...branchDepartments, cleanDept]);
      setDepartmentsInput('');
    }
  };

  const removeDepartment = (dept: string) => {
    setBranchDepartments(branchDepartments.filter(d => d !== dept));
  };

  const filteredBranches = branches.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.managerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
      id="multi-branch-mgmt-container"
    >
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm border border-indigo-100 flex items-center justify-center ring-1 ring-indigo-500/5">
            <Building2 className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              {settings.systemLanguage === 'bn' ? 'মাল্টি-ব্রাঞ্চ ম্যানেজমেন্ট' : 'Multi-Branch Hub'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {settings.systemLanguage === 'bn' 
                  ? 'শাখা বিন্যাস, ম্যানেজার ম্যাপিং এবং কাস্টম ট্যাক্স / ইনভয়েস সেটিংস' 
                  : 'Branch Onboarding, Resource Sync and Settings Hub'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setActiveSubTab('list');
              clearForm();
            }}
            className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
              activeSubTab === 'list' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {settings.systemLanguage === 'bn' ? 'শাখা তালিকা' : 'Branch List'} ({branches.length})
          </button>
          
          <button 
            onClick={() => {
              setActiveSubTab('create');
              clearForm();
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
              activeSubTab === 'create' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-900 text-white hover:bg-black'
            }`}
          >
            <Plus className="w-4 h-4" />
            {settings.systemLanguage === 'bn' ? 'নতুন শাখা যোগ করুন' : 'Add New Branch'}
          </button>
        </div>
      </motion.header>

      {activeSubTab === 'list' ? (
        <div className="space-y-8">
          {/* Quick Stats banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Branches</p>
                <h4 className="text-3xl font-black text-slate-900 mt-2 font-mono">{branches.length}</h4>
              </div>
              <Building className="w-10 h-10 text-indigo-500 opacity-80" />
            </div>
            
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Hubs</p>
                <h4 className="text-3xl font-black text-emerald-600 mt-2 font-mono">
                  {branches.filter(b => b.status === 'active').length}
                </h4>
              </div>
              <Check className="w-10 h-10 text-emerald-500 opacity-80" />
            </div>

            <div className="bg-slate-100/50 border border-slate-200/50 p-6 rounded-3xl">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Active Database Selection</p>
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="w-full bg-white px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">🌐 {settings.systemLanguage === 'bn' ? 'সকল শাখা (All Branches)' : 'All Branches / Main'}</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative group max-w-md">
            <div className="absolute inset-0 bg-indigo-100/30 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative bg-white border border-slate-200/80 rounded-2xl p-2.5 flex items-center gap-3">
              <Search className="text-slate-400 w-5 h-5 ml-2" />
              <input 
                type="text"
                placeholder={settings.systemLanguage === 'bn' ? 'শাখার নাম, কোড বা ম্যানেজার খুঁজুন...' : 'Search branches...'}
                className="w-full bg-slate-50/50 border-none rounded-xl text-sm font-bold p-2.5 outline-none focus:ring-1 focus:ring-indigo-500/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table list or Grid display */}
          {filteredBranches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] gap-4">
              <Building2 className="w-16 h-16 text-slate-300 stroke-1" />
              <div>
                <h4 className="text-lg font-black text-slate-800">No Branches Available</h4>
                <p className="text-xs text-slate-400 font-medium max-w-[280px] mt-1">
                  You can onboard branches to specify locations, mapping staff, setting custom currency and tax details.
                </p>
              </div>
              <button
                onClick={() => setActiveSubTab('create')}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                Create Branch Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {filteredBranches.map((br) => {
                const assignedManager = employees.find(e => e.id === br.managerId);
                return (
                  <motion.div 
                    key={br.id}
                    layoutId={br.id}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-[0_12px_45px_rgba(0,0,0,0.02)] flex flex-col justify-between group cursor-pointer hover:border-indigo-150 relative"
                  >
                    <div>
                      {/* Top banner and details */}
                      <div className="flex justify-between items-start gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 border border-indigo-50 flex items-center justify-center overflow-hidden shadow-inner">
                            {br.logo ? (
                              <img src={br.logo} alt="Branch logo" className="w-full h-full object-cover" referrerpolicy="no-referrer" />
                            ) : (
                              <Building className="w-8 h-8 text-indigo-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{br.name}</h3>
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">{br.code}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {br.address}
                            </p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          br.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                          {br.status}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-5 py-5 border-t border-b border-dashed border-slate-100 mb-6 font-mono text-xs text-slate-600">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Contact Details</p>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{br.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{br.email}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Resources Sync</p>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-sans font-bold text-slate-800">{br.managerName || 'No Manager'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{br.openingDate || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick preview settings config */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {br.timing || '09:00 AM - 08:00 PM'}
                        </span>
                        <span className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-slate-400" />
                          Currency: {br.currency || '৳'}
                        </span>
                        <span className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-slate-400" />
                          Tax: {br.taxSettings || 0}%
                        </span>
                        <span className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          Prefix: "{br.invoicePrefix || ''}"
                        </span>
                      </div>
                    </div>

                    {/* Operational buttons */}
                    <div className="flex justify-between items-center mt-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingBranch(br);
                            if (br.logo) setLogoBase64(br.logo);
                            setActiveSubTab('create');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl border border-indigo-100/50 transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit Info
                        </button>

                        <button
                          onClick={() => handleOpenConfig(br)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-150 rounded-xl border border-slate-200/50 transition-all"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-500" />
                          Settings Form
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedBranchId === br.id ? (
                          <span className="bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-indigo-100">
                            <Check className="w-3.5 h-3.5" />
                            Active View
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectBranch(br.id)}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-600 border border-transparent px-3 py-2 rounded-xl hover:bg-indigo-50/50 transition-all"
                          >
                            Switch to this branch
                          </button>
                        )}

                        <button
                          onClick={() => setConfirmDeleteId(br.id)}
                          className="p-2 border border-transparent hover:border-rose-100 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all ml-1"
                          title="Delete branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick confirm delete */}
                    <AnimatePresence>
                      {confirmDeleteId === br.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center z-10"
                        >
                          <p className="font-extrabold text-slate-900 text-base">Are you absolutely sure?</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                            Deleting branch "{br.name}" will remove it from configuration, but won't delete product stocks.
                          </p>
                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={async () => {
                                await onDelete(br.id);
                                if (selectedBranchId === br.id) onSelectBranch('all');
                                setConfirmDeleteId(null);
                              }}
                              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_12px_45px_rgba(0,0,0,0.02)] max-w-4xl"
        >
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                {editingBranch ? 'Edit Branch Form' : 'Add Branch Setup'}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Enter demographic information and assign manager from central Main Branch.
              </p>
            </div>
            {logoBase64 && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                <img src={logoBase64} alt="Pre-loaded logo" className="w-12 h-12 object-cover rounded-lg" referrerpolicy="no-referrer" />
                <button 
                  onClick={() => setLogoBase64('')}
                  className="text-xs text-rose-500 font-semibold hover:underline bg-white px-2 py-1 rounded border border-slate-100"
                >
                  Clear Logo
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveBranch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Branch Name*</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  defaultValue={editingBranch?.name || ''}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                  placeholder="e.g. Dhanmondi Branch"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Branch Code (Unique ID)*</label>
                <input 
                  type="text" 
                  name="code" 
                  required
                  defaultValue={editingBranch?.code || ''}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                  placeholder="e.g. DH-01"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Branch Address*</label>
                <input 
                  type="text" 
                  name="address" 
                  required
                  defaultValue={editingBranch?.address || ''}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                  placeholder="e.g. House 45, Road 12, Dhanmondi, Dhaka"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Branch Phone*</label>
                <input 
                  type="tel" 
                  name="phone" 
                  required
                  defaultValue={editingBranch?.phone || ''}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                  placeholder="e.g. 01712345678"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Branch Email*</label>
                <input 
                  type="email" 
                  name="email" 
                  required
                  defaultValue={editingBranch?.email || ''}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none" 
                  placeholder="e.g. dhanmondi@myshop.com"
                />
              </div>

              {/* Branch Manager dropdown (Central staffing rules) */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Branch Manager Select* (Must be added in Central Staff first)
                  </label>
                  <span className="text-[10px] bg-amber-50 text-amber-600 font-extrabold px-2 py-0.5 rounded-md border border-amber-100">
                    Staff Designation: Manager
                  </span>
                </div>
                
                {availableManagers.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800">
                        {settings.systemLanguage === 'bn' 
                          ? 'কোনো উপযুক্ত ম্যানেজার পাওয়া যায়নি!' 
                          : 'No active staff member is designated as Manager in Main Branch!'}
                      </p>
                      <p className="text-[11px] text-amber-700/80 mt-1">
                        Please go to the <b className="font-bold underline">Staff Management (Employees)</b> panel first and add an employee whose position starts with or equals <span className="font-mono bg-white px-1 border rounded">'Manager'</span> so they have appropriate privileges.
                      </p>
                    </div>
                  </div>
                ) : (
                  <select
                    name="managerId"
                    required
                    defaultValue={editingBranch?.managerId || ''}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  >
                    <option value="" disabled>-- Select central manager --</option>
                    {availableManagers.map(mgr => (
                      <option key={mgr.id} value={mgr.id}>
                        👤 {mgr.name} - Designation: {mgr.designation} ({mgr.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Opening Date</label>
                <input 
                  type="date" 
                  name="openingDate" 
                  required
                  defaultValue={editingBranch?.openingDate || ''}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none hover:cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Status*</label>
                <select
                  name="status"
                  required
                  defaultValue={editingBranch?.status || 'active'}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                >
                  <option value="active">Active (Conducting operations, Pos integration)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Logo Uploading (Required standard base64) */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Upload Branch Logo (Max 2MB)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer relative group">
                  <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  <span className="text-xs font-bold text-slate-600">Drag or click to choose PNG/JPG</span>
                  <span className="text-[10px] text-slate-400">Compressed securely and synced in Cloud Firestore.</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => {
                  setActiveSubTab('list');
                  clearForm();
                }}
                className="px-6 py-3.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancel / Return
              </button>
              
              <button 
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {submitting ? 'Please wait...' : editingBranch ? 'Update Branch Info' : 'Initialize & Deploy Branch'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Branch Settings Modal Form */}
      <AnimatePresence>
        {configuringBranch && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfiguringBranch(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal Dialog container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden"
            >
              {/* Header Gradient line */}
              <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600"></div>
              
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-100">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800">
                        {settings.systemLanguage === 'bn' ? `${configuringBranch.name} শাখা বিন্যাস` : `${configuringBranch.name} settings`}
                      </h3>
                      <p className="text-[10px] text-teal-600 font-extrabold uppercase tracking-widest">
                        Branch Settings Form • Customized rules
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setConfiguringBranch(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                  
                  {/* Branch timing */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      Branch Timings & Operational Hours
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      placeholder="e.g. 09:00 AM - 09:30 PM (Weekly Off: Friday)"
                      value={branchTiming}
                      onChange={(e) => setBranchTiming(e.target.value)}
                    />
                  </div>

                  {/* Currency settings */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-indigo-500" />
                      Branch Local Currency Symbol
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      value={branchCurrency}
                      onChange={(e) => setBranchCurrency(e.target.value)}
                    >
                      <option value="৳">৳ (BDT - Taka)</option>
                      <option value="$">$ (USD - Dollar)</option>
                      <option value="₹">₹ (INR - Rupee)</option>
                      <option value="€">€ (EUR - Euro)</option>
                      <option value="£">£ (GBP - Pound)</option>
                      <option value="AED">AED (Dirham)</option>
                    </select>
                  </div>

                  {/* Tax percentage */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Percent className="w-4 h-4 text-indigo-500" />
                      Tax Settings / Base VAT Percentage
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      placeholder="e.g. 5"
                      value={branchTax}
                      onChange={(e) => setBranchTax(Number(e.target.value))}
                    />
                  </div>

                  {/* Invoice Prefix */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-4 h-4 text-indigo-500" />
                      Invoice Serial Prefix
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      placeholder="e.g. DHM-"
                      value={branchPrefix}
                      onChange={(e) => setBranchPrefix(e.target.value)}
                    />
                  </div>

                  {/* Dynamic Department setup */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-indigo-500" />
                      Department Setup & Category Boundaries
                    </label>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        placeholder="e.g. Grocery Section, Electronics, Pharmacy"
                        value={departmentsInput}
                        onChange={(e) => setDepartmentsInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addDepartment();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addDepartment}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                      >
                        Add Dept
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {branchDepartments.map(dept => (
                        <span 
                          key={dept} 
                          className="bg-indigo-50 border border-indigo-150 rounded-xl px-3.5 py-1.5 text-xs text-indigo-700 font-bold flex items-center gap-1.5 animate-in scale-in"
                        >
                          {dept}
                          <button 
                            type="button" 
                            onClick={() => removeDepartment(dept)}
                            className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 hover:text-indigo-800 p-0.5 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                      {branchDepartments.length === 0 && (
                        <p className="text-[11px] text-slate-450 italic">No departments configured yet.</p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setConfiguringBranch(null)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    disabled={submitting}
                    onClick={handleSaveConfig}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                  >
                    {submitting ? 'Applying changes...' : 'Save Branch Config'}
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

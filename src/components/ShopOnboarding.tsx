import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, MapPin, Phone, Upload, Check, ChevronRight, ChevronLeft } from 'lucide-react';

interface ShopOnboardingProps {
  onComplete: (data: any) => void;
}

export function ShopOnboarding({ onComplete }: ShopOnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    address: '',
    phone: '',
    logo: '',
    domain: '',
    setupDate: new Date().toISOString()
  });

  const shopTypes = [
    { id: 'grocery', label: 'Grocery/Mudi' },
    { id: 'pharmacy', label: 'Pharmacy' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'electrical', label: 'Electrical/Hardware' },
    { id: 'other', label: 'Other' }
  ];

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.type !== '';
    if (step === 2) return formData.name.trim() !== '' && formData.phone.trim() !== '' && formData.address.trim() !== '';
    return true;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
      >
        <div className="mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Shop Setup</h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Step {step} of 3</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Select Shop Type</label>
              <div className="grid grid-cols-2 gap-3">
                {shopTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => updateFormData('type', t.id)}
                    className={`p-4 rounded-xl border font-bold text-sm transition-all ${formData.type === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Shop Name</label>
                <input value={formData.name} onChange={(e) => updateFormData('name', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Bismillah Store" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Shop Address</label>
                <input value={formData.address} onChange={(e) => updateFormData('address', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 123 Street, Dhaka" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Contact Mobile</label>
                <input value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="017xxxxxxxx" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Custom Domain (Optional)</label>
                <input value={formData.domain} onChange={(e) => updateFormData('domain', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="myshop.com" />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Upload Shop Logo</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-colors relative">
                {formData.logo ? (
                  <div className="relative inline-block">
                    <img src={formData.logo} alt="Preview" className="w-32 h-32 object-contain rounded-xl mx-auto" />
                    <button onClick={() => updateFormData('logo', '')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><Check className="w-3 h-3 rotate-45" /></button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-bold text-gray-600">Click to upload logo</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" title="Upload Logo" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-50">
          <button onClick={() => setStep(prev => Math.max(1, prev - 1))} disabled={step === 1} className="text-gray-400 font-bold uppercase tracking-widest text-xs p-2 disabled:opacity-0 transition-opacity"><ChevronLeft className="w-4 h-4 inline" /> Back</button>
          {step < 3 ? (
            <button 
              onClick={() => isStepValid() && setStep(prev => prev + 1)} 
              disabled={!isStepValid()}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${isStepValid() ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => onComplete(formData)} 
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
            >
              Finish Setup <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

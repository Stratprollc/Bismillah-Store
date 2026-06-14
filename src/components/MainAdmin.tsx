import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function MainAdmin({ platformBranding, setPlatformBranding, setNotification }: { platformBranding: any, setPlatformBranding: any, setNotification: any }) {
  const [logoPreview, setLogoPreview] = useState<string | null>(platformBranding?.logoBase64 || null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'branding'), { logoBase64: logoPreview }, { merge: true });
      setPlatformBranding({ ...platformBranding, logoBase64: logoPreview });
      setNotification({ message: "Platform logo updated successfully", type: 'success' });
    } catch (err) {
      setNotification({ message: "Error saving platform logo", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Main Admin Control</h2>
          <p className="text-gray-500 text-sm mt-1">Configure global platform branding</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Global Platform Logo</label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0 p-2">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <img src="/LOGO.JPG" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display='none'; if(e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.display='block'; }} />
              )}
              {(!logoPreview) && <ImageIcon className="w-8 h-8 text-gray-300 hidden" />}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2 * 1024 * 1024) {
                    setNotification({ message: 'File too large. Max size is 2MB.', type: 'error' });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setLogoPreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="text-sm cursor-pointer file:cursor-pointer file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:uppercase file:tracking-wider file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-all font-medium text-gray-600 outline-none" 
            />
          </div>

          <div className="pt-4 text-right">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-indigo-600 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Publish Global App Logo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

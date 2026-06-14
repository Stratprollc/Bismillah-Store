import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Calendar as CalendarIcon, 
  Clock, 
  Copy, 
  ExternalLink, 
  Plus, 
  Trash, 
  Check, 
  Loader2, 
  Share2, 
  FileSpreadsheet, 
  ShieldAlert,
  Search,
  RefreshCw,
  VideoOff
} from 'lucide-react';
import { 
  db, 
  auth, 
  googleProvider, 
  getCachedAccessToken, 
  setCachedAccessToken 
} from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface MeetSession {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  spaceName: string;
  createdAt: string;
  shopId: string;
  exportedToSheet?: boolean;
}

interface MeetSchedulerProps {
  shopId: string;
  user: any;
  setNotification: (notif: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

export const MeetScheduler: React.FC<MeetSchedulerProps> = ({ shopId, user, setNotification }) => {
  const [token, setToken] = useState<string | null>(getCachedAccessToken());
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [sessions, setSessions] = useState<MeetSession[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Form fields
  const [meetingTitle, setMeetingTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('30'); // in minutes

  // Export state
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Sync token from memory cache
  useEffect(() => {
    setToken(getCachedAccessToken());
  }, []);

  // Fetch saved sessions from Firestore
  const fetchSessions = async () => {
    if (!shopId) return;
    setIsFetching(true);
    try {
      const q = query(
        collection(db, 'meet_sessions'),
        where('shopId', '==', shopId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const fetched: MeetSession[] = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as MeetSession[];
      setSessions(fetched);
    } catch (err) {
      console.error('Error fetching meet sessions:', err);
      // Suppress or handle first-time collection errors if database is raw
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [shopId]);

  // Request/Refresh Access Token using Google Sign In with scopes
  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setToken(credential.accessToken);
        setNotification({ message: 'Google Auth connected successfully!', type: 'success' });
        fetchSessions();
      } else {
        throw new Error('Access Token could not be retrieved.');
      }
    } catch (err: any) {
      const isPopupClosed = 
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        (err?.message && (err.message.includes('popup-closed-by-user') || err.message.includes('cancelled-popup-request'))) ||
        String(err).includes('popup-closed-by-user') ||
        String(err).includes('cancelled-popup-request');

      if (isPopupClosed) {
        console.warn('Authorization cancelled: the popup was closed before completing OAuth sign-in.');
        setNotification({ message: 'Google Auth popup was closed. Please complete the login in the pop-up window.', type: 'info' });
      } else {
        console.error('Authorization failed:', err);
        setNotification({ message: `Google Authorization Failed: ${err.message ?? err}`, type: 'error' });
      }
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Create Google Meet Space
  const handleCreateMeetingSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setNotification({ message: 'Please authorize Google workspace first.', type: 'error' });
      return;
    }
    if (!meetingTitle.trim()) {
      setNotification({ message: 'Please enter a meeting title.', type: 'error' });
      return;
    }
    if (!startDate || !startTime) {
      setNotification({ message: 'Please select start date and time.', type: 'error' });
      return;
    }

    setIsCreating(true);
    try {
      // 1. Call Google Meet API to create beautiful Space
      const response = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            accessType: 'OPEN' // OPEN type or TRUSTED
          }
        })
      });

      if (!response.ok) {
        const errDetail = await response.json().catch(() => ({}));
        throw new Error(errDetail?.error?.message || 'Failed to call Google Meet API. Try re-authorizing Gmail / Workspace.');
      }

      const meetData = await response.json();
      
      const meetLink = meetData.meetingUri || `https://meet.google.com/${meetData.meetingCode}`;
      const spaceName = meetData.name || ''; // spaces/space_id

      // Calculate start and end ISO strings
      const startDateTimeStr = `${startDate}T${startTime}`;
      const startDateObj = new Date(startDateTimeStr);
      const endDateObj = new Date(startDateObj.getTime() + parseInt(duration) * 60000);

      const newSessionInput = {
        title: meetingTitle,
        startTime: startDateObj.toISOString(),
        endTime: endDateObj.toISOString(),
        meetLink,
        spaceName,
        createdAt: new Date().toISOString(),
        shopId: shopId,
        exportedToSheet: false
      };

      // 2. Save securely to Firestore permanent database
      const docRef = await addDoc(collection(db, 'meet_sessions'), newSessionInput);
      
      // Update local state
      setSessions(prev => [{ id: docRef.id, ...newSessionInput }, ...prev]);
      
      // Reset form
      setMeetingTitle('');
      setStartDate('');
      setStartTime('');
      
      setNotification({ message: 'Successfully scheduled Google Meet conference!', type: 'success' });
    } catch (err: any) {
      console.error('Error creating meeting space:', err);
      // Check if unauthorized, let user re-auth
      if (err.message?.includes('401') || err.message?.toLowerCase().includes('unauthorized') || err.message?.toLowerCase().includes('auth')) {
        setNotification({ message: 'Session expired. Please reconnect your Google Account and try again.', type: 'error' });
        setToken(null);
        setCachedAccessToken(null);
      } else {
        setNotification({ message: `Google Meet error: ${err.message}`, type: 'error' });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Delete Meeting Space from list (and Database) with confirmation
  const handleDeleteSession = async (currSession: MeetSession) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${currSession.title}" meeting? This cannot be undone.`);
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'meet_sessions', currSession.id));
      setSessions(prev => prev.filter(s => s.id !== currSession.id));
      setNotification({ message: 'Meeting session deleted successfully.', type: 'success' });
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setNotification({ message: `Failed to delete session: ${err.message}`, type: 'error' });
    }
  };

  // Copy meeting link to clipboard
  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setNotification({ message: 'Meeting link copied to clipboard!', type: 'success' });
  };

  // Export the meeting session to Google Sheets
  const handleExportToSheet = async (session: MeetSession) => {
    if (!token) {
      setNotification({ message: 'Please reconnect Google Auth first.', type: 'error' });
      return;
    }
    setExportingId(session.id);
    try {
      // 1. Create a new Spreadsheet or append to it. 
      // We can search for an existing "ShopMaster_Meet_Log" spreadsheet, or create a brand new one
      const title = `ShopMaster Meetings Log`;
      
      // Attempt to create a spreadsheet
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: title
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error('Could not initialize Google Spreadsheet.');
      }

      const sheetData = await createResponse.json();
      const spreadsheetId = sheetData.spreadsheetId;
      const sheetUrl = sheetData.spreadsheetUrl;

      // 2. Add header row and session data row to the spreadsheet
      const appendResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:E2:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [
            ['Meeting Title', 'Start Date & Time', 'End Location / Time', 'Google Meet Url', 'Log Status'],
            [session.title, new Date(session.startTime).toLocaleString(), new Date(session.endTime).toLocaleString(), session.meetLink, 'Verified Permanent Logs']
          ]
        })
      });

      if (!appendResponse.ok) {
        throw new Error('Failed to append data logs to Spreadsheet.');
      }

      setNotification({ message: `Logs successfully saved to your Google Sheets: ${title}`, type: 'success' });
      
      // Update UI state
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, exportedToSheet: true } : s));
    } catch (err: any) {
      console.error('Sheets integration error:', err);
      setNotification({ message: `Sheets Sync Failed: ${err.message}`, type: 'error' });
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div id="meet-scheduler-container" className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50 to-indigo-50 border border-indigo-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center gap-2">
            <span className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg">
              <Video className="w-6 h-6 animate-pulse" />
            </span>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">গুগল মিট সিডিউলার (Google Meet Scheduler)</h2>
          </div>
          <p className="text-gray-500 text-sm max-w-xl">
            মার্চেন্টদের জন্য গুগল মিট সরাসরি তৈরি ও শিডিউল করার চমৎকার ইন্টারফেস। সমস্ত ডাটা নিরাপদে ফায়ারবেস ক্লাউড ডাটাবেজে সংরক্ষিত থাকে এবং গুগল শিটে এক্সপোর্ট করা যায়।
          </p>
        </div>

        {/* Auth Status & Connection Action */}
        <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
          {token ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              গুগল কানেক্টেড (Google Authorized)
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-2xl text-xs font-semibold">
              <ShieldAlert className="w-4 h-4" />
              অথরাইজেশন আবশ্যক (Workspace Authorization Needed)
            </div>
          )}

          <button
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className={`w-full md:w-auto h-11 px-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
              token 
                ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
            }`}
          >
            {isAuthorizing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : token ? (
              <>
                <RefreshCw className="w-4 h-4" />
                কানেকশন রিফ্রেশ করুন (Refork Google Conn)
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                লগইন এবং কানেক্ট (Authorize Google)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Create Meeting Frame */}
        <div className="col-span-1 lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">নতুন গুগল মিট শিডিউল করুন (Create Meet)</h3>
            <p className="text-gray-400 text-xs mt-1">গুগল ক্যালেন্ডার এবং স্পেস সামঞ্জস্যের জন্য গুগল ডাটাবেজ ব্যবহার করবে</p>
          </div>

          <form onSubmit={handleCreateMeetingSpace} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">মিটিংয়ের নাম / বিষয়বস্তু (Title)</label>
              <input 
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="যেমন: সাপ্তাহিক মার্চেন্ট মিটিং, কাস্টমার কল..."
                className="w-full h-11 px-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 text-sm font-medium"
              />
            </div>

            {/* Date and Time selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">তারিখ (Date)</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-4 py-2 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 block">সময় (Time)</label>
                <input 
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-11 px-4 py-2 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 block">মিটিং এর সময়সীমা (Duration)</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-11 px-4 bg-gray-50 border-2 border-gray-50 rounded-2xl focus:border-indigo-600 focus:outline-none focus:bg-white transition-all text-sm font-semibold text-gray-700"
              >
                <option value="15">১৫ মিনিট (15 minutes)</option>
                <option value="30">৩০ মিনিট (30 minutes)</option>
                <option value="45">৪৫ মিনিট (45 minutes)</option>
                <option value="60">১ ঘণ্টা (60 minutes)</option>
                <option value="90">১ ঘণ্টা ৩০ মিনিট (90 minutes)</option>
                <option value="120">২ ঘণ্টা (120 minutes)</option>
              </select>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isCreating || !token}
              className={`w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                token 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:shadow-indigo-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  গুগল মিট লিংক তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  নতুন মিট লিংক তৈরি করুন
                </>
              )}
            </button>
            {!token && (
              <p className="text-xs text-amber-500 text-center font-medium">
                * অনুগ্রহ করে প্রথমে গুগল একাউন্টটি অথরাইজ করুন।
              </p>
            )}
          </form>
        </div>

        {/* Right Side: Saved Scheduled Meetings Grid */}
        <div className="col-span-1 lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">শিডিউলকৃত মিটিং রুমসমূহ (Scheduled Sessions)</h3>
              <p className="text-gray-400 text-xs mt-1">ফায়ারবেস ক্লাউড ডাটাবেজ থেকে সিকিউর রিয়েল-টাইম ডাটা</p>
            </div>
            {sessions.length > 0 && (
              <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs">
                {sessions.length} Meetings
              </span>
            )}
          </div>

          <div className="grow overflow-y-auto max-h-[500px] space-y-4 pr-1 scrollbar-thin">
            {isFetching ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-sm font-medium">মিটিং লোড হচ্ছে...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div className="h-48 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-3">
                <VideoOff className="w-10 h-10 text-gray-300" />
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-600">কোন শিডিউল পাওয়া যায়নি</p>
                  <p className="text-xs text-gray-400 mt-0.5">মিটিং লিংক জেনারেট করলে এখানে তালিকাভুক্ত হবে</p>
                </div>
              </div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="p-5 border-2 border-slate-50 hover:border-indigo-100 rounded-2xl bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {session.title}
                      </h4>
                      <p className="text-xs text-indigo-600 font-mono flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {session.meetLink}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(session.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col lg:flex-row items-center gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopyLink(session.meetLink, session.id)}
                      className="p-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-gray-600 hover:text-gray-900 transition-all flex items-center justify-center shrink-0 shadow-sm"
                      title="লিংক কপি করুন"
                    >
                      {copiedId === session.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Join button */}
                    <a
                      href={session.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-xl text-indigo-700 transition-all flex items-center justify-center shrink-0 shadow-sm"
                      title="মিটিংয়ে জয়েন করুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Export to Sheet */}
                    <button
                      onClick={() => handleExportToSheet(session)}
                      disabled={exportingId === session.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 shadow-sm ${
                        session.exportedToSheet
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                          : 'bg-white border-gray-200 hover:border-emerald-200 text-emerald-600 hover:text-emerald-800'
                      }`}
                      title={session.exportedToSheet ? "গুগল শিটে এক্সপোর্ট করা হয়েছে" : "গুগল শিটে এক্সপোর্ট করুন"}
                    >
                      {exportingId === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : session.exportedToSheet ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSession(session)}
                      className="p-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl text-rose-600 hover:text-rose-800 transition-all flex items-center justify-center shrink-0 shadow-sm"
                      title="মিটিং মুছে ফেলুন"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Helper Tips */}
          <div className="bg-indigo-50/50 border border-indigo-50/80 p-4 rounded-2xl flex items-start gap-3 mt-4">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
              <Share2 className="w-4 h-4" />
            </span>
            <div className="space-y-0.5 text-xs text-indigo-950 font-medium leading-relaxed">
              <p className="font-bold">কাস্টমারকে শেয়ার করুন মিট লিংক</p>
              <p className="text-indigo-800">
                মিটিং শিডিউল করার পর কপি বাটনে ক্লিক করে সরাসরি হোয়াটসএপ, এসএমএস কিংবা যেকোনো সামাজিক মেসেঞ্জারে মার্চেন্ট লিংকটি আপনার ক্লায়েন্টকে পাঠাতে পারেন।
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

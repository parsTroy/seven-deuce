"use client";
import { useState, useEffect, useCallback, Fragment } from 'react';
import { Session } from '@/types/session';
import Statistics from '@/components/Statistics';
import Charts from '@/components/Charts';
import { useUser } from '@/context/UserContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useGuest } from '@/context/GuestContext';
import Modal from '@/components/Modal';
import { PlusIcon, CheckCircleIcon, XCircleIcon, Bars3Icon } from '@heroicons/react/24/solid';

export default function Home() {
  const { user, loading } = useUser();
  const { isGuest, setGuest } = useGuest();
  const supabase = createClientComponentClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formData, setFormData] = useState({
    gameType: 'cash',
    buyIn: '',
    cashOut: '',
    location: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [bankroll, setBankroll] = useState({
    starting: '',
    goal: '',
  });
  const [showMigrate, setShowMigrate] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [editingBankroll, setEditingBankroll] = useState({ starting: '', goal: '' });
  const [bankrollSaved, setBankrollSaved] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isEditingBankroll, setIsEditingBankroll] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview');

  useEffect(() => {
    if (isGuest) {
      const localSessions = localStorage.getItem('guestSessions');
      setSessions(localSessions ? JSON.parse(localSessions) : []);
      const savedBankroll = localStorage.getItem('bankroll');
      if (savedBankroll) setBankroll(JSON.parse(savedBankroll));
    }
  }, [isGuest]);

  useEffect(() => {
    if (!isGuest && user && localStorage.getItem('guestSessions')) {
      setShowMigrate(true);
    }
  }, [isGuest, user]);

  useEffect(() => {
    if (!isGuest && user) {
      (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('starting_bankroll, bankroll_goal')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setBankroll({
            starting: data.starting_bankroll !== null && data.starting_bankroll !== undefined ? String(data.starting_bankroll) : '',
            goal: data.bankroll_goal !== null && data.bankroll_goal !== undefined ? String(data.bankroll_goal) : '',
          });
        }
      })();
    }
  }, [isGuest, user, supabase]);

  const fetchSessions = useCallback(async () => {
    if (isGuest) return;
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (Array.isArray(data)) {
        setSessions(data);
      } else {
        setSessions([]);
        if (data.error) {
          console.error('API error:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    }
  }, [isGuest]);

  useEffect(() => {
    if (!isGuest) fetchSessions();
  }, [isGuest, fetchSessions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalStatus('idle');
    if (isGuest) {
      const guestSessions = localStorage.getItem('guestSessions');
      let arr = guestSessions ? JSON.parse(guestSessions) : [];
      if (editingSession) {
        arr = arr.map((s: Session) => s.id === editingSession.id ? { ...editingSession, ...formData, buyIn: Number(formData.buyIn), cashOut: formData.cashOut ? Number(formData.cashOut) : null, profit: formData.cashOut ? Number(formData.cashOut) - Number(formData.buyIn) : null } : s);
      } else {
        arr.push({
          id: Date.now().toString(),
          gameType: formData.gameType,
          buyIn: Number(formData.buyIn),
          cashOut: formData.cashOut ? Number(formData.cashOut) : null,
          profit: formData.cashOut ? Number(formData.cashOut) - Number(formData.buyIn) : null,
          location: formData.location,
          notes: formData.notes,
          date: formData.date,
        });
      }
      localStorage.setItem('guestSessions', JSON.stringify(arr));
      setSessions(arr);
      setFormData({
        gameType: 'cash',
        buyIn: '',
        cashOut: '',
        location: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      setEditingSession(null);
      setModalStatus('success');
      setTimeout(() => {
        setModalStatus('idle');
        setIsModalOpen(false);
      }, 1500);
      return;
    }
    try {
      const url = editingSession 
        ? `/api/sessions/${editingSession.id}`
        : '/api/sessions';
      const method = editingSession ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        await fetchSessions();
        setFormData({
          gameType: 'cash',
          buyIn: '',
          cashOut: '',
          location: '',
          notes: '',
          date: new Date().toISOString().split('T')[0],
        });
        setEditingSession(null);
        setModalStatus('success');
        setTimeout(() => {
          setModalStatus('idle');
          setIsModalOpen(false);
        }, 1500);
      } else {
        setModalStatus('error');
      }
    } catch (error) {
      setModalStatus('error');
    }
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      gameType: session.gameType,
      buyIn: session.buyIn.toString(),
      cashOut: session.cashOut?.toString() || '',
      location: session.location,
      notes: session.notes || '',
      date: new Date(session.date).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      if (isGuest) {
        const arr = sessions.filter(s => s.id !== id);
        localStorage.setItem('guestSessions', JSON.stringify(arr));
        setSessions(arr);
        return;
      }
      try {
        const response = await fetch(`/api/sessions/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchSessions();
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  // Fetch bankroll from DB for authenticated users
  const fetchBankroll = useCallback(async () => {
    if (!isGuest && user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('starting_bankroll, bankroll_goal')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setBankroll({
            starting:
              data.starting_bankroll !== null && data.starting_bankroll !== undefined
                ? String(data.starting_bankroll)
                : '',
            goal:
              data.bankroll_goal !== null && data.bankroll_goal !== undefined
                ? String(data.bankroll_goal)
                : '',
          });
        } else {
          console.error('Error fetching bankroll:', error);
        }
      } catch (err) {
        console.error('Exception fetching bankroll:', err);
      }
    }
  }, [isGuest, user, supabase]);

  useEffect(() => {
    if (!isGuest && user) {
      fetchBankroll();
    }
  }, [isGuest, user, fetchBankroll]);

  useEffect(() => {
    setEditingBankroll(bankroll);
  }, [bankroll]);

  // Helper to check if a bankroll value is set (not empty, null, or undefined)
  const isValueSet = (val: string | undefined) => {
    return val !== undefined && val !== null && val !== '' && !isNaN(Number(val));
  };

  // Helper to parse bankroll values safely
  const getNumber = (val: string | undefined) => {
    if (!isValueSet(val)) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  // Set edit mode if bankroll is not set or both are zero
  useEffect(() => {
    const starting = getNumber(bankroll.starting);
    const goal = getNumber(bankroll.goal);
    if (
      (!isValueSet(bankroll.starting) && !isValueSet(bankroll.goal)) ||
      (starting === 0 && goal === 0)
    ) {
      setIsEditingBankroll(true);
    } else {
      setIsEditingBankroll(false);
    }
  }, [bankroll.starting, bankroll.goal]);

  const handleBankrollInput = (field: 'starting' | 'goal', value: string) => {
    setEditingBankroll((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankrollUpdateButton = async () => {
    setBankrollSaved('saving');
    try {
      if (isGuest) {
        localStorage.setItem('bankroll', JSON.stringify(editingBankroll));
        setBankroll(editingBankroll);
        setBankrollSaved('success');
        setTimeout(() => setBankrollSaved('idle'), 1200);
        setIsEditingBankroll(false);
      } else if (user) {
        const updateObj = {
          starting_bankroll: editingBankroll.starting === '' ? null : Number(editingBankroll.starting),
          bankroll_goal: editingBankroll.goal === '' ? null : Number(editingBankroll.goal),
        };
        const { error } = await supabase
          .from('profiles')
          .update(updateObj)
          .eq('id', user.id);
        if (!error) {
          await fetchBankroll(); // Refresh bankroll from DB
          setBankrollSaved('success');
          setTimeout(() => setBankrollSaved('idle'), 1200);
          setIsEditingBankroll(false);
        } else {
          setBankrollSaved('error');
          console.error('Error updating bankroll:', error);
        }
      }
    } catch (err) {
      setBankrollSaved('error');
      console.error('Exception updating bankroll:', err);
    }
  };

  const isBankrollDirty = editingBankroll.starting !== bankroll.starting || editingBankroll.goal !== bankroll.goal;

  const handleMigrate = async () => {
    const guestSessions = localStorage.getItem('guestSessions');
    if (guestSessions && user) {
      const arr = JSON.parse(guestSessions);
      for (const s of arr) {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: s.gameType,
            buyIn: s.buyIn,
            cashOut: s.cashOut,
            location: s.location,
            notes: s.notes,
            date: s.date,
          }),
        });
      }
      localStorage.removeItem('guestSessions');
      setShowMigrate(false);
      setGuest(false);
      fetchSessions();
    }
  };

  const filteredSessions = Array.isArray(sessions) ? sessions.filter(session => {
    if (!dateRange.start && !dateRange.end) return true;
    const sessionDate = new Date(session.date);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    if (start && end) {
      return sessionDate >= start && sessionDate <= end;
    } else if (start) {
      return sessionDate >= start;
    } else if (end) {
      return sessionDate <= end;
    }
    return true;
  }) : [];

  const handleLogout = async () => {
    if (isGuest) {
      setGuest(false);
      window.location.href = '/auth';
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
    setFormData({
      gameType: 'cash',
      buyIn: '',
      cashOut: '',
      location: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Close drawer on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const drawer = document.getElementById('mobile-drawer');
      if (drawer && !drawer.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  if (loading && !isGuest) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  if (!user && !isGuest) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-auto bg-gray-50">
      {/* Mobile drawer overlay */}
      <div className={`sm:hidden fixed inset-0 z-50 transition-all duration-300 ${mobileMenuOpen ? 'bg-black/40 pointer-events-auto' : 'pointer-events-none bg-transparent'}`}></div>
      {/* Mobile drawer */}
      <div id="mobile-drawer" className={`sm:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl border-r border-gray-200 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ willChange: 'transform' }}>
        <div className="flex flex-col gap-4 p-6 pt-8">
          <button
            className="self-end mb-2 p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-yellow-900">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {isGuest ? (
            <span className="text-gray-700 text-base">Guest Mode</span>
          ) : (
            <span className="text-gray-700 text-base">{user?.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-xl bg-gray-200 px-4 py-2 text-base font-semibold text-gray-700 hover:bg-gray-300 transition-colors w-full"
          >
            Logout
          </button>
        </div>
      </div>
      {/* Desktop/Tablet UI */}
      <div className="hidden sm:block w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Gold pill banner header for desktop/tablet only */}
          <div className="flex items-center justify-between w-full mb-6">
            {/* Title on the left with pill background */}
            <div className="flex-1 flex items-center">
              <div className="flex items-center gap-2 select-none px-6 py-2 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-lg border-4 border-yellow-600" style={{ boxShadow: '0 2px 18px 0 #eab30899', minHeight: '2.5rem', maxWidth: '480px' }}>
                <span className="text-md sm:text-2xl font-extrabold text-red-600 drop-shadow-lg">7<span className="text-xs sm:text-2xl align-super">♥</span></span>
                <span className="mx-1 text-base sm:text-2xl font-extrabold text-yellow-900 drop-shadow-lg" style={{ textShadow: '0 2px 8px #fff, 0 1px 0 #eab308' }}>/</span>
                <span className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-lg">2<span className="text-xs sm:text-2xl align-super text-black">♠</span></span>
                <span className="ml-2 text-md sm:text-2xl font-bold text-yellow-900 tracking-tight drop-shadow-lg" style={{ textShadow: '0 2px 8px #fff, 0 1px 0 #eab308' }}>Seven Deuce</span>
              </div>
            </div>
            <div className="flex-1 flex justify-end items-center gap-4">
              {user && (
                <span className="text-gray-700 text-sm font-medium truncate max-w-[180px]" title={user.email}>{user.email}</span>
              )}
              <button
                onClick={handleLogout}
                className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Desktop layout: grid with chart, bankroll, sessions, etc. */}
          <Statistics sessions={sessions} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6 order-2 lg:order-1 h-full">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[180px] flex flex-col justify-between">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Bankroll Management</h2>
                {isEditingBankroll ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="startingBankroll" className="block text-sm font-medium text-gray-700 mb-2">
                          Starting Bankroll ($)
                        </label>
                        <input
                          type="number"
                          id="startingBankroll"
                          value={editingBankroll.starting}
                          onChange={(e) => handleBankrollInput('starting', e.target.value)}
                          className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="bankrollGoal" className="block text-sm font-medium text-gray-700 mb-2">
                          Bankroll Goal ($)
                        </label>
                        <input
                          type="number"
                          id="bankrollGoal"
                          value={editingBankroll.goal}
                          onChange={(e) => handleBankrollInput('goal', e.target.value)}
                          className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button
                        onClick={handleBankrollUpdateButton}
                        disabled={!isBankrollDirty || bankrollSaved === 'saving'}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors
                          ${!isBankrollDirty || bankrollSaved === 'saving' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'}`}
                        type="button"
                      >
                        {bankrollSaved === 'saving' ? 'Saving...' : 'Update'}
                        {bankrollSaved === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-300" />}
                        {bankrollSaved === 'error' && <span className="text-red-200 ml-2">Error</span>}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBankroll(false);
                          setEditingBankroll(bankroll);
                        }}
                        className="flex-1 flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-200 transition-colors"
                        type="button"
                        disabled={bankrollSaved === 'saving'}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 w-full justify-between">
                      <div>
                        <span className="block text-xs text-gray-500">Current Bankroll</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {
                            isValueSet(bankroll.starting)
                              ? `$${(((getNumber(bankroll.starting) ?? 0) + (sessions.reduce((sum, s) => sum + (s.profit || 0), 0)))).toFixed(2)}`
                              : '--'
                          }
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          Goal of {
                            isValueSet(bankroll.goal) && (getNumber(bankroll.goal) ?? 0) > (getNumber(bankroll.starting) ?? 0)
                              ? `$${(getNumber(bankroll.goal) ?? 0).toFixed(2)}`
                              : '--'
                          }
                        </span>
                      </div>
                      <button
                        className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors"
                        onClick={() => setIsEditingBankroll(true)}
                        type="button"
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
                <div className="mt-6">
                  <div className="flex items-end justify-between mb-1">
                    <div>
                      <span className="block text-xs text-gray-500">Current Bankroll</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {
                          isValueSet(bankroll.starting)
                            ? `$${(((getNumber(bankroll.starting) ?? 0) + (sessions.reduce((sum, s) => sum + (s.profit || 0), 0)))).toFixed(2)}`
                            : '--'
                        }
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Goal of {
                        isValueSet(bankroll.goal) && (getNumber(bankroll.goal) ?? 0) > (getNumber(bankroll.starting) ?? 0)
                          ? `$${(getNumber(bankroll.goal) ?? 0).toFixed(2)}`
                          : '--'
                      }
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-orange-400 rounded-full transition-all"
                      style={{
                        width:
                          isValueSet(bankroll.starting) && isValueSet(bankroll.goal) && (getNumber(bankroll.goal) ?? 0) > (getNumber(bankroll.starting) ?? 0)
                            ? `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  (
                                    (((getNumber(bankroll.starting) ?? 0) + sessions.reduce((sum, s) => sum + (s.profit || 0), 0)) - (getNumber(bankroll.starting) ?? 0)) /
                                    ((getNumber(bankroll.goal) ?? 1) - (getNumber(bankroll.starting) ?? 0))
                                  ) * 100
                                )
                              )}%`
                            : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <button
                onClick={openModal}
                className="flex flex-col items-center justify-center flex-1 min-h-[100px] max-h-[150px] bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl shadow-sm hover:bg-blue-100 transition-colors focus:outline-none"
                aria-label="Add New Session"
                type="button"
              >
                <PlusIcon className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-md font-semibold text-blue-700">Add New Session</span>
              </button>
            </div>
            <div className="order-1 lg:order-2 h-[400px] flex flex-col">
              <Charts sessions={sessions} />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Sessions</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full sm:w-auto"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition w-full sm:w-auto"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                {filteredSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sessions recorded yet.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy In</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Out</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(session.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {session.gameType === 'cash' ? 'Cash Game' : 'Tournament'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${session.buyIn}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {session.cashOut ? `$${session.cashOut}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`${session.profit && session.profit > 0 ? 'text-green-600' : session.profit && session.profit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {session.profit ? `$${session.profit}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {session.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-4">
                              <button
                                onClick={() => handleEdit(session)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile UI */}
      <div className="block sm:hidden w-full h-full bg-[#f7f7fa]">
        <div className={`w-full max-w-md mx-auto px-2 pt-4 pb-32 space-y-4 relative transition-transform duration-300 ${mobileMenuOpen ? 'sm:translate-x-0 translate-x-56' : ''}`} style={{ minHeight: '100vh' }}>
          {/* Tab Bar */}
          <div className="flex w-full justify-center mb-4">
            <div className="flex bg-gray-100 rounded-full p-1 gap-1 w-full max-w-xs">
              <button
                className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-white shadow text-yellow-900' : 'text-gray-500 hover:text-yellow-900'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === 'sessions' ? 'bg-white shadow text-yellow-900' : 'text-gray-500 hover:text-yellow-900'}`}
                onClick={() => setActiveTab('sessions')}
              >
                Sessions
              </button>
            </div>
          </div>
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <Fragment>
              {/* Main Chart Card */}
              <div className="w-full bg-white rounded-2xl shadow p-6 mb-4 mt-4">
                {/* Bankroll and Goal Row */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Current Bankroll</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {isValueSet(bankroll.starting)
                        ? `$${(((getNumber(bankroll.starting) ?? 0) + (sessions.reduce((sum, s) => sum + (s.profit || 0), 0)))).toFixed(2)}`
                        : '--'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Goal</div>
                    <div className="text-lg font-bold text-gray-700">
                      {isValueSet(bankroll.goal) ? `$${(getNumber(bankroll.goal) ?? 0).toFixed(2)}` : '--'}
                    </div>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all"
                    style={{
                      width:
                        isValueSet(bankroll.starting) && isValueSet(bankroll.goal) && (getNumber(bankroll.goal) ?? 0) > (getNumber(bankroll.starting) ?? 0)
                          ? `${Math.min(
                              100,
                              Math.max(
                                0,
                                (
                                  (((getNumber(bankroll.starting) ?? 0) + sessions.reduce((sum, s) => sum + (s.profit || 0), 0)) - (getNumber(bankroll.starting) ?? 0)) /
                                  ((getNumber(bankroll.goal) ?? 1) - (getNumber(bankroll.starting) ?? 0))
                                ) * 100
                              )
                            )}%`
                          : '0%'
                    }}
                  ></div>
                </div>
                {/* Minimal Chart Card */}
                <div className="bg-gray-50 rounded-xl p-4 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-base font-semibold text-gray-900">Profit/Loss</div>
                    {/* Show percent change if available */}
                    {/* <div className="text-xs font-semibold text-green-500">+5.2%</div> */}
                    <div className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const totalProfit = sessions.reduce((sum, s) => sum + (s.profit || 0), 0);
                        return isNaN(totalProfit) ? '--' : `$${totalProfit.toFixed(2)}`;
                      })()}
                    </div>
                  </div>
                  <div className="mt-2">
                    {/* Minimal chart, hide subtitle/date range, and tabs if possible */}
                    <Charts sessions={sessions} />
                  </div>
                </div>
                <button
                  className="mt-6 px-5 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors text-sm w-full"
                  onClick={() => setIsEditingBankroll(true)}
                  type="button"
                >
                  Edit Bankroll
                </button>
                {isEditingBankroll && (
                  <div className="w-full mt-4 flex flex-col gap-2">
                    <input
                      type="number"
                      value={editingBankroll.starting}
                      onChange={e => handleBankrollInput('starting', e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                      placeholder="Starting Bankroll ($)"
                    />
                    <input
                      type="number"
                      value={editingBankroll.goal}
                      onChange={e => handleBankrollInput('goal', e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                      placeholder="Bankroll Goal ($)"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleBankrollUpdateButton}
                        disabled={!isBankrollDirty || bankrollSaved === 'saving'}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors
                          ${!isBankrollDirty || bankrollSaved === 'saving' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'}`}
                        type="button"
                      >
                        {bankrollSaved === 'saving' ? 'Saving...' : 'Update'}
                        {bankrollSaved === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-300" />}
                        {bankrollSaved === 'error' && <span className="text-red-200 ml-2">Error</span>}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBankroll(false);
                          setEditingBankroll(bankroll);
                        }}
                        className="flex-1 flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-200 transition-colors"
                        type="button"
                        disabled={bankrollSaved === 'saving'}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Fragment>
          )}
          {activeTab === 'sessions' && (
            <div className="w-full flex flex-col gap-4">
              {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400 text-base">No sessions recorded yet.</div>
              ) : (
                filteredSessions.map(session => (
                  <div key={session.id} className="bg-white rounded-2xl shadow p-6 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">{new Date(session.date).toLocaleDateString()}</span>
                      <span className={`font-bold ${session.profit && session.profit > 0 ? 'text-green-600' : session.profit && session.profit < 0 ? 'text-red-600' : 'text-gray-700'}`}>{typeof session.profit === 'number' ? `$${session.profit}` : '-'}</span>
                    </div>
                    <div className="text-xs text-gray-500">{session.gameType === 'cash' ? 'Cash Game' : 'Tournament'} @ {session.location}</div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleEdit(session)} className="text-blue-600 text-xs font-semibold">Edit</button>
                      <button onClick={() => handleDelete(session.id)} className="text-red-600 text-xs font-semibold">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* Bottom Nav for mobile */}
          <nav className="fixed bottom-0 left-0 w-full z-50 bg-white shadow-lg border-t border-gray-200 flex items-center justify-around px-8 py-2 sm:hidden" style={{borderRadius:0}}>
            <button
              className="p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open settings menu"
              type="button"
            >
              <Bars3Icon className="w-7 h-7 text-gray-700" />
            </button>
            <button
              className="p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              onClick={openModal}
              aria-label="Add New Session"
              type="button"
            >
              <PlusIcon className="w-7 h-7 text-yellow-500" />
            </button>
          </nav>
        </div>
      </div>
      {/* Add Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        footer={
          <div className="flex gap-4 px-2">
            <button
              type="submit"
              form="add-session-form"
              className="inline-flex justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors w-full"
              disabled={modalStatus === 'success'}
            >
              {editingSession ? 'Update Session' : 'Add Session'}
            </button>
            {editingSession && (
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-200 transition-colors w-full"
                disabled={modalStatus === 'success'}
              >
                Cancel
              </button>
            )}
          </div>
        }
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {editingSession ? 'Edit Session' : 'Add New Session'}
        </h2>
        {modalStatus === 'success' && (
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
            <span className="text-green-700 font-semibold">Session saved successfully!</span>
          </div>
        )}
        {modalStatus === 'error' && (
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <span className="text-red-700 font-semibold">Failed to save session. Please try again.</span>
          </div>
        )}
        <form id="add-session-form" onSubmit={handleSubmit} className="space-y-6 pb-4 sm:pb-0">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                required
              />
            </div>
            <div>
              <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 mb-2">
                Game Type
              </label>
              <select
                id="gameType"
                name="gameType"
                value={formData.gameType}
                onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
                className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              >
                <option value="cash">Cash Game</option>
                <option value="tournament">Tournament</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                required
              />
            </div>
            <div>
              <label htmlFor="buyIn" className="block text-sm font-medium text-gray-700 mb-2">
                Buy In ($)
              </label>
              <input
                type="number"
                name="buyIn"
                id="buyIn"
                value={formData.buyIn}
                onChange={(e) => setFormData({ ...formData, buyIn: e.target.value })}
                className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
            <div>
              <label htmlFor="cashOut" className="block text-sm font-medium text-gray-700 mb-2">
                Cash Out ($)
              </label>
              <input
                type="number"
                name="cashOut"
                id="cashOut"
                value={formData.cashOut}
                onChange={(e) => setFormData({ ...formData, cashOut: e.target.value })}
                className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              placeholder="Add any notes about the session..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
} 
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types/session';
import Statistics from '@/components/Statistics';
import Charts from '@/components/Charts';
import { useUser } from '@/context/UserContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useGuest } from '@/context/GuestContext';
import Modal from '@/components/Modal';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

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

  // Guest mode: load from localStorage
  useEffect(() => {
    if (isGuest) {
      const localSessions = localStorage.getItem('guestSessions');
      setSessions(localSessions ? JSON.parse(localSessions) : []);
      const savedBankroll = localStorage.getItem('bankroll');
      if (savedBankroll) setBankroll(JSON.parse(savedBankroll));
    }
  }, [isGuest]);

  // Auth mode: migrate guest data if present
  useEffect(() => {
    if (!isGuest && user && localStorage.getItem('guestSessions')) {
      setShowMigrate(true);
    }
  }, [isGuest, user]);

  // Fetch bankroll from Supabase on login
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
    if (isGuest) return; // skip fetch in guest mode
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
      // Save to localStorage
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
    // Auth mode
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

  // Sync editingBankroll with bankroll when bankroll changes
  useEffect(() => {
    setEditingBankroll(bankroll);
  }, [bankroll]);

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
      } else if (user) {
        const updateObj = {
          starting_bankroll: editingBankroll.starting === '' ? null : Number(editingBankroll.starting),
          bankroll_goal: editingBankroll.goal === '' ? null : Number(editingBankroll.goal),
        };
        const { error } = await supabase.from('profiles').update(updateObj).eq('id', user.id);
        if (!error) {
          setBankroll(editingBankroll);
          setBankrollSaved('success');
          setTimeout(() => setBankrollSaved('idle'), 1200);
        } else {
          setBankrollSaved('error');
        }
      }
    } catch {
      setBankrollSaved('error');
    }
  };

  const isBankrollDirty = editingBankroll.starting !== bankroll.starting || editingBankroll.goal !== bankroll.goal;

  // Migrate guest data to Supabase after login
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative">
      {/* Session Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="flex gap-4">
            <button
              type="submit"
              className="inline-flex justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              disabled={modalStatus === 'success'}
            >
              {editingSession ? 'Update Session' : 'Add Session'}
            </button>
            {editingSession && (
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-200 transition-colors"
                disabled={modalStatus === 'success'}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Modal>
      {showMigrate && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 flex items-center justify-between mb-4">
          <span className="text-yellow-800 font-medium">You have local sessions from guest mode. Migrate them to your account?</span>
          <button
            onClick={handleMigrate}
            className="ml-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Migrate Data
          </button>
          <button
            onClick={() => { localStorage.removeItem('guestSessions'); setShowMigrate(false); }}
            className="ml-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-red-600 select-none">7<span className="text-lg align-super">♥</span></span>
          <span className="mx-1 text-xl font-extrabold text-gray-700 select-none">/</span>
          <span className="text-2xl font-extrabold text-gray-900 select-none">2<span className="text-lg align-super text-black">♠</span></span>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight select-none ml-2">Seven Deuce</h1>
        </div>
        <div className="flex items-center gap-4">
          {isGuest ? (
            <span className="text-gray-700 text-sm">Guest Mode</span>
          ) : (
            <span className="text-gray-700 text-sm">{user?.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <Statistics sessions={sessions} />
      
      {/* Responsive grid for bankroll, add session card, and charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6 order-2 lg:order-1 h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[180px] flex flex-col justify-between">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bankroll Management</h2>
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
            <button
              onClick={handleBankrollUpdateButton}
              disabled={!isBankrollDirty || bankrollSaved === 'saving'}
              className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors
                ${!isBankrollDirty || bankrollSaved === 'saving' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'}`}
              type="button"
            >
              {bankrollSaved === 'saving' ? 'Saving...' : 'Update'}
              {bankrollSaved === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-300" />}
              {bankrollSaved === 'error' && <span className="text-red-200 ml-2">Error</span>}
            </button>
          </div>
          <button
            onClick={openModal}
            className="flex flex-col items-center justify-center flex-1 min-h-[180px] bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl shadow-sm hover:bg-blue-100 transition-colors focus:outline-none"
            aria-label="Add New Session"
            type="button"
          >
            <PlusIcon className="w-14 h-14 text-blue-500 mb-2" />
            <span className="text-lg font-semibold text-blue-700">Add New Session</span>
          </button>
        </div>
        <div className="order-1 lg:order-2">
          <Charts sessions={sessions} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Sessions</h2>
            <div className="flex gap-4">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
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
  );
}

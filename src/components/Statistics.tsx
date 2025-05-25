import { Session } from '@/types/session';

interface StatisticsProps {
  sessions: Session[];
}

export default function Statistics({ sessions }: StatisticsProps) {
  const calculateStats = () => {
    const totalSessions = sessions.length;
    const totalProfit = sessions.reduce((sum, session) => sum + (session.profit || 0), 0);
    const winningSessions = sessions.filter(session => (session.profit || 0) > 0).length;
    const winRate = totalSessions > 0 ? (winningSessions / totalSessions) * 100 : 0;
    
    const profitByLocation = sessions.reduce((acc, session) => {
      acc[session.location] = (acc[session.location] || 0) + (session.profit || 0);
      return acc;
    }, {} as Record<string, number>);

    const bestLocation = Object.entries(profitByLocation)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    const worstLocation = Object.entries(profitByLocation)
      .sort(([, a], [, b]) => a - b)[0]?.[0] || 'N/A';

    const profitByGameType = sessions.reduce((acc, session) => {
      acc[session.gameType] = (acc[session.gameType] || 0) + (session.profit || 0);
      return acc;
    }, {} as Record<string, number>);

    // Get bankroll data from localStorage
    const bankrollData = localStorage.getItem('bankroll');
    const bankroll = bankrollData ? JSON.parse(bankrollData) : { starting: '', goal: '' };
    const currentBankroll = bankroll.starting ? Number(bankroll.starting) + totalProfit : null;
    const progressToGoal = bankroll.goal && currentBankroll
      ? ((currentBankroll - Number(bankroll.starting)) / (Number(bankroll.goal) - Number(bankroll.starting))) * 100
      : null;

    return {
      totalSessions,
      totalProfit,
      winRate,
      bestLocation,
      worstLocation,
      profitByGameType,
      currentBankroll,
      progressToGoal,
      bankrollGoal: bankroll.goal,
    };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Overall Performance</h3>
        <dl className="space-y-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">Total Profit/Loss</dt>
            <dd className={`text-3xl font-semibold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.totalProfit.toFixed(2)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Session Stats</h3>
        <dl className="space-y-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">Total Sessions</dt>
            <dd className="text-lg font-semibold text-gray-900">{stats.totalSessions}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Win Rate</dt>
            <dd className="text-lg font-semibold text-gray-900">{stats.winRate.toFixed(1)}%</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Location Analysis</h3>
        <dl className="space-y-2">
          <div>
            <dt className="text-xs font-medium text-gray-500">Best Location</dt>
            <dd className="text-lg font-semibold text-green-600">{stats.bestLocation}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500">Worst Location</dt>
            <dd className="text-lg font-semibold text-red-600">{stats.worstLocation}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Game Type Analysis</h3>
        <dl className="space-y-2">
          {Object.entries(stats.profitByGameType).map(([type, profit]) => (
            <div key={type}>
              <dt className="text-xs font-medium text-gray-500">
                {type === 'cash' ? 'Cash Games' : 'Tournaments'}
              </dt>
              <dd className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${profit.toFixed(2)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
} 
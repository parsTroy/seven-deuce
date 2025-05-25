import { useState } from 'react';
import { Session } from '@/types/session';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartsProps {
  sessions: Session[];
}

function getDateRangeLabel(sessions: Session[]) {
  if (!sessions.length) return '';
  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const start = new Date(sorted[0].date).toLocaleDateString();
  const end = new Date(sorted[sorted.length - 1].date).toLocaleDateString();
  return start === end ? start : `${start} - ${end}`;
}

export default function Charts({ sessions }: ChartsProps) {
  const [activeTab, setActiveTab] = useState<'time' | 'location'>('time');
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const dateRangeLabel = getDateRangeLabel(sortedSessions);

  // Profit/Loss over time
  const profitOverTimeData = {
    labels: sortedSessions.map(session => new Date(session.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Profit/Loss',
        data: sortedSessions.map(session => session.profit || 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
      },
    ],
  };

  // Profit by location
  const profitByLocation = sessions.reduce((acc, session) => {
    acc[session.location] = (acc[session.location] || 0) + (session.profit || 0);
    return acc;
  }, {} as Record<string, number>);

  const locationData = {
    labels: Object.keys(profitByLocation),
    datasets: [
      {
        label: 'Profit/Loss by Location',
        data: Object.values(profitByLocation),
        backgroundColor: Object.values(profitByLocation).map(value => value >= 0 ? '#34d399' : '#f87171'),
        borderRadius: 6,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#111',
        bodyColor: '#111',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#6b7280', font: { size: 13 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 13 } },
      },
    },
  };

  // Calculate total profit and percent change (if possible)
  const totalProfit = sortedSessions.reduce((sum, s) => sum + (s.profit || 0), 0);
  let percentChange = null;
  if (sortedSessions.length > 1) {
    const prev = sortedSessions[sortedSessions.length - 2].profit || 0;
    const curr = sortedSessions[sortedSessions.length - 1].profit || 0;
    if (prev !== 0) {
      percentChange = ((curr - prev) / Math.abs(prev)) * 100;
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{activeTab === 'time' ? 'Profit/Loss Over Time' : 'Profit/Loss by Location'}</h3>
            <div className="text-xs text-gray-500">{dateRangeLabel}</div>
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <div className="text-2xl font-bold text-gray-900">${totalProfit.toFixed(2)}</div>
            {percentChange !== null && (
              <span className={`text-sm font-semibold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%</span>
            )}
            {/* Tabs */}
            <div className="ml-4 flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'time' ? 'bg-white text-blue-700 shadow' : 'text-gray-500 hover:text-blue-700'}`}
                onClick={() => setActiveTab('time')}
              >
                Over Time
              </button>
              <button
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'location' ? 'bg-white text-blue-700 shadow' : 'text-gray-500 hover:text-blue-700'}`}
                onClick={() => setActiveTab('location')}
              >
                By Location
              </button>
            </div>
          </div>
        </div>
        <div className="h-[240px] w-full">
          {activeTab === 'time' ? (
            <Line options={chartOptions} data={profitOverTimeData} />
          ) : (
            <Bar options={chartOptions} data={locationData} />
          )}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4">
          {activeTab === 'time' && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-xs text-gray-600">Profit/Loss</span>
            </div>
          )}
          {activeTab === 'location' && (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-gray-600">Profit (Location)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-400" />
                <span className="text-xs text-gray-600">Loss (Location)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 
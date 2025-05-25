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

export default function Charts({ sessions }: ChartsProps) {
  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Prepare data for profit over time chart
  const profitOverTimeData = {
    labels: sortedSessions.map(session => 
      new Date(session.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Profit/Loss',
        data: sortedSessions.map(session => session.profit || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Prepare data for profit by location chart
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
        backgroundColor: Object.values(profitByLocation).map(value => 
          value >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        ),
        borderColor: Object.values(profitByLocation).map(value => 
          value >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Profit/Loss Over Time</h3>
        <div className="h-[300px]">
          <Line options={chartOptions} data={profitOverTimeData} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Profit/Loss by Location</h3>
        <div className="h-[300px]">
          <Bar options={chartOptions} data={locationData} />
        </div>
      </div>
    </div>
  );
} 
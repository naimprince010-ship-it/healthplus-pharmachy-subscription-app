'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Loader2, TrendingUp, Users, MapPin, AlertCircle } from 'lucide-react';

interface AnalyticsData {
  city: string;
  path: string;
  views: number;
  users: number;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dateRange, setDateRange] = useState('30daysAgo'); // '7daysAgo', '30daysAgo'

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics?startDate=${dateRange}&endDate=today`);
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.error || 'Failed to fetch data');
        }
        
        setData(json.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [dateRange]);

  // Aggregate data by City for the Bar Chart
  const cityDataMap = new Map<string, number>();
  data.forEach(item => {
    const current = cityDataMap.get(item.city) || 0;
    cityDataMap.set(item.city, current + item.views);
  });
  
  const cityChartData = Array.from(cityDataMap.entries())
    .map(([city, views]) => ({ city, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10); // Top 10 cities

  const totalViews = data.reduce((sum, item) => sum + item.views, 0);
  const totalUsers = data.reduce((sum, item) => sum + item.users, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Local Traffic Analytics</h1>
          <p className="text-gray-500 mt-1">Proof of traffic for local sponsors and ad networks</p>
        </div>
        
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 p-2.5 shadow-sm"
        >
          <option value="7daysAgo">Last 7 Days</option>
          <option value="30daysAgo">Last 30 Days</option>
          <option value="90daysAgo">Last 90 Days</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold">Error loading analytics</h3>
            <p className="text-sm mt-1">{error}</p>
            {error.includes('configured in .env') && (
              <p className="text-sm mt-2 font-medium">
                Please follow the steps in the Implementation Plan to create a Google Cloud Service Account and add `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, and `GA_PRIVATE_KEY` to your `.env` file.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="bg-teal-100 p-3 rounded-lg text-teal-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Local Page Views</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? <span className="text-gray-300">...</span> : totalViews.toLocaleString()}
            </h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Unique Local Users</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? <span className="text-gray-300">...</span> : totalUsers.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Top City</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? <span className="text-gray-300">...</span> : (cityChartData[0]?.city || 'N/A')}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Traffic by City</h3>
          <div className="h-80 w-full flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            ) : data.length === 0 ? (
              <p className="text-gray-500">No data available for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="city" type="category" width={100} tick={{ fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="views" fill="#0d9488" radius={[0, 4, 4, 0]} name="Page Views" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Pages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Delivery Pages</h3>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : data.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No data available.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Path</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-[200px]" title={row.path}>
                        {row.path.replace('/delivery/', '') || '/'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right font-medium">{row.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{row.users.toLocaleString()}</td>
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

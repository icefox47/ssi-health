import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Activity, Database, Users } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [data, setData] = useState({
    current_round: 0,
    loss_history: [],
    overhead_history: [],
    pending_updates: 0,
    min_clients: 5
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/fl/status');
        setData(res.data);
      } catch (error) {
        console.error("FL Status not reachable", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h2 className="card-title">Federated Learning Convergence</h2>
        <p className="card-description">Live simulation of privacy-preserving model training across DIDs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="metrics-box bg-gray-900 border border-gray-700 rounded-lg p-5 flex flex-col items-center justify-center">
          <Activity size={32} className="text-blue-500 mb-2" />
          <p className="text-gray-400 text-sm">Global FL Round</p>
          <h3 className="text-3xl font-bold text-white">{data.current_round}</h3>
        </div>
        <div className="metrics-box bg-gray-900 border border-gray-700 rounded-lg p-5 flex flex-col items-center justify-center">
          <Users size={32} className="text-green-500 mb-2" />
          <p className="text-gray-400 text-sm">Pending Client Updates</p>
          <h3 className="text-3xl font-bold text-white">{data.pending_updates} / {data.min_clients}</h3>
        </div>
        <div className="metrics-box bg-gray-900 border border-gray-700 rounded-lg p-5 flex flex-col items-center justify-center">
          <Database size={32} className="text-purple-500 mb-2" />
          <p className="text-gray-400 text-sm">Communication Overhead</p>
          <h3 className="text-3xl font-bold text-white">
            {data.overhead_history.reduce((acc, curr) => acc + curr.bytes, 0) / 1000} KB
          </h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="chart-container bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-xl hover:border-gray-700 transition-colors">
          <h3 className="text-lg font-medium text-gray-200 mb-4 text-center">Loss Convergence</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.loss_history.length > 0 ? data.loss_history : [{ round: 0, loss: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis dataKey="round" stroke="#9ca3af" label={{ value: 'FL Round', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" label={{ value: 'Log Loss', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} cursor={{ stroke: '#4b5563', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="loss" stroke="#3b82f6" strokeWidth={4} dot={data.loss_history.length > 0 ? { r: 5, fill: '#0d1117', stroke: '#3b82f6', strokeWidth: 2 } : false} activeDot={{ r: 8, strokeWidth: 0, fill: '#60a5fa' }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
            {data.loss_history.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm rounded">
                <p className="text-gray-400 font-medium">Waiting for FL Simulation updates...</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-xl hover:border-gray-700 transition-colors">
          <h3 className="text-lg font-medium text-gray-200 mb-4 text-center">Round Communication Overhead</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.overhead_history.length > 0 ? data.overhead_history : [{ round: 0, bytes: 0 }]}>
                <defs>
                  <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis dataKey="round" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(v) => `${(v/1000).toFixed(0)}kb`} label={{ value: 'Bytes', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip formatter={(value) => [`${value} B`, 'Overhead']} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="bytes" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorBytes)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
            {data.overhead_history.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm rounded">
                <p className="text-gray-400 font-medium">Waiting for updates...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

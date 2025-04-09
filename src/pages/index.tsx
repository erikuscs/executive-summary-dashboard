
import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const Card = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-xl bg-white dark:bg-gray-800 shadow p-4 text-center">
    <div className="text-sm text-gray-500 dark:text-gray-300">{title}</div>
    <div className="text-2xl font-bold text-blue-800 dark:text-white">{value}</div>
  </div>
);

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/data/data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLastUpdated(new Date().toLocaleDateString());
      })
      .catch(() => setError(true));
  }, []);

  const exportToPDF = () => {
    html2canvas(document.body).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'pt', [canvas.width, canvas.height]);
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save('executive-summary.pdf');
    });
  };

  if (error) return <div className="p-6 text-red-600">Error loading data.</div>;
  if (!data) return <div className="p-6 text-gray-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-8 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Executive Summary</h1>
        <button onClick={exportToPDF} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Export PDF
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total Budget" value={`$${data.kpis.totalBudget.toLocaleString()}`} />
        <Card title="Spent" value={`$${data.kpis.spent.toLocaleString()}`} />
        <Card title="Remaining" value={`$${data.kpis.remaining.toLocaleString()}`} />
        <Card title="Risk Level" value={data.kpis.risk} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">Cost Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.weeklyCost}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="AdjustedTotalCost" stroke="#2563eb" />
              <Line type="monotone" dataKey="TotalWeeklyCost" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">Budget Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
        <h2 className="text-lg font-semibold mb-2">Schedule Tracker</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.schedule}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="task" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Planned" fill="#60a5fa" />
            <Bar dataKey="Actual" fill="#f87171" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Root Cause Matrix</h2>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Issue</th>
              <th className="p-2 text-left">System</th>
              <th className="p-2 text-left">Impact</th>
              <th className="p-2 text-left">Accountability</th>
              <th className="p-2 text-left">Consequence</th>
            </tr>
          </thead>
          <tbody>
            {data.issues.map((issue: any, index: number) => (
              <tr key={index} className="border-t border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-2">{issue.date}</td>
                <td className="p-2">{issue.issue}</td>
                <td className="p-2">{issue.system}</td>
                <td className="p-2">{issue.impact}</td>
                <td className="p-2">{issue.accountability}</td>
                <td className="p-2">{issue.consequence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="pt-10 text-sm text-gray-500 text-center">
        Project Higuera • Last Updated: {lastUpdated}
      </footer>
    </div>
  );
}

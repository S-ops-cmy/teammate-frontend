import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, Calendar, User, FileText, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface DailyEntry {
  id: string;
  memberName: string;
  yesterday: string;
  today: string;
  blockers: string;
  timestamp: string;
}

const TEAM_MEMBERS = [
  'Abhijeet Tigote', 'Lily Sai Talasila', 'Mitali Deshmukh', 'Nivethitha L',
  'Roopa Kandregula', 'Swathilakshmi Soundararaj', 'Vishnu Prabu R',
  'Vijaya lakshmi Sanivarapu', 'Poornima Gannamani', 'Aditya Kumar',
  'Meghana Adepu', 'Surya V', 'Santhoshkumar M', 'Vignesh D',
  'Shivam Kumar Singh', 'Arindam Sarkar', 'Krishna Kumar Padakalla',
  'Kishore Sankeneni', 'Shanu Kumar', 'Chandni G', 'Saikrishna S',
  'Vijaykumar P', 'Swati U Talawar', 'Shreyas Shaha', 'Arun Patange Kumar'
];

const API_URL = 'http://localhost:8080/api/data/DailyTracker';

// --- Export helpers ---
function exportSectionToPDF(sectionId: string, filename: string) {
  const content = document.getElementById(sectionId)?.innerHTML || '';
  const printWindow = window.open('', '_blank');
  printWindow!.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  printWindow!.document.close();
  printWindow!.print();
}

function exportSectionToWord(sectionId: string, filename: string) {
  const content = document.getElementById(sectionId)?.innerHTML || '';
  const blob = new Blob([
    `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'><title>${filename}</title></head>
      <body>${content}</body>
    </html>`
  ], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// --- End Export helpers ---

const DailyTracker: React.FC = () => {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterMember, setFilterMember] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('Never');

  const [formData, setFormData] = useState({
    memberName: '',
    yesterday: '',
    today: '',
    blockers: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Fetch entries from backend (GET)
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      // data.values = [headers, ...rows]
      const [header, ...rows] = data.values;
      const entries = rows.map((row: string[], i: number) => ({
        id: `${row[0]}-${row[4] || i}`,
        memberName: row[0] || "",
        yesterday: row[1] || "",
        today: row[2] || "",
        blockers: row[3] || "",
        timestamp: row[4] || "",
      }));
      setEntries(entries.reverse());
      setLastSync(format(new Date(), "yyyy-MM-dd HH:mm:ss"));
    } catch (err) {
      setEntries([]);
    }
    setIsLoading(false);
  };

  // POST new entry to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = [
      formData.memberName,
      formData.yesterday,
      formData.today,
      formData.blockers,
      new Date().toISOString(),
    ];
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [newEntry] }),
      });
      setFormData({ memberName: '', yesterday: '', today: '', blockers: '' });
      setShowForm(false);
      await loadData();
    } catch (err) {
      alert("Failed to save entry!");
    }
  };

  // CSV Export (for convenience)
  const exportToCSV = () => {
    const headers = ['Member Name', 'Yesterday', 'Today', 'Blockers', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.memberName,
        `"${entry.yesterday.replace(/"/g, '""')}"`,
        `"${entry.today.replace(/"/g, '""')}"`,
        `"${entry.blockers.replace(/"/g, '""')}"`,
        entry.timestamp
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-tracker-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const refreshData = async () => {
    await loadData();
  };

  const filteredEntries = entries.filter(entry => {
    const matchesMember = !filterMember || entry.memberName === filterMember;
    const matchesDate = !filterDate || entry.timestamp.startsWith(filterDate);
    return matchesMember && matchesDate;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-purple-600 text-lg font-semibold">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            PulseCheck - Daily Tracker
          </h1>
          <p className="text-purple-600 mt-3 text-lg">Track daily progress and blockers with style</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full bg-green-500`}></div>
              <span className="text-sm text-gray-600">
                Google Sheets: Connected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Last sync: {lastSync}</span>
              <button
                onClick={refreshData}
                className="p-1 text-purple-600 hover:text-purple-800 rounded-lg hover:bg-purple-50 transition-all"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-2xl hover:from-purple-200 hover:to-indigo-200 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">Export CSV</span>
          </button>
          <button
            onClick={() => exportSectionToPDF('daily-tracker-table', 'PulseCheck')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-2xl border border-red-200"
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">Export PDF</span>
          </button>
          <button
            onClick={() => exportSectionToWord('daily-tracker-table', 'PulseCheck')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-2xl border border-blue-200"
          >
            <FileText className="w-5 h-5" />
            <span className="font-semibold">Export Word</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-purple-100">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Filter className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-lg font-semibold text-purple-900">Filters:</span>
          </div>
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-purple-500" />
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="border-2 border-purple-200 rounded-xl px-4 py-2 text-sm bg-white/80 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
            >
              <option value="">All Members</option>
              {TEAM_MEMBERS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-purple-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border-2 border-purple-200 rounded-xl px-4 py-2 text-sm bg-white/80 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
            />
          </div>
          {(filterMember || filterDate) && (
            <button
              onClick={() => { setFilterMember(''); setFilterDate(''); }}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium px-3 py-1 rounded-lg hover:bg-purple-50 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-3xl mx-4 shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Add Daily Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Member Name *
                </label>
                <select
                  value={formData.memberName}
                  onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                  required
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                >
                  <option value="">Select Member</option>
                  {TEAM_MEMBERS.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  What I did yesterday *
                </label>
                <textarea
                  value={formData.yesterday}
                  onChange={(e) => setFormData({ ...formData, yesterday: e.target.value })}
                  required
                  rows={3}
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  placeholder="Describe what you accomplished yesterday..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  What I'm doing today *
                </label>
                <textarea
                  value={formData.today}
                  onChange={(e) => setFormData({ ...formData, today: e.target.value })}
                  required
                  rows={3}
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  placeholder="Describe your plans for today..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Any blockers?
                </label>
                <textarea
                  value={formData.blockers}
                  onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                  rows={2}
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  placeholder="Any issues or blockers you're facing?"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-purple-600 hover:text-purple-800 font-semibold rounded-2xl hover:bg-purple-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
        <div className="overflow-x-auto" id="daily-tracker-table">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                  Yesterday
                </th>
                <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                  Today
                </th>
                <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                  Blockers
                </th>
                <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-purple-100">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-purple-50/50 transition-all duration-200">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {entry.memberName.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{entry.memberName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-gray-900 max-w-xs" title={entry.yesterday}>
                      {entry.yesterday.length > 100 ? entry.yesterday.substring(0, 100) + '...' : entry.yesterday}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-gray-900 max-w-xs" title={entry.today}>
                      {entry.today.length > 100 ? entry.today.substring(0, 100) + '...' : entry.today}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-gray-900 max-w-xs" title={entry.blockers}>
                      {entry.blockers ? (entry.blockers.length > 50 ? entry.blockers.substring(0, 50) + '...' : entry.blockers) : 'None'}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm text-purple-600 font-medium">
                    {entry.timestamp && !isNaN(new Date(entry.timestamp).getTime())
                      ? format(new Date(entry.timestamp), 'MMM dd, yyyy')
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEntries.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-purple-500 text-lg">No entries found. Add your first daily update!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyTracker;

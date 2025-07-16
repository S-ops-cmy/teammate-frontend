import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Filter, Eye, EyeOff, Download, CheckCircle, FileText } from 'lucide-react';

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
          .fb-card { margin-bottom: 30px; border-radius: 20px; border: 2px solid #e9d5ff; padding: 22px 20px; background: #fafaff; }
          .fb-author { font-size: 18px; font-weight: bold; margin-bottom: 4px;}
          .fb-meta { color: #7c3aed; font-size: 13px; margin-bottom: 12px;}
          .fb-status { display: inline-block; padding: 3px 15px; border-radius: 14px; font-size: 14px; margin-right: 10px;}
          .fb-status-pending { background: #fef3c7; color: #92400e;}
          .fb-status-reviewed { background: #d1fae5; color: #065f46;}
          .fb-feedback { background: #fff; border-radius: 10px; padding: 12px; margin-bottom: 0; font-size: 16px;}
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

const BACKEND_URL = 'http://localhost:8080/api/data/FeedbackWall';

interface FeedbackEntry {
  id: string;
  memberName: string;
  feedback: string;
  anonymous: boolean;
  status: 'Pending' | 'Reviewed';
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

const FeedbackWall: React.FC = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    memberName: '',
    feedback: '',
    anonymous: false
  });

  // Fetch feedback from backend/Google Sheets
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(BACKEND_URL);
        const data = await res.json();
        // Sheet rows: [Member Name, Feedback, Anonymous, Status, Timestamp]
        const values = data.values || [];
        const loaded: FeedbackEntry[] = values.slice(1).map((row: any[], idx: number) => ({
          id: `${row[4] || Date.now()}_${idx}`,
          memberName: row[0] || '',
          feedback: row[1] || '',
          anonymous: (row[2] === 'Yes' || row[2] === 'yes'),
          status: (row[3] === 'Reviewed') ? 'Reviewed' : 'Pending',
          timestamp: row[4] || ''
        }));
        setEntries(loaded.reverse()); // Newest on top
      } catch (err) {
        alert('Failed to load feedbacks from backend.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Submit feedback (POST to backend)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.anonymous && !formData.memberName) {
      alert('Select your name!');
      return;
    }
    if (!formData.feedback) {
      alert('Please provide feedback.');
      return;
    }
    const now = new Date();
    const ts = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.toLocaleTimeString()}`;
    const entry: FeedbackEntry = {
      id: Date.now().toString(),
      memberName: formData.anonymous ? 'Anonymous' : formData.memberName,
      feedback: formData.feedback,
      anonymous: formData.anonymous,
      status: 'Pending',
      timestamp: ts
    };
    // Prepare row for backend (must match your sheet columns)
    const row = [
      entry.memberName,
      entry.feedback,
      entry.anonymous ? 'Yes' : 'No',
      entry.status,
      entry.timestamp
    ];
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });
      setEntries([entry, ...entries]);
      setFormData({ memberName: '', feedback: '', anonymous: false });
      setShowForm(false);
    } catch (err) {
      alert('Failed to submit feedback. Try again.');
    }
  };

  // Status toggling (only on UI, not sheet; can be extended)
  const toggleStatus = (id: string) => {
    setEntries(entries =>
      entries.map(entry =>
        entry.id === id
          ? { ...entry, status: entry.status === 'Pending' ? 'Reviewed' : 'Pending' }
          : entry
      )
    );
  };

  const exportToCSV = () => {
    const headers = ['Member Name', 'Feedback', 'Anonymous', 'Status', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.memberName,
        `"${entry.feedback.replace(/"/g, '""')}"`,
        entry.anonymous ? 'Yes' : 'No',
        entry.status,
        entry.timestamp
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-wall-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter(entry => {
    if (!filterStatus) return true;
    return entry.status === filterStatus;
  });

  const pendingCount = entries.filter(entry => entry.status === 'Pending').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            Feedback Wall
          </h1>
          <p className="text-purple-600 mt-3 text-lg">Share feedback and suggestions with confidence</p>
          <div className="flex space-x-4 mt-4">
            <span className="text-sm bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-2xl font-semibold border border-amber-200">
              {pendingCount} Pending Review
            </span>
            <span className="text-sm bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-4 py-2 rounded-2xl font-semibold border border-emerald-200">
              {entries.length - pendingCount} Reviewed
            </span>
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
            onClick={() => exportSectionToPDF('feedback-list-section', 'FeedbackWall')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-2xl border border-red-200"
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">Export PDF</span>
          </button>
          <button
            onClick={() => exportSectionToWord('feedback-list-section', 'FeedbackWall')}
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
            <span className="font-semibold">Add Feedback</span>
          </button>
        </div>
      </div>

      {/* Filter by status */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-purple-100">
        <div className="flex items-center space-x-6">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Filter className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-lg font-semibold text-purple-900">Filter by status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-2 border-purple-200 rounded-xl px-4 py-2 bg-white/80 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
          >
            <option value="">All Feedback</option>
            <option value="Pending">Pending Review</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-3xl mx-4 shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Share Your Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-2xl border border-purple-200">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.anonymous}
                  onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                  className="w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="anonymous" className="text-sm font-semibold text-purple-700 flex items-center space-x-2">
                  <EyeOff className="w-4 h-4" />
                  <span>Submit anonymously</span>
                </label>
              </div>
              {!formData.anonymous && (
                <div>
                  <label className="block text-sm font-semibold text-purple-700 mb-2">
                    Your Name *
                  </label>
                  <select
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    required={!formData.anonymous}
                    className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  >
                    <option value="">Select Your Name</option>
                    {TEAM_MEMBERS.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Feedback or Suggestion *
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  required
                  rows={6}
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  placeholder="Share your thoughts, suggestions, or feedback..."
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
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback List Section */}
      <div id="feedback-list-section">
        {loading ? (
          <div className="text-center py-16">
            <MessageSquare className="w-20 h-20 text-purple-300 mx-auto mb-6" />
            <p className="text-purple-500 text-xl">Loading feedback...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={`fb-card bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border-l-8 p-8 transition-all duration-300 hover:shadow-2xl ${
                  entry.status === 'Pending'
                    ? 'border-l-amber-400 bg-gradient-to-r from-amber-50/50 to-orange-50/50'
                    : 'border-l-emerald-400 bg-gradient-to-r from-emerald-50/50 to-green-50/50'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      {entry.anonymous ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <EyeOff className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                          {entry.memberName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="fb-author font-bold text-gray-900 text-lg">
                          {entry.anonymous ? 'Anonymous' : entry.memberName}
                        </div>
                        <div className="fb-meta text-sm text-purple-600 font-medium">
                          {entry.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`fb-status px-4 py-2 rounded-2xl text-sm font-bold border-2 ${
                      entry.status === 'Pending'
                        ? 'fb-status-pending bg-amber-100 text-amber-800 border-amber-200'
                        : 'fb-status-reviewed bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {entry.status === 'Pending' ? '⏳ Pending' : '✅ Reviewed'}
                    </span>
                    <button
                      onClick={() => toggleStatus(entry.id)}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all transform hover:scale-105 ${
                        entry.status === 'Pending'
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-lg'
                          : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-lg'
                      }`}
                    >
                      {entry.status === 'Pending' ? (
                        <>
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Mark Reviewed
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 inline mr-1" />
                          Mark Pending
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="fb-feedback text-gray-700 leading-relaxed text-lg bg-white/50 p-6 rounded-2xl border border-purple-100">{entry.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {filteredEntries.length === 0 && !loading && (
          <div className="text-center py-16">
            <MessageSquare className="w-20 h-20 text-purple-300 mx-auto mb-6" />
            <p className="text-purple-500 text-xl">No feedback found. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackWall;

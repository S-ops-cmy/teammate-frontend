import React, { useState, useEffect } from 'react';
import { Plus, Calendar, List, Download, CalendarDays, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, parseISO, isWeekend } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TEAM_MEMBERS = [
  'Abhijeet Tigote', 'Lily Sai Talasila', 'Mitali Deshmukh', 'Nivethitha L', 
  'Roopa Kandregula', 'Swathilakshmi Soundararaj', 'Vishnu Prabu R', 
  'Vijaya lakshmi Sanivarapu', 'Poornima Gannamani', 'Aditya Kumar', 
  'Meghana Adepu', 'Surya V', 'Santhoshkumar M', 'Vignesh D', 
  'Shivam Kumar Singh', 'Arindam Sarkar', 'Krishna Kumar Padakalla', 
  'Kishore Sankeneni', 'Shanu Kumar', 'Chandni G', 'Saikrishna S', 
  'Vijaykumar P', 'Swati U Talawar', 'Shreyas Shaha', 'Arun Patange Kumar'
];

const BACKEND_URL = 'http://localhost:8080/api/data/LeavePlanner';

interface LeaveEntry {
  id: string;
  memberName: string;
  leaveStart: string;
  leaveEnd: string;
  reason: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Declined';
  rowIndex?: number;
}

function getLeaveDays(entry: LeaveEntry): string[] {
  // Return array of yyyy-MM-dd strings (working days only) between start and end
  const start = entry.leaveStart ? parseISO(entry.leaveStart) : null;
  const end = entry.leaveEnd ? parseISO(entry.leaveEnd) : start;
  let days: string[] = [];
  if (!start || !end) return [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (!isWeekend(d)) days.push(format(d, 'yyyy-MM-dd'));
  }
  return days;
}

const LeavePlanner: React.FC = () => {
  const [entries, setEntries] = useState<LeaveEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    memberName: '',
    leaveStart: '',
    leaveEnd: '',
    reason: ''
  });

  // Load leave data from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();
      const values = data.values || [];
      // [Member Name, Leave Start Date, Leave End Date, Reason, Timestamp, Status]
      const loaded: LeaveEntry[] = values.slice(1).map((row: any[], idx: number) => ({
        id: `${row[4] || Date.now()}_${idx}`,
        memberName: row[0] || '',
        leaveStart: row[1] || '',
        leaveEnd: row[2] || '',
        reason: row[3] || '',
        timestamp: row[4] || '',
        status: (row[5] === 'Approved' || row[5] === 'Declined') ? row[5] : 'Pending',
        rowIndex: idx + 2
      }));
      setEntries(loaded.reverse());
    } catch (e) {
      alert('Failed to load leave data from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Add Leave (POST to backend, then reload)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberName || !formData.leaveStart) {
      alert('Member Name and Leave Start Date are required!');
      return;
    }
    const now = new Date();
    const ts = now.toISOString();
    const row = [
      formData.memberName,
      formData.leaveStart,
      formData.leaveEnd || formData.leaveStart,
      formData.reason,
      ts,
      'Pending'
    ];
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });
      setFormData({ memberName: '', leaveStart: '', leaveEnd: '', reason: '' });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      alert('Failed to submit leave request. Try again.');
    }
  };

  // Approve or Decline Leave (PATCH to backend using rowIndex)
  const updateStatus = async (id: string, status: 'Approved' | 'Declined') => {
    const entry = entries.find(e => e.id === id);
    if (!entry || !entry.rowIndex) return;
    try {
      await fetch(`${BACKEND_URL}/${entry.rowIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchData();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('LeavePlanner - Team Leaves', 14, 12);
    autoTable(doc, {
      startY: 18,
      head: [['Member Name', 'Leave Start', 'Leave End', 'All Days', 'Reason', 'Status']],
      body: entries.map(entry => [
        entry.memberName,
        entry.leaveStart ? format(parseISO(entry.leaveStart), 'MMM dd, yyyy') : '',
        entry.leaveEnd ? format(parseISO(entry.leaveEnd), 'MMM dd, yyyy') : '',
        getLeaveDays(entry).join(', '),
        entry.reason,
        entry.status
      ])
    });
    doc.save(`leave-planner-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // For Table: get all individual leave days (for all entries)
  function getAllUpcomingDays(): {entry: LeaveEntry, day: string}[] {
    const today = new Date();
    let all: {entry: LeaveEntry, day: string}[] = [];
    for (const entry of entries) {
      for (const day of getLeaveDays(entry)) {
        if (parseISO(day) >= today) all.push({entry, day});
      }
    }
    return all;
  }

  const getUpcomingLeaves = () => {
    // Groups by leave entry, show start-end and all days
    const today = new Date();
    return entries.filter(entry => {
      const leaveDays = getLeaveDays(entry).map(d => parseISO(d));
      return leaveDays.some(d => d >= today);
    });
  };

  const getCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getLeavesForDate = (date: Date) => {
    // Returns all leave entries which include this date as a working day
    return entries.filter(entry =>
      getLeaveDays(entry).some(d => isSameDay(parseISO(d), date))
    );
  };

  const getStatusBadge = (status: LeaveEntry['status']) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle className="w-4 h-4 inline" /> Approved
          </span>
        );
      case 'Declined':
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold flex items-center gap-1">
            <XCircle className="w-4 h-4 inline" /> Declined
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold flex items-center gap-1">
            ⏳ Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            LeavePlanner
          </h1>
          <p className="text-purple-600 mt-3 text-lg">Plan and track team leave dates with elegance</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex rounded-2xl overflow-hidden border-2 border-purple-200 bg-white/80 shadow-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                viewMode === 'table' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                  : 'bg-white text-purple-700 hover:bg-purple-50'
              }`}
            >
              <List className="w-4 h-4 inline mr-2" />
              Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-3 text-sm font-semibold transition-all ${
                viewMode === 'calendar' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' 
                  : 'bg-white text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Calendar
            </button>
          </div>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-100 to-red-200 text-red-700 rounded-2xl hover:from-red-200 hover:to-red-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">Export PDF</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Leave</span>
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Add Leave Request</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Member Name *
                </label>
                <select
                  value={formData.memberName}
                  onChange={(e) => setFormData({...formData, memberName: e.target.value})}
                  required
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                >
                  <option value="">Select Member</option>
                  {TEAM_MEMBERS.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-purple-700 mb-2">
                    Leave Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.leaveStart}
                    onChange={(e) => setFormData({...formData, leaveStart: e.target.value})}
                    required
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-purple-700 mb-2">
                    Leave End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.leaveEnd}
                    onChange={(e) => setFormData({...formData, leaveEnd: e.target.value})}
                    required
                    min={formData.leaveStart || format(new Date(), 'yyyy-MM-dd')}
                    className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  placeholder="Brief reason for leave..."
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
                  Add Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Clock className="w-20 h-20 text-purple-300 mx-auto mb-6" />
          <p className="text-purple-500 text-xl">Loading leave requests...</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <CalendarDays className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-purple-900">
                Upcoming Leaves ({getUpcomingLeaves().length})
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                    Leave Start
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                    Leave End
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                    All Days
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-bold text-purple-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-purple-100">
                {getUpcomingLeaves().map((entry) => {
                  return (
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
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-purple-700">
                        {entry.leaveStart ? format(parseISO(entry.leaveStart), 'MMM dd, yyyy') : ''}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-purple-700">
                        {entry.leaveEnd ? format(parseISO(entry.leaveEnd), 'MMM dd, yyyy') : ''}
                      </td>
                      <td className="px-8 py-6 text-xs text-gray-900 max-w-xs">
                        {getLeaveDays(entry).join(', ')}
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-900">
                        {entry.reason || 'No reason provided'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">{getStatusBadge(entry.status)}</td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {entry.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(entry.id, 'Approved')}
                              className="px-3 py-1 mr-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold hover:bg-emerald-200 transition-all"
                            >
                              <CheckCircle className="w-4 h-4 inline" /> Approve
                            </button>
                            <button
                              onClick={() => updateStatus(entry.id, 'Declined')}
                              className="px-3 py-1 rounded-xl bg-red-100 text-red-700 font-bold hover:bg-red-200 transition-all"
                            >
                              <XCircle className="w-4 h-4 inline" /> Decline
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {getUpcomingLeaves().length === 0 && (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                <p className="text-purple-500 text-lg">No upcoming leaves scheduled.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-purple-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all font-semibold"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all font-semibold"
              >
                Next
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-bold text-purple-900 bg-purple-50 rounded-xl">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getCalendarDays().map(date => {
              const leaves = getLeavesForDate(date);
              const isCurrentDay = isToday(date);
              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-28 p-3 border-2 rounded-2xl transition-all ${
                    isCurrentDay 
                      ? 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-300 shadow-lg' 
                      : 'bg-white/50 border-purple-100 hover:bg-purple-50/50'
                  }`}
                >
                  <div className={`text-sm font-bold mb-2 ${isCurrentDay ? 'text-purple-700' : 'text-gray-700'}`}>
                    {format(date, 'd')}
                  </div>
                  {leaves.map(leave => (
                    <div
                      key={leave.id}
                      className={`mt-1 px-2 py-1 rounded-lg truncate border font-medium ${
                        leave.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : leave.status === 'Declined'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}
                      title={`${leave.memberName} - ${leave.reason || 'Leave'} [${leave.status}]`}
                    >
                      {leave.memberName}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePlanner;

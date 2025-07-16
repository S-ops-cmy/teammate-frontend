import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Users, Star } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = 'https://teammate-backend.onrender.com/api/data/SkillMatch';

interface SkillEntry {
  id: string;
  memberName: string;
  skills: string;
  availability: 'High' | 'Medium' | 'Low';
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

const SkillMatch: React.FC = () => {
  const [entries, setEntries] = useState<SkillEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    memberName: '',
    skills: '',
    availability: 'Medium' as 'High' | 'Medium' | 'Low'
  });

  // Fetch entries from backend on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(BACKEND_URL);
        const data = await res.json();
        const values = data.values || [];
        const loaded: SkillEntry[] = values.slice(1).map((row: any[], idx: number) => ({
          id: `${row[3] || Date.now()}_${idx}`,
          memberName: row[0] || '',
          skills: row[1] || '',
          availability: row[2] || 'Medium',
          timestamp: row[3] || ''
        }));
        setEntries(loaded.reverse()); // Newest on top
      } catch (err) {
        alert('Failed to load skills from backend.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberName) {
      alert('Select a member!');
      return;
    }
    if (!formData.skills) {
      alert('Enter at least one skill.');
      return;
    }
    const now = new Date();
    const ts = now.toISOString();
    const entry: SkillEntry = {
      id: Date.now().toString(),
      ...formData,
      timestamp: ts
    };
    const row = [
      entry.memberName,
      entry.skills,
      entry.availability,
      entry.timestamp
    ];
    try {
      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] })
      });
      const existingIndex = entries.findIndex(e => e.memberName === entry.memberName);
      let updatedEntries;
      if (existingIndex >= 0) {
        updatedEntries = [...entries];
        updatedEntries[existingIndex] = entry;
      } else {
        updatedEntries = [entry, ...entries];
      }
      setEntries(updatedEntries);
      setFormData({ memberName: '', skills: '', availability: 'Medium' });
      setShowForm(false);
    } catch (err) {
      alert('Failed to save skills. Try again.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Member Name', 'Skills', 'Availability', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.memberName,
        `"${entry.skills.replace(/"/g, '""')}"`,
        entry.availability,
        entry.timestamp
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-match-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // PDF EXPORT
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('SkillMatch - Resource Finder', 14, 12);
    autoTable(doc, {
      startY: 18,
      head: [['Member Name', 'Skills', 'Availability', 'Last Updated']],
      body: filteredEntries.map(entry => [
        entry.memberName,
        entry.skills,
        entry.availability,
        entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : ''
      ])
    });
    doc.save(`skill-match-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      !searchTerm ||
      entry.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.skills.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability =
      !filterAvailability || entry.availability === filterAvailability;
    return matchesSearch && matchesAvailability;
  });

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'High': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'High': return '🟢';
      case 'Medium': return '🟡';
      case 'Low': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            SkillMatch - Resource Finder
          </h1>
          <p className="text-purple-600 mt-3 text-lg">Find team members by skills and availability</p>
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
            <span className="font-semibold">Add/Update Skills</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-purple-100">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by member name or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80 text-lg"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Filter className="w-5 h-5 text-purple-600" />
            </div>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="border-2 border-purple-200 rounded-xl px-4 py-3 bg-white/80 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all"
            >
              <option value="">All Availability</option>
              <option value="High">🟢 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🔴 Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-3xl mx-4 shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Add/Update Skills</h2>
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
                  Skills & Expertise *
                </label>
                <textarea
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  required
                  rows={5}
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  placeholder="List your skills, technologies, and expertise areas..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Availability Level *
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value as 'High' | 'Medium' | 'Low' })}
                  required
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                >
                  <option value="High">🟢 High - Available for new projects</option>
                  <option value="Medium">🟡 Medium - Limited availability</option>
                  <option value="Low">🔴 Low - Currently busy</option>
                </select>
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
                  Save Skills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skills Grid */}
      {loading ? (
        <div className="text-center py-16">
          <Users className="w-20 h-20 text-purple-300 mx-auto mb-6" />
          <p className="text-purple-500 text-xl">Loading skills...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100 p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {entry.memberName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{entry.memberName}</h3>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 ${getAvailabilityColor(entry.availability)} shadow-sm`}>
                  {getAvailabilityIcon(entry.availability)} {entry.availability}
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="w-5 h-5 text-purple-500" />
                  <h4 className="text-sm font-bold text-purple-700 uppercase tracking-wide">Skills & Expertise</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-purple-50/50 p-4 rounded-2xl">{entry.skills}</p>
              </div>
              <div className="text-xs text-purple-500 font-medium bg-purple-50 px-3 py-2 rounded-xl">
                Updated: {new Date(entry.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
      {filteredEntries.length === 0 && !loading && (
        <div className="text-center py-16">
          <Users className="w-20 h-20 text-purple-300 mx-auto mb-6" />
          <p className="text-purple-500 text-xl">No skills found. Add team member skills to get started!</p>
        </div>
      )}
    </div>
  );
};

export default SkillMatch;

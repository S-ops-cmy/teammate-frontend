import React, { useState, useEffect } from 'react';
import { Plus, Vote, Play, Pause, Download, TrendingUp, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Poll {
  id: string;
  question: string;
  options: string[];
  active: boolean;
  timestamp: string;
}

interface PollResponse {
  id: string;
  pollId: string;
  memberName: string;
  selectedOption: string;
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

const POLLS_URL = 'http://localhost:8080/api/data/Polls';
const RESPONSES_URL = 'http://localhost:8080/api/data/PollResponses';

const QuickPolls: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);

  const [createFormData, setCreateFormData] = useState({
    question: '',
    options: ['', '', '', '', '']
  });

  const [voteFormData, setVoteFormData] = useState({
    memberName: '',
    selectedOption: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const pollsRes = await fetch(POLLS_URL);
      const pollsData = await pollsRes.json();
      const pollsSheet: Poll[] = (pollsData.values || []).slice(1).map((row: any[]) => ({
        id: row[0],
        question: row[1],
        options: row.slice(2, 7).filter((opt: string) => opt && opt.trim() !== ''),
        active: row[7] === 'TRUE' || row[7] === true,
        timestamp: row[8] || ''
      }));

      const respRes = await fetch(RESPONSES_URL);
      const respData = await respRes.json();
      const respSheet: PollResponse[] = (respData.values || []).slice(1).map((row: any[]) => ({
        id: row[0],
        pollId: row[1],
        memberName: row[2],
        selectedOption: row[3],
        timestamp: row[4]
      }));

      setPolls(pollsSheet.reverse());
      setResponses(respSheet);
    } catch (err) {
      alert('Failed to fetch poll data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Poll Creation ---
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = createFormData.options.filter(opt => opt.trim() !== '');
    if (!createFormData.question || validOptions.length < 2) {
      alert('Question and at least two options are required.');
      return;
    }
    for (const poll of polls.filter(p => p.active)) {
      await fetch(POLLS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[poll.id, poll.question, ...poll.options, false, poll.timestamp]] })
      });
    }
    const pollId = Date.now().toString();
    const row = [
      pollId,
      createFormData.question,
      ...validOptions,
      ...Array(5 - validOptions.length).fill(''),
      true,
      new Date().toISOString()
    ];
    await fetch(POLLS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
    setShowCreateForm(false);
    setCreateFormData({ question: '', options: ['', '', '', '', ''] });
    fetchData();
  };

  // --- Vote ---
  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoll) return;
    if (!voteFormData.memberName || !voteFormData.selectedOption) {
      alert('Name and Option are required!');
      return;
    }
    if (responses.some(r => r.pollId === selectedPoll.id && r.memberName === voteFormData.memberName)) {
      alert('You have already voted!');
      return;
    }
    const respId = Date.now().toString();
    const respRow = [
      respId,
      selectedPoll.id,
      voteFormData.memberName,
      voteFormData.selectedOption,
      new Date().toISOString()
    ];
    await fetch(RESPONSES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [respRow] })
    });
    setShowVoteForm(false);
    setSelectedPoll(null);
    setVoteFormData({ memberName: '', selectedOption: '' });
    fetchData();
  };

  // --- Activate/Deactivate Poll ---
  const togglePollStatus = async (poll: Poll, status: boolean) => {
    const row = [
      poll.id,
      poll.question,
      ...poll.options,
      ...Array(5 - poll.options.length).fill(''),
      status,
      poll.timestamp
    ];
    await fetch(POLLS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
    fetchData();
  };

  // --- Export to CSV ---
  const exportToCSV = () => {
    const headers = ['Poll Question', 'Option', 'Member Name', 'Vote Date'];
    const csvContent = [
      headers.join(','),
      ...responses.map(response => {
        const poll = polls.find(p => p.id === response.pollId);
        return [
          `"${poll?.question || 'Unknown Poll'}"`,
          `"${response.selectedOption}"`,
          response.memberName,
          response.timestamp
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-polls-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Export to PDF ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('QuickPolls - All Poll Responses', 14, 12);
    autoTable(doc, {
      startY: 18,
      head: [['Poll Question', 'Option', 'Member Name', 'Vote Date']],
      body: responses.map(response => {
        const poll = polls.find(p => p.id === response.pollId);
        return [
          poll?.question || 'Unknown Poll',
          response.selectedOption,
          response.memberName,
          response.timestamp
        ];
      }),
    });
    doc.save(`quick-polls-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Results ---
  const getPollResults = (pollId: string) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return [];
    const pollResponses = responses.filter(r => r.pollId === pollId);
    const totalVotes = pollResponses.length;
    return poll.options.map(option => {
      const votes = pollResponses.filter(r => r.selectedOption === option).length;
      return {
        option,
        votes,
        percentage: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
      };
    });
  };

  const activePoll = polls.find(p => p.active);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
            QuickPolls
          </h1>
          <p className="text-purple-600 mt-3 text-lg">Create polls and collect team opinions in real-time</p>
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
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Create Poll</span>
          </button>
        </div>
      </div>

      {/* Active Poll */}
      {activePoll && (
        <div className="bg-gradient-to-br from-purple-100 via-white to-indigo-100 rounded-3xl p-8 border-2 border-purple-200 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-2xl font-bold text-purple-900">Live Poll</h2>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 bg-white/70 p-4 rounded-2xl border border-purple-200">{activePoll.question}</h3>
            </div>
            <button
              onClick={() => {
                setSelectedPoll(activePoll);
                setShowVoteForm(true);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Vote className="w-5 h-5" />
              <span className="font-semibold">Vote Now</span>
            </button>
          </div>
          <div className="space-y-4">
            {getPollResults(activePoll.id).map((result, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-900 text-lg">{result.option}</span>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-700 font-bold">{result.votes} votes ({result.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-purple-100 rounded-full h-4 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center space-x-2 text-purple-700 bg-white/50 p-3 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">Total votes: {responses.filter(r => r.pollId === activePoll.id).length}</span>
          </div>
        </div>
      )}

      {/* Create Poll Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-3xl mx-4 max-h-96 overflow-y-auto shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Create New Poll</h2>
            <form onSubmit={handleCreatePoll} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Question *
                </label>
                <input
                  type="text"
                  value={createFormData.question}
                  onChange={(e) => setCreateFormData({ ...createFormData, question: e.target.value })}
                  required
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                  placeholder="What would you like to ask the team?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Options (2-5 options)
                </label>
                {createFormData.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...createFormData.options];
                      newOptions[index] = e.target.value;
                      setCreateFormData({ ...createFormData, options: newOptions });
                    }}
                    className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 mb-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                    placeholder={`Option ${index + 1}${index < 2 ? ' (required)' : ' (optional)'}`}
                  />
                ))}
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 text-purple-600 hover:text-purple-800 font-semibold rounded-2xl hover:bg-purple-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vote Form */}
      {showVoteForm && selectedPoll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-purple-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Cast Your Vote</h2>
            <h3 className="text-lg font-semibold text-gray-800 mb-6 bg-purple-50 p-4 rounded-2xl border border-purple-200">{selectedPoll.question}</h3>
            <form onSubmit={handleVote} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Your Name *
                </label>
                <select
                  value={voteFormData.memberName}
                  onChange={(e) => setVoteFormData({ ...voteFormData, memberName: e.target.value })}
                  required
                  className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                >
                  <option value="">Select Your Name</option>
                  {TEAM_MEMBERS.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-3">
                  Choose Your Option *
                </label>
                <div className="space-y-3">
                  {selectedPoll.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-4 p-4 border-2 border-purple-200 rounded-2xl hover:bg-purple-50 cursor-pointer transition-all bg-white/80">
                      <input
                        type="radio"
                        name="selectedOption"
                        value={option}
                        checked={voteFormData.selectedOption === option}
                        onChange={(e) => setVoteFormData({ ...voteFormData, selectedOption: e.target.value })}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 border-2 border-purple-300"
                      />
                      <span className="text-gray-900 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoteForm(false);
                    setSelectedPoll(null);
                  }}
                  className="px-6 py-3 text-purple-600 hover:text-purple-800 font-semibold rounded-2xl hover:bg-purple-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Submit Vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Polls */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-purple-100">
        <div className="px-8 py-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h2 className="text-xl font-bold text-purple-900">All Polls</h2>
        </div>
        {loading ? (
          <div className="text-center py-16">
            <Users className="w-20 h-20 text-purple-300 mx-auto mb-6" />
            <p className="text-purple-500 text-xl">Loading polls...</p>
          </div>
        ) : (
          <div className="divide-y divide-purple-100">
            {polls.map((poll) => (
              <div key={poll.id} className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{poll.question}</h3>
                      <span className={`px-3 py-1 rounded-2xl text-sm font-bold border-2 ${
                        poll.active 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {poll.active ? '🟢 Active' : '⚪ Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-purple-600 font-medium">
                      Created: {poll.timestamp ? new Date(poll.timestamp).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => togglePollStatus(poll, !poll.active)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all transform hover:scale-105 ${
                        poll.active
                          ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 hover:from-red-200 hover:to-red-300 border border-red-200'
                          : 'bg-gradient-to-r from-emerald-100 to-green-200 text-emerald-700 hover:from-emerald-200 hover:to-green-300 border border-emerald-200'
                      }`}
                    >
                      {poll.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{poll.active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {getPollResults(poll.id).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                      <span className="text-sm font-medium text-gray-700">{result.option}</span>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 bg-purple-200 rounded-full h-3 shadow-inner">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-purple-700 font-bold w-16 text-right">{result.votes} votes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {polls.length === 0 && !loading && (
          <div className="text-center py-16">
            <Users className="w-20 h-20 text-purple-300 mx-auto mb-6" />
            <p className="text-purple-500 text-xl">No polls created yet. Create your first poll!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickPolls;

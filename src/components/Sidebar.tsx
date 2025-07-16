import React, { useState } from 'react';
import { 
  CheckCircle, 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  PieChart,
  Sparkles,
  Settings
} from 'lucide-react';
import GoogleSheetsSetup from './GoogleSheetsSetup';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [showGoogleSheetsSetup, setShowGoogleSheetsSetup] = useState(false);

  const menuItems = [
    { id: 'daily-tracker', label: 'PulseCheck', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'skill-match', label: 'SkillMatch', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'leave-planner', label: 'LeavePlanner', icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'feedback-wall', label: 'Feedback Wall', icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'quick-polls', label: 'QuickPolls', icon: BarChart3, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    //{ id: 'manager-dashboard', label: 'Dashboard', icon: PieChart, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  ];

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-72 bg-white/80 backdrop-blur-xl border-r border-purple-100 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                TeamMate Hub
              </h1>
              <p className="text-sm text-purple-600 font-medium">DXC Team Productivity</p>
            </div>
          </div>
          
          <nav className="space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-4 px-5 py-4 text-left rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  activeTab === item.id
                    ? `bg-gradient-to-r from-purple-100 to-indigo-100 border-l-4 border-purple-500 text-gray-900 shadow-lg ${item.bgColor}`
                    : 'text-gray-600 hover:bg-purple-50 hover:text-gray-900 hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-xl ${activeTab === item.id ? item.bgColor : 'bg-gray-50'}`}>
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? item.color : 'text-gray-400'}`} />
                </div>
                <span className="font-semibold text-base">{item.label}</span>
              </button>
            ))}
          </nav>
          
          {/* Google Sheets Setup Button */}
          <div className="mt-8">
            <button
              onClick={() => setShowGoogleSheetsSetup(true)}
              className="w-full flex items-center space-x-4 px-5 py-4 text-left rounded-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 border border-green-200"
            >
              <div className="p-2 rounded-xl bg-green-50">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-semibold text-base text-green-800">Google Sheets Setup</span>
            </button>
          </div>
          
          <div className="mt-12 p-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl">
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-purple-900 mb-2">DXC Excellence</h3>
              <p className="text-sm text-purple-700">Empowering teams with seamless productivity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Setup Modal */}
      {showGoogleSheetsSetup && (
        <GoogleSheetsSetup onClose={() => setShowGoogleSheetsSetup(false)} />
      )}
    </>
  );
};

export default Sidebar;
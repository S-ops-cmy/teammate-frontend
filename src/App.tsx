import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DailyTracker from './components/DailyTracker';
import SkillMatch from './components/SkillMatch';
import LeavePlanner from './components/LeavePlanner';
import FeedbackWall from './components/FeedbackWall';
import QuickPolls from './components/QuickPolls';
import DataSyncNotification from './components/DataSyncNotification';
import { googleSheetsService } from './utils/googleSheets';

function App() {
  const [activeTab, setActiveTab] = useState('daily-tracker');
  const [showSyncNotification, setShowSyncNotification] = useState(false);

  useEffect(() => {
    // Check for data sync opportunities periodically
    const checkForUpdates = () => {
      const lastSync = localStorage.getItem('lastGoogleSheetsSync');
      const now = new Date().getTime();
      const lastSyncTime = lastSync ? new Date(lastSync).getTime() : 0;
      const timeDiff = now - lastSyncTime;
      
      // Show sync notification if it's been more than 5 minutes since last sync
      if (timeDiff > 5 * 60 * 1000) {
        setShowSyncNotification(true);
      }
    };

    // Check on app load and then every 5 minutes
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDataSync = async () => {
    try {
      // Sync all data types
      await Promise.all([
        googleSheetsService.syncData('DailyTracker'),
        googleSheetsService.syncData('SkillMatch'),
        googleSheetsService.syncData('LeavePlanner'),
        googleSheetsService.syncData('FeedbackWall'),
        googleSheetsService.syncData('Polls'),
        googleSheetsService.syncData('PollResponses')
      ]);
      
      // Trigger a page refresh to update all components
      window.location.reload();
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'daily-tracker':
        return <DailyTracker />;
      case 'skill-match':
        return <SkillMatch />;
      case 'leave-planner':
        return <LeavePlanner />;
      case 'feedback-wall':
        return <FeedbackWall />;
      case 'quick-polls':
        return <QuickPolls />;
      default:
        return <DailyTracker />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {renderActiveComponent()}
        </div>
      </main>
      
      <DataSyncNotification
        isVisible={showSyncNotification}
        onClose={() => setShowSyncNotification(false)}
        onSync={handleDataSync}
      />
    </div>
  );
}

export default App;
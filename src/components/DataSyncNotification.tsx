import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface DataSyncNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  onSync: () => void;
}

const DataSyncNotification: React.FC<DataSyncNotificationProps> = ({ isVisible, onClose, onSync }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    await onSync();
    setIsLoading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-200 max-w-md z-50">
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-blue-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-2">Data Sync Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            New data detected in Google Sheets. Would you like to sync and get the latest updates?
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleSync}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Syncing...' : 'Sync Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-all"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default DataSyncNotification;
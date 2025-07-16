import React, { useState } from 'react';
import { Settings, CheckCircle, AlertCircle, ExternalLink, Copy, Download, Info, Share } from 'lucide-react';
import { googleSheetsService } from '../utils/googleSheets';

interface GoogleSheetsSetupProps {
  onClose: () => void;
}

const GoogleSheetsSetup: React.FC<GoogleSheetsSetupProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [sheetUrl, setSheetUrl] = useState('');

  const generateGoogleSheetTemplate = () => {
    const templateUrl = `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/copy`;
    window.open(templateUrl, '_blank');
  };

  const copySheetStructure = () => {
    const structure = `
DailyTracker Tab:
Member Name | Yesterday | Today | Blockers | Timestamp

SkillMatch Tab:
Member Name | Skills | Availability | Timestamp

LeavePlanner Tab:
Member Name | Leave Date | Reason | Timestamp

FeedbackWall Tab:
Member Name | Feedback | Anonymous | Status | Timestamp

Polls Tab:
Question | Options | Active | Timestamp

PollResponses Tab:
Poll ID | Member Name | Selected Option | Timestamp
    `;
    navigator.clipboard.writeText(structure);
    alert('Sheet structure copied to clipboard!');
  };

  const copyServiceAccountEmail = () => {
    const email = 'sheets-access@teammate-hub-sheets-api.iam.gserviceaccount.com';
    navigator.clipboard.writeText(email);
    alert('Service account email copied to clipboard!');
  };

  const handleSaveSheetUrl = () => {
    if (sheetUrl) {
      // Update the Google Sheets service with the new configuration
      googleSheetsService.updateConfig(sheetUrl);
      
      localStorage.setItem('googleSheetUrl', sheetUrl);
      localStorage.setItem('googleSheetsConfigured', 'true');
      
      alert('Google Sheet URL saved! The app will now sync with your sheet automatically.');
      onClose();
    }
  };

  const openYourSheet = () => {
    const yourSheetUrl = 'https://docs.google.com/spreadsheets/d/1djA1UYrnfW0cWkBO-mkdHD12pynoxhiXFIURRv2REaQ/edit';
    window.open(yourSheetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-900">Google Sheets Integration Setup</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center space-x-4 mb-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= stepNum ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && <div className="w-12 h-1 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-purple-900">Step 1: Use Your Existing Sheet</h3>
              
              <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-semibold">Great News! Your Sheet is Ready</span>
                </div>
                <p className="text-green-700 text-sm mb-4">
                  You already have a Google Sheet set up with the service account configured. The app will automatically sync with your existing sheet.
                </p>
                <button
                  onClick={openYourSheet}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Your Sheet</span>
                </button>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-semibold">Service Account Details</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-blue-700 text-sm font-medium">Service Account Email:</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-blue-100 px-2 py-1 rounded">sheets-access@teammate-hub-sheets-api.iam.gserviceaccount.com</code>
                      <button
                        onClick={copyServiceAccountEmail}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Copy email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-700 text-sm font-medium">Your Account:</p>
                    <code className="text-xs bg-blue-100 px-2 py-1 rounded">shivam.singh41132@gmail.com</code>
                  </div>
                  <div>
                    <p className="text-blue-700 text-sm font-medium">API Key Status:</p>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active (Expires: Jun 27, 2025)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-purple-900">Step 2: Verify Sheet Structure</h3>
              
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-800 font-semibold">Required Sheet Tabs</span>
                </div>
                <p className="text-amber-700 text-sm">
                  Make sure your Google Sheet has these tabs with the exact names:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">DailyTracker Tab:</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    Member Name | Yesterday | Today | Blockers | Timestamp
                  </code>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">SkillMatch Tab:</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    Member Name | Skills | Availability | Timestamp
                  </code>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">LeavePlanner Tab:</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    Member Name | Leave Date | Reason | Timestamp
                  </code>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">FeedbackWall Tab:</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    Member Name | Feedback | Anonymous | Status | Timestamp
                  </code>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Polls Tab:</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    Question | Options | Active | Timestamp
                  </code>
                </div>

                <div className="bg-white p-4 rounded-xl border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">PollResponses Tab:</h4>
                  <code className="text-xs bg-gray-100 p-2 rounded block">
                    Poll ID | Member Name | Selected Option | Timestamp
                  </code>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-purple-600 hover:text-purple-800 font-semibold rounded-2xl hover:bg-purple-50 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-purple-900">Step 3: Confirm Sheet URL</h3>
              
              <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-semibold">Almost Done!</span>
                </div>
                <p className="text-green-700 text-sm">
                  Confirm your Google Sheet URL below. The app will automatically sync data with your sheet.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-700 mb-2">
                    Google Sheet URL
                  </label>
                  <input
                    type="url"
                    value={sheetUrl || 'https://docs.google.com/spreadsheets/d/1djA1UYrnfW0cWkBO-mkdHD12pynoxhiXFIURRv2REaQ/edit'}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full border-2 border-purple-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white/80"
                    placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                  />
                  <p className="text-xs text-purple-600 mt-1">
                    This should be your existing Google Sheet URL
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl">
                  <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                    <li>Data is automatically synced between the app and your Google Sheet</li>
                    <li>Changes in the sheet will be reflected in the app</li>
                    <li>New entries from the app will be copied to your sheet</li>
                    <li>The service account has editor access to your sheet</li>
                    <li>All team members can access the same data</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Share className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-800 font-semibold">Sharing Verification</span>
                  </div>
                  <p className="text-purple-700 text-sm mb-2">
                    Make sure your sheet is shared with the service account:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-purple-100 px-2 py-1 rounded">sheets-access@teammate-hub-sheets-api.iam.gserviceaccount.com</code>
                    <span className="text-xs text-purple-600">(Editor access)</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-purple-600 hover:text-purple-800 font-semibold rounded-2xl hover:bg-purple-50 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={handleSaveSheetUrl}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsSetup;
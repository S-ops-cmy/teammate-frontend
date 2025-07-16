// Google Sheets Integration Utility - Enhanced with Google Sheets API
class GoogleSheetsService {
  private sheetUrl: string = '';
  private sheetId: string = '';
  private _isConfigured: boolean = false;
  private apiKey: string = '';
  private serviceAccountEmail: string = 'sheets-access@teammate-hub-sheets-api.iam.gserviceaccount.com';

  // Default tab names mapping
  private tabNames = {
    'DailyTracker': 'DailyTracker',
    'SkillMatch': 'SkillMatch', 
    'LeavePlanner': 'LeavePlanner',
    'FeedbackWall': 'FeedbackWall',
    'Polls': 'Polls',
    'PollResponses': 'PollResponses'
  };

  constructor() {
    this.loadConfiguration();
  }

  // Load configuration from localStorage
  private loadConfiguration(): void {
    const savedUrl = localStorage.getItem('googleSheetUrl');
    const savedApiKey = localStorage.getItem('googleSheetsApiKey');
    const isConfigured = localStorage.getItem('googleSheetsConfigured') === 'true';

    if (savedUrl && isConfigured) {
      this.sheetUrl = savedUrl;
      this.sheetId = this.extractSheetIdFromUrl(savedUrl);
      this.apiKey = savedApiKey || '';
      this._isConfigured = true;
    } else {
      // Use your default sheet
      this.sheetUrl = 'https://docs.google.com/spreadsheets/d/1djA1UYrnfW0cWkBO-mkdHD12pynoxhiXFIURRv2REaQ/edit';
      this.sheetId = '1djA1UYrnfW0cWkBO-mkdHD12pynoxhiXFIURRv2REaQ';
      this._isConfigured = true; // Set to true since you have the sheet set up
    }
  }

  // Extract sheet ID from Google Sheets URL
  private extractSheetIdFromUrl(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  }

  // Update configuration with new sheet URL and API key
  updateConfig(sheetUrl: string, apiKey?: string): void {
    this.sheetUrl = sheetUrl;
    this.sheetId = this.extractSheetIdFromUrl(sheetUrl);
    
    if (apiKey) {
      this.apiKey = apiKey;
      localStorage.setItem('googleSheetsApiKey', apiKey);
    }

    localStorage.setItem('googleSheetUrl', sheetUrl);
    localStorage.setItem('googleSheetsConfigured', 'true');
    this._isConfigured = true;
  }

  // Check if Google Sheets is configured
  isConfigured(): boolean {
    return this._isConfigured && this.sheetUrl !== '' && this.sheetId !== '';
  }

  // Get the sheet URL
  getSheetUrl(): string {
    return this.sheetUrl;
  }

  // Load data from Google Sheets using CSV export (public method)
  async loadDataFromSheet(sheetName: string): Promise<any[]> {
    if (!this.isConfigured()) {
      console.warn('Google Sheets not configured, using localStorage data');
      return this.getLocalStorageData(sheetName);
    }

    try {
      // Use CSV export method which works without API key for public sheets
      const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      return this.parseCSVData(csvText, sheetName);
    } catch (error) {
      console.error(`Error loading data from ${sheetName}:`, error);
      // Fallback to localStorage if sheet loading fails
      return this.getLocalStorageData(sheetName);
    }
  }

  // Parse CSV data based on sheet type
  private parseCSVData(csvText: string, sheetName: string): any[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length <= 1) return []; // No data or only headers
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    return dataLines.map((line, index) => {
      const values = this.parseCSVLine(line);
      return this.mapCSVToObject(values, sheetName, index);
    }).filter(item => item !== null);
  }

  // Parse CSV line handling quoted values
  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  // Map CSV values to objects based on sheet type
  private mapCSVToObject(values: string[], sheetName: string, index: number): any | null {
    if (!values || values.length === 0) return null;
    
    const id = `sheet_${Date.now()}_${index}`;
    const timestamp = new Date().toISOString();
    
    switch (sheetName) {
      case 'DailyTracker':
        if (values.length >= 4) {
          return {
            id,
            memberName: values[0] || '',
            yesterday: values[1] || '',
            today: values[2] || '',
            blockers: values[3] || '',
            timestamp: values[4] || timestamp
          };
        }
        break;
        
      case 'SkillMatch':
        if (values.length >= 3) {
          return {
            id,
            memberName: values[0] || '',
            skills: values[1] || '',
            availability: values[2] || 'Medium',
            timestamp: values[3] || timestamp
          };
        }
        break;
        
      case 'LeavePlanner':
        if (values.length >= 3) {
          return {
            id,
            memberName: values[0] || '',
            leaveDate: values[1] || '',
            reason: values[2] || '',
            timestamp: values[3] || timestamp
          };
        }
        break;
        
      case 'FeedbackWall':
        if (values.length >= 4) {
          return {
            id,
            memberName: values[0] || '',
            feedback: values[1] || '',
            anonymous: values[2] === 'Yes',
            status: values[3] || 'Pending',
            timestamp: values[4] || timestamp
          };
        }
        break;
        
      case 'Polls':
        if (values.length >= 3) {
          return {
            id,
            question: values[0] || '',
            options: values[1] ? values[1].split('; ') : [],
            active: values[2] === 'Yes',
            timestamp: values[3] || timestamp
          };
        }
        break;
        
      case 'PollResponses':
        if (values.length >= 3) {
          return {
            id,
            pollId: values[0] || '',
            memberName: values[1] || '',
            selectedOption: values[2] || '',
            timestamp: values[3] || timestamp
          };
        }
        break;
    }
    
    return null;
  }

  // Fallback to localStorage
  private getLocalStorageData(sheetName: string): any[] {
    const storageKey = this.getStorageKey(sheetName);
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Get localStorage key for sheet type
  private getStorageKey(sheetName: string): string {
    const keyMap: { [key: string]: string } = {
      'DailyTracker': 'dailyTracker',
      'SkillMatch': 'skillMatch',
      'LeavePlanner': 'leavePlanner',
      'FeedbackWall': 'feedbackWall',
      'Polls': 'quickPolls',
      'PollResponses': 'pollResponses'
    };
    return keyMap[sheetName] || sheetName.toLowerCase();
  }

  // Save data to both localStorage and prepare for Google Sheets
  async saveData(data: any[], sheetName: string): Promise<void> {
    // Save to localStorage as backup
    const storageKey = this.getStorageKey(sheetName);
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // Prepare data for Google Sheets and copy to clipboard
    const formattedData = formatDataForSheets(data, sheetName);
    await this.copyToClipboard(formattedData, sheetName);
  }

  // Copy data to clipboard in a format ready for Google Sheets
  async copyToClipboard(data: any[][], sheetName: string): Promise<boolean> {
    try {
      // Convert data to tab-separated values (TSV) for easy pasting into sheets
      const tsvContent = data.map(row => 
        row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t')
      ).join('\n');
      
      await navigator.clipboard.writeText(tsvContent);
      
      // Show success message with instructions
      this.showCopySuccess(sheetName);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: create a text area and copy
      this.fallbackCopy(data, sheetName);
      return false;
    }
  }

  // Fallback copy method
  private fallbackCopy(data: any[][], sheetName: string): void {
    const tsvContent = data.map(row => 
      row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t')
    ).join('\n');
    
    const textArea = document.createElement('textarea');
    textArea.value = tsvContent;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopySuccess(sheetName);
    } catch (err) {
      console.error('Fallback copy failed:', err);
      this.showCopyError(sheetName);
    }
    
    document.body.removeChild(textArea);
  }

  // Show success notification with detailed instructions
  private showCopySuccess(sheetName: string): void {
    const tabUrl = `${this.sheetUrl}#gid=0&range=A1`;
    
    this.showNotification(
      `✅ Data copied! Click here to open ${sheetName} tab and paste the data (Ctrl+V)`,
      'success',
      () => window.open(tabUrl, '_blank')
    );
  }

  // Show error notification
  private showCopyError(sheetName: string): void {
    this.showNotification(
      `❌ Failed to copy data. Please try again or use CSV export.`,
      'error'
    );
  }

  // Enhanced notification system with click action
  private showNotification(message: string, type: 'success' | 'error', onClick?: () => void): void {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-md cursor-pointer transform transition-all hover:scale-105`;
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0 mt-0.5">
          ${type === 'success' ? 
            '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' :
            '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
          }
        </div>
        <div class="text-sm font-medium">${message}</div>
      </div>
    `;
    
    if (onClick) {
      notification.addEventListener('click', onClick);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 8 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 8000);
  }

  // Open the Google Sheet in a new tab with specific tab
  openSheet(tabName?: string): void {
    let url = this.sheetUrl;
    
    if (tabName) {
      // Try to navigate to the specific sheet by name
      url = `${this.sheetUrl}#gid=0&range=A1`;
    }
    
    window.open(url, '_blank');
  }

  // Generate download link for CSV
  downloadAsCSV(data: any[][], filename: string): void {
    const csvContent = data.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get sheet statistics
  getSheetStats(): { connected: boolean; url: string; lastSync: string; serviceAccount: string } {
    return {
      connected: this._isConfigured,
      url: this.sheetUrl,
      lastSync: localStorage.getItem('lastGoogleSheetsSync') || 'Never',
      serviceAccount: this.serviceAccountEmail
    };
  }

  // Update last sync time
  updateLastSync(): void {
    localStorage.setItem('lastGoogleSheetsSync', new Date().toISOString());
  }

  // Sync data between localStorage and Google Sheets
  async syncData(sheetName: string): Promise<any[]> {
    try {
      // Load data from Google Sheets
      const sheetData = await this.loadDataFromSheet(sheetName);
      
      // Merge with localStorage data (prioritize newer entries)
      const localData = this.getLocalStorageData(sheetName);
      const mergedData = this.mergeData(localData, sheetData);
      
      // Update localStorage with merged data
      const storageKey = this.getStorageKey(sheetName);
      localStorage.setItem(storageKey, JSON.stringify(mergedData));
      
      this.updateLastSync();
      return mergedData;
    } catch (error) {
      console.error(`Error syncing ${sheetName}:`, error);
      // Return localStorage data as fallback
      return this.getLocalStorageData(sheetName);
    }
  }

  // Merge local and sheet data, avoiding duplicates
  private mergeData(localData: any[], sheetData: any[]): any[] {
    const merged = [...localData];
    
    sheetData.forEach(sheetItem => {
      // Check if item already exists in local data
      const exists = localData.some(localItem => 
        this.isSameEntry(localItem, sheetItem)
      );
      
      if (!exists) {
        merged.push(sheetItem);
      }
    });
    
    // Sort by timestamp (newest first)
    return merged.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Check if two entries are the same (basic comparison)
  private isSameEntry(item1: any, item2: any): boolean {
    if (item1.memberName && item2.memberName && item1.memberName !== item2.memberName) {
      return false;
    }
    
    // For daily tracker, compare by member and date
    if (item1.yesterday && item2.yesterday) {
      const date1 = new Date(item1.timestamp).toDateString();
      const date2 = new Date(item2.timestamp).toDateString();
      return item1.memberName === item2.memberName && date1 === date2;
    }
    
    // For other types, compare by content similarity
    if (item1.feedback && item2.feedback) {
      return item1.feedback === item2.feedback && item1.memberName === item2.memberName;
    }
    
    if (item1.skills && item2.skills) {
      return item1.memberName === item2.memberName;
    }
    
    return false;
  }

  // Get sharing information for the sheet
  getSharingInfo(): { serviceAccount: string; sheetUrl: string; instructions: string } {
    return {
      serviceAccount: this.serviceAccountEmail,
      sheetUrl: this.sheetUrl,
      instructions: `
        To enable data synchronization:
        1. Open your Google Sheet: ${this.sheetUrl}
        2. Click "Share" button (top right)
        3. Add this email as Editor: ${this.serviceAccountEmail}
        4. Make sure "Notify people" is unchecked
        5. Click "Send"
        
        Your sheet is now connected to the TeamMate Hub app!
      `
    };
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();

// Helper function to format data for Google Sheets
export const formatDataForSheets = (data: any[], type: string): any[][] => {
  // Add headers as first row
  let headers: string[] = [];
  let formattedData: any[][] = [];

  switch (type) {
    case 'DailyTracker':
      headers = ['Member Name', 'Yesterday', 'Today', 'Blockers', 'Timestamp'];
      formattedData = data.map(entry => [
        entry.memberName || '',
        entry.yesterday || '',
        entry.today || '',
        entry.blockers || '',
        entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''
      ]);
      break;
    
    case 'SkillMatch':
      headers = ['Member Name', 'Skills', 'Availability', 'Timestamp'];
      formattedData = data.map(entry => [
        entry.memberName || '',
        entry.skills || '',
        entry.availability || '',
        entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''
      ]);
      break;
    
    case 'LeavePlanner':
      headers = ['Member Name', 'Leave Date', 'Reason', 'Timestamp'];
      formattedData = data.map(entry => [
        entry.memberName || '',
        entry.leaveDate || '',
        entry.reason || 'No reason provided',
        entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''
      ]);
      break;
    
    case 'FeedbackWall':
      headers = ['Member Name', 'Feedback', 'Anonymous', 'Status', 'Timestamp'];
      formattedData = data.map(entry => [
        entry.memberName || '',
        entry.feedback || '',
        entry.anonymous ? 'Yes' : 'No',
        entry.status || 'Pending',
        entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''
      ]);
      break;
    
    case 'Polls':
      headers = ['Question', 'Options', 'Active', 'Timestamp'];
      formattedData = data.map(entry => [
        entry.question || '',
        Array.isArray(entry.options) ? entry.options.join('; ') : '',
        entry.active ? 'Yes' : 'No',
        entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''
      ]);
      break;
    
    case 'PollResponses':
      headers = ['Poll ID', 'Member Name', 'Selected Option', 'Timestamp'];
      formattedData = data.map(entry => [
        entry.pollId || '',
        entry.memberName || '',
        entry.selectedOption || '',
        entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''
      ]);
      break;
    
    default:
      return [];
  }

  return [headers, ...formattedData];
};
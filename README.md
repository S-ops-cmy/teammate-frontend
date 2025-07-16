# TeamMate Hub - Team Productivity Platform

A comprehensive team productivity application built with React, TypeScript, and Tailwind CSS, designed to streamline team communication, planning, and collaboration with a beautiful light purple DXC-themed professional layout.

## 🌟 Features

### 1. **PulseCheck - Daily Tracker**
- Daily standup entries with yesterday's work, today's plans, and blockers
- Filterable entries by team member and date
- CSV export functionality with enhanced formatting
- Real-time progress tracking
- Professional light purple themed UI
- **Google Sheets Integration**: Automatic sync to DailyTracker tab

### 2. **SkillMatch - Resource Finder**
- Team member skills and expertise database
- Availability status tracking (High/Medium/Low)
- Searchable skills matrix with advanced filtering
- CSV export for skills data
- Team resource allocation insights
- **Google Sheets Integration**: Automatic sync to SkillMatch tab

### 3. **LeavePlanner**
- Leave request management with enhanced forms
- Calendar and table view options
- CSV export for leave data
- Upcoming leave notifications
- Team availability overview
- **Google Sheets Integration**: Automatic sync to LeavePlanner tab

### 4. **Feedback Wall**
- Anonymous and named feedback submission
- Review status tracking (Pending/Reviewed)
- CSV export for feedback analysis
- Team suggestion collection
- Management review workflow
- **Google Sheets Integration**: Automatic sync to FeedbackWall tab

### 5. **QuickPolls**
- Real-time team polling system
- Multiple choice questions (2-5 options)
- Live results with vote counts and percentages
- CSV export for poll data and responses
- Poll activation/deactivation controls
- **Google Sheets Integration**: Automatic sync to Polls and PollResponses tabs

### 6. **Manager Dashboard**
- Comprehensive team analytics
- Daily submission tracking
- Skills availability matrix
- Leave planning overview
- Feedback status monitoring
- Poll participation metrics
- **Enhanced Export Options:**
  - Print/PDF export for comprehensive reports
  - Microsoft Word document export
  - Detailed analytics and insights

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS with custom light purple DXC theme
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Data Storage**: Local Storage + Google Sheets Integration
- **Google Sheets API**: Real-time synchronization

## 🎨 Design Features

- **Light Purple DXC Theme**: Professional gradient backgrounds and modern UI
- **Responsive Design**: Mobile-first approach with breakpoints
- **Modern UI**: Clean cards, smooth transitions, and micro-interactions
- **Enhanced Visual Elements**: Backdrop blur effects, gradient borders, and shadows
- **Accessibility**: Proper contrast ratios and keyboard navigation
- **Premium Feel**: Apple-level design aesthetics with attention to detail

## 📊 Data Management

### Google Sheets Integration
Each feature automatically syncs data to dedicated Google Sheets tabs:
- `DailyTracker` - Daily standup entries
- `SkillMatch` - Team skills and availability
- `LeavePlanner` - Leave requests and dates
- `FeedbackWall` - Team feedback and suggestions
- `Polls` - Poll questions and settings
- `PollResponses` - Individual poll responses

### Local Storage Backup
All data is automatically saved to browser local storage for offline access and instant loading.

### Export Capabilities
- **CSV Export**: Available for all modules with proper formatting
- **PDF/Print**: Manager Dashboard comprehensive reports
- **Word Documents**: Detailed analytics export for management

## 🔧 Installation & Setup

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
.shivamarindamteammatehub/
├── config.json
└── prompt

src/
├── components/
│   ├── Sidebar.tsx
│   ├── DailyTracker.tsx
│   ├── SkillMatch.tsx
│   ├── LeavePlanner.tsx
│   ├── FeedbackWall.tsx
│   ├── QuickPolls.tsx
│   ├── ManagerDashboard.tsx
│   └── GoogleSheetsSetup.tsx
├── utils/
│   └── googleSheets.ts
├── App.tsx
└── main.tsx
```

## 👥 Team Members

The application supports the following DXC team members:
- **TPF Automation**: Abhijeet Tigote, Santhoshkumar M, Saikrishna S
- **TPF Development Tools**: Lily Sai Talasila, Mitali Deshmukh, Nivethitha L, Swathilakshmi Soundararaj, Vishnu Prabu R, Vijaya lakshmi Sanivarapu, Poornima Gannamani, Aditya Kumar, Meghana Adepu, Surya V, Chandni G, Shreyas Shaha
- **TPF VM Capability**: Roopa Kandregula, Vignesh D, Arun Patange Kumar
- **TPF Database/TPF TPPA**: Shivam Kumar Singh, Vijaykumar P
- **TPF AIROE**: Krishna Kumar Padakalla
- **TPF Communications**: Kishore Sankeneni, Shanu Kumar, Swati U Talawar

**Team Manager**: Reetika S (excluded from member lists as per management structure)

## 📱 Usage

### For Team Members:
1. **Daily Updates**: Submit daily progress via PulseCheck
2. **Skills Management**: Update your skills and availability in SkillMatch
3. **Leave Planning**: Request leaves through LeavePlanner
4. **Feedback**: Share thoughts via Feedback Wall (anonymous option available)
5. **Polls**: Participate in team polls and see live results

### For Managers:
1. **Dashboard**: Monitor team activity and metrics
2. **Analytics**: View submission rates, leave patterns, and team availability
3. **Feedback Review**: Process and respond to team feedback
4. **Poll Management**: Create and manage team polls
5. **Export Data**: Download CSV reports, print/PDF, or Word documents for external analysis
6. **Google Sheets**: Access real-time data in connected Google Sheets

## 🔐 Data Privacy

- All sensitive data is stored securely
- Anonymous feedback options available
- Local storage for offline functionality
- Google Sheets integration for team transparency
- Service account authentication for secure API access

## 🛠️ Development

### Key Components
- **Sidebar**: Enhanced navigation with light purple theme and Google Sheets setup
- **Feature Components**: Individual productivity tools with modern UI and Google Sheets sync
- **Manager Dashboard**: Comprehensive analytics with export capabilities
- **Google Sheets Service**: Utility for seamless data synchronization
- **Responsive Design**: Mobile and desktop optimized

### Design System
- **Color Palette**: Light purple gradients with professional accents
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Components**: Reusable UI elements with hover states and animations

## 🔄 Google Sheets Integration Setup

### Step 1: Create Google Sheets API Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create credentials (Service Account)
5. Download the JSON key file

### Step 2: Set Up Google Sheet
1. Create a new Google Sheet
2. Create tabs for each module:
   - `DailyTracker`
   - `SkillMatch`
   - `LeavePlanner`
   - `FeedbackWall`
   - `Polls`
   - `PollResponses`

### Step 3: Configure Application
1. Click "Google Sheets Setup" in the sidebar
2. Follow the step-by-step wizard
3. Enter your API credentials
4. Test the connection
5. Start syncing data automatically!

### Step 4: Share Sheet
Share your Google Sheet with the service account email address with Editor permissions.

## 📞 Support

For questions, issues, or feature requests, please contact the development team or create an issue in the project repository.

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEETS_SHEET_ID=your_sheet_id_here
VITE_GOOGLE_CLIENT_EMAIL=your_service_account_email_here
VITE_GOOGLE_PRIVATE_KEY=your_private_key_here
```

---

**TeamMate Hub** - Empowering DXC teams with seamless productivity tools, elegant design, and real-time Google Sheets integration.

*Built with ❤️ by Shivam & Arindam Team for DXC Technology*
# BuildBuddy Project Setup Instructions

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup Steps

1. **Reset the Database (IMPORTANT)**
   ```bash
   cd C:\BuildBuddy\backend
   npm run reset-db
   ```
   This will delete the old corrupted database and create a fresh one with all tables.

2. **Start the Backend Server**
   ```bash
   cd C:\BuildBuddy\backend
   npm start
   ```
   The backend will run on http://localhost:5000

3. **Start the Frontend Development Server** (in a new terminal)
   ```bash
   cd C:\BuildBuddy\frontend
   npm start
   ```
   The frontend will run on http://localhost:3000

### What Was Fixed

#### 🔧 Database Initialization Issue
- **Problem**: Database tables were not being created properly due to async/await issues
- **Solution**: Rewrote the `initializeDatabase()` function to properly await each table creation
- **Result**: All tables (users, projects, project_bids, notifications, etc.) will now be created correctly

#### 🔧 JWT Authentication Issues
- **Problem**: JWT tokens contained `userType` and `userId` but backend routes checked for `role` and `id`
- **Solution**: Updated all backend routes to use correct JWT token fields
- **Result**: Customers can now create projects and architects can submit bids without authentication errors

### Testing the Application

After starting both servers:

1. **Register as Customer**: http://localhost:3000/register
2. **Create a Project**: Access customer dashboard and create a new project
3. **Register as Architect**: Use a different email to register as an architect
4. **Submit Bids**: Browse projects and submit competitive bids
5. **Manage Projects**: Customers can view and manage bids on their projects

### Features Ready for Testing

✅ **Authentication System**: Register, login, JWT tokens
✅ **Customer Features**: Create projects, manage bids, view proposals
✅ **Architect Features**: Browse projects, submit bids, track status
✅ **Indian Localization**: ₹ currency, +91 phone, Indian cities
✅ **Role-Based Dashboards**: Different views for customers vs architects
✅ **Project Management**: Complete bidding workflow
✅ **Notifications**: Real-time updates for bids and project changes

### Database Schema
- **users**: Customer and architect accounts
- **projects**: Project listings with requirements
- **project_bids**: Architect bids on projects
- **notifications**: System notifications
- **communications**: Project messaging
- **milestones**: Project progress tracking

### API Endpoints Ready
- `/api/auth/*`: Authentication (register, login, profile)
- `/api/projects/*`: Project CRUD and bidding
- `/api/notifications/*`: Notification system

The application is now properly configured and ready for full testing!
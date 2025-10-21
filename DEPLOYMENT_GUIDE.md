# BuildBuddy Free Hosting Deployment Guide

This guide will help you deploy your BuildBuddy application using:
- **Vercel** (Frontend hosting)
- **Firebase** (File storage)  
- **Render** (Backend hosting)

All services offer free tiers suitable for your project.

## Prerequisites

1. GitHub account (for code hosting)
2. Firebase account (Google account)
3. Vercel account
4. Render account

## Step 1: Prepare Your Repository

1. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub repository** and push your code:
   ```bash
   git remote add origin https://github.com/yourusername/buildbuddy.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Setup Firebase

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `buildbuddy-app` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

### 2.2 Enable Firebase Storage

1. In your Firebase project, go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in production mode"
4. Select your preferred location
5. Click "Done"

### 2.3 Configure Firebase Storage Rules

In the Storage section, go to "Rules" tab and update the rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow write access only to authenticated users for portfolios
    match /portfolios/{allPaths=**} {
      allow write: if request.auth != null;
    }
  }
}
```

### 2.4 Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web" (</> icon)
4. Register your app with nickname: "BuildBuddy Frontend"
5. Copy the Firebase configuration object (you'll need these values)

## Step 3: Deploy Backend to Render

### 3.1 Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with your GitHub account

### 3.2 Create Web Service

1. Click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Select your BuildBuddy repository
4. Configure the service:
   - **Name**: `buildbuddy-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3.3 Configure Environment Variables

In the Render dashboard, go to "Environment" tab and add these variables:

```
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d
FIREBASE_API_KEY=your_firebase_api_key_from_step_2.4
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
CORS_ORIGIN=https://your-app-name.vercel.app
```

### 3.4 Deploy Backend

1. Click "Create Web Service"
2. Wait for the deployment to complete (5-10 minutes)
3. Note your backend URL: `https://your-app-name.onrender.com`

### 3.5 Test Backend

Visit `https://your-app-name.onrender.com/api/health` to verify deployment.

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with your GitHub account

### 4.2 Import Project

1. Click "New Project"
2. Import your GitHub repository
3. Select the `frontend` folder as the root directory
4. Framework Preset: `Create React App`

### 4.3 Configure Environment Variables

In the deployment configuration, add these environment variables:

```
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

### 4.4 Deploy Frontend

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Note your frontend URL: `https://your-app-name.vercel.app`

## Step 5: Update CORS Configuration

### 5.1 Update Backend CORS

Go back to your Render backend environment variables and update:

```
CORS_ORIGIN=https://your-actual-vercel-url.vercel.app
```

Redeploy the backend service.

## Step 6: Final Testing

### 6.1 Test Complete Flow

1. Visit your Vercel frontend URL
2. Test user registration/login
3. Test file uploads (portfolio management)
4. Verify files are stored in Firebase Storage

### 6.2 Verify Firebase Storage

1. Go to Firebase Console > Storage
2. Check if uploaded files appear in the `portfolios/` folder

## Step 7: Domain Configuration (Optional)

### 7.1 Custom Domain for Frontend (Vercel)

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" > "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 7.2 Custom Domain for Backend (Render)

1. In Render dashboard, go to your service
2. Navigate to "Settings" > "Custom Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Monitoring and Maintenance

### Free Tier Limitations

**Vercel Free Tier:**
- 100GB bandwidth/month
- 10GB deployment storage
- Commercial usage allowed

**Firebase Free Tier (Spark Plan):**
- 1GB storage
- 10GB/month downloads
- 20,000/day uploads

**Render Free Tier:**
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- 500MB RAM
- 1GB storage

### Monitoring

1. **Vercel**: Monitor through Vercel dashboard
2. **Render**: Monitor through Render dashboard  
3. **Firebase**: Monitor through Firebase console

## Troubleshooting

### Common Issues

1. **Backend sleeps on Render free tier**
   - First request after inactivity may be slow
   - Consider upgrading to paid plan for production

2. **CORS errors**
   - Verify CORS_ORIGIN environment variable matches your Vercel URL exactly
   - Ensure both http and https protocols are handled

3. **Firebase upload errors**
   - Check Firebase Storage rules
   - Verify environment variables are set correctly
   - Check browser console for detailed error messages

4. **Build failures**
   - Check node version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

### Support Resources

- **Vercel**: [Documentation](https://vercel.com/docs)
- **Render**: [Documentation](https://render.com/docs)
- **Firebase**: [Documentation](https://firebase.google.com/docs/storage)

## Cost Optimization

All services offer generous free tiers. Monitor usage through each platform's dashboard. Consider upgrading individual services as needed based on growth.

## Security Checklist

- [ ] Firebase Storage rules configured properly
- [ ] JWT_SECRET is strong and unique
- [ ] Environment variables are set correctly
- [ ] CORS is configured to only allow your domain
- [ ] No sensitive data in client-side code
- [ ] Regular dependency updates

Your BuildBuddy application is now successfully deployed and ready for use!
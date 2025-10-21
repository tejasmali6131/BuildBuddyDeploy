# BuildBuddy Free Hosting Deployment Guide

This guide will help you deploy your BuildBuddy application using:
- **Vercel** (Frontend hosting)
- **Cloudinary** (File storage - Completely Free!)  
- **Render** (Backend hosting)

All services offer free tiers suitable for your project.

## Prerequisites

1. GitHub account (for code hosting)
2. Cloudinary account (free)
3. Vercel account
4. Render account

## Step 1: Prepare Your Repository

✅ **You've already done this!** Your code is on GitHub.

## Step 1.5: Install New Dependencies

Before deploying, install the Cloudinary dependencies:

```bash
# In your backend folder
cd backend
npm install cloudinary multer-storage-cloudinary

# Commit the changes
git add .
git commit -m "Add Cloudinary dependencies"
git push origin main
```

## Step 2: Setup Cloudinary (100% Free File Storage)

### 2.1 Create Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com/)
2. Click "Sign up for free"
3. Create your account (no billing required!)
4. Choose a unique cloud name (this will be part of your URLs)

### 2.2 Get Cloudinary Credentials

1. After signup, you'll be taken to the Dashboard
2. Copy these three values from your dashboard:
   - **Cloud Name** 
   - **API Key**
   - **API Secret** (click "Reveal" to see it)

### 2.3 Cloudinary Free Tier Benefits

- **25GB storage** (vs Firebase's 1GB)
- **25GB bandwidth** per month
- **No billing account** required
- Support for images, videos, and PDFs

### 2.3 Test Cloudinary Setup

1. In your Cloudinary dashboard, go to "Media Library"
2. You can test upload functionality later after deployment
3. Files will be stored in `buildbuddy/portfolios/` folder automatically

**That's it!** No complex rules or billing setup needed.

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
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_step_2.2
CLOUDINARY_API_KEY=your_api_key_from_step_2.2
CLOUDINARY_API_SECRET=your_api_secret_from_step_2.2
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

In the deployment configuration, add this environment variable:

```
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
```

**Note:** The frontend doesn't need Cloudinary credentials since file uploads are handled by the backend.

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
4. Verify files are stored in Cloudinary

### 6.2 Verify Cloudinary Storage

1. Go to Cloudinary Dashboard > Media Library
2. Check if uploaded files appear in the `buildbuddy/portfolios/` folder

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

**Cloudinary Free Tier:**
- 25GB storage
- 25GB bandwidth/month
- No billing account required

**Render Free Tier:**
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- 500MB RAM
- 1GB storage

### Monitoring

1. **Vercel**: Monitor through Vercel dashboard
2. **Render**: Monitor through Render dashboard  
3. **Cloudinary**: Monitor through Cloudinary dashboard

## Troubleshooting

### Common Issues

1. **Backend sleeps on Render free tier**
   - First request after inactivity may be slow
   - Consider upgrading to paid plan for production

2. **CORS errors**
   - Verify CORS_ORIGIN environment variable matches your Vercel URL exactly
   - Ensure both http and https protocols are handled

3. **Cloudinary upload errors**
   - Check Cloudinary credentials in Render environment variables
   - Verify Cloud Name, API Key, and API Secret are correct
   - Check browser console for detailed error messages

4. **Build failures**
   - Check node version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

### Support Resources

- **Vercel**: [Documentation](https://vercel.com/docs)
- **Render**: [Documentation](https://render.com/docs)
- **Cloudinary**: [Documentation](https://cloudinary.com/documentation)

## Cost Optimization

All services offer generous free tiers. Monitor usage through each platform's dashboard. Consider upgrading individual services as needed based on growth.

## Security Checklist

- [ ] Cloudinary credentials are kept secure in environment variables
- [ ] JWT_SECRET is strong and unique (at least 32 characters)
- [ ] Environment variables are set correctly
- [ ] CORS is configured to only allow your domain
- [ ] No sensitive data in client-side code
- [ ] Regular dependency updates

Your BuildBuddy application is now successfully deployed and ready for use!
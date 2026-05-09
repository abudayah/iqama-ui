# GitHub Variables Setup Guide

This guide explains how to configure environment variables for the GitHub Actions workflows.

## 📋 Required Configuration

### For `iqama-ui` Repository

#### **Variables** (Non-Sensitive Configuration)
Navigate to: **Repository Settings → Secrets and variables → Actions → Variables**

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.prayers.example.com` |

---

## 🚀 How to Add Variables

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click the **Variables** tab
5. Click **New repository variable**
6. Enter the **Name**: `VITE_API_BASE_URL`
7. Enter the **Value**: Your backend API URL (e.g., `https://api.prayers.example.com`)
8. Click **Add variable**

## 🔒 Security Note

- The `VITE_API_BASE_URL` is **embedded in the frontend build** and is **publicly visible**
- This is expected behavior for Vite environment variables
- Do **NOT** put sensitive data (API keys, passwords) in `VITE_*` variables
- Only use this for public configuration like API endpoints

## 🧪 Testing

After adding the variable:
1. Push a commit to `main` or `develop` branch
2. Go to **Actions** tab in your repository
3. Watch the workflow run with your environment variable
4. The built app will use the configured API URL

## 📝 Notes

- Variables are **visible** in workflow logs
- Changes take effect immediately
- The variable is embedded during build time (not runtime)
- Users can still override the API URL from within the app

## 🔄 Updating the Value

To update the variable:
1. Go to **Settings** → **Secrets and variables** → **Actions** → **Variables** tab
2. Click on `VITE_API_BASE_URL`
3. Click **Update variable**
4. Enter the new value and save

---

## 📚 Additional Resources

- [GitHub Variables Documentation](https://docs.github.com/en/actions/learn-github-actions/variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

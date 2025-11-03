# Cloudinary Upload Configuration

## Current Setup Issues

The `/api/upload` endpoint is returning 500 errors because:
1. **Missing Vercel Environment Variables** - `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` are not set in Vercel project settings

## Fix: Add Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these two variables:
   - **Name**: `CLOUDINARY_CLOUD_NAME`
     **Value**: `dxawvcf9e`
   - **Name**: `CLOUDINARY_UPLOAD_PRESET`
     **Value**: `lunch_app_logo`
4. Click **Save**
5. Vercel will automatically redeploy with the new variables

## Important Notes

- Do NOT add `CLOUDINARY_URL` - it's not needed for unsigned uploads
- The upload preset `lunch_app_logo` must be configured in your Cloudinary dashboard as **Unsigned**
- Keep API keys/secrets out of environment variables for unsigned uploads (they're not needed)

## Testing After Setup

Once variables are added to Vercel:
1. Wait for automatic redeploy to complete
2. Try uploading an image from the lunch voting page
3. Check browser console for any errors
4. If still failing, check Vercel function logs in the dashboard

## Local Testing

To test locally, ensure `.env.local` has:
```
CLOUDINARY_CLOUD_NAME=dxawvcf9e
CLOUDINARY_UPLOAD_PRESET=lunch_app_logo
```

Note: `.env.local` is gitignored and won't be deployed to Vercel.

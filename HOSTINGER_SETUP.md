# Hostinger Deployment Guide for ShopMaster POS

Congratulations on your POS system! Version v4.2.4 is ready for release. To make it live on **pos.sellerscampus.com** using Hostinger, follow these steps:

## 1. Prepare your Repository
1. Push your code to a **GitHub repository** (Private or Public).
2. Ensure you have the `server.ts`, `package.json`, and `.env.example` files at the root.

## 2. Hostinger Setup (Node.js App)
1. Log in to your **Hostinger hPanel**.
2. Go to **Websites** -> **Manage** -> **Node.js**.
3. Click **Create New Application** or **Import from GitHub**.
4. **Application Setup**:
   - **Entry File**: `dist/server.cjs`
   - **Framework**: Custom (Express)
   - **Port**: 3000
5. **Environment Variables**:
   - Go to the **Environment Variables** tab in Hostinger.
   - Add `NODE_ENV=production`
   - Add `GEMINI_API_KEY` (Your Google Gemini Key for Voice AI)
   - Add `PORT=3000`

## 3. Domain Configuration (pos.sellerscampus.com)
1. In Hostinger, go to **Domains** -> **Manage**.
2. Add a **CNAME** record:
   - **Name**: `pos`
   - **Points to**: Your Hostinger hosting server address (or use the Node.js domain mapping feature).
3. In the Node.js section, map your app to the domain **pos.sellerscampus.com**.

## 4. Automatic Updates (CI/CD)
- When you connect Hostinger to GitHub, enable **"Auto Deploy"**.
- Now, whenever you push changes to your GitHub `main` branch, Hostinger will automatically:
  1. Pull the new code.
  2. Run `npm install`.
  3. Run `npm run build` (Client).
  4. Restart the server.

## 5. Manual Build (If needed)
If you need to manually rebuild on the server:
```bash
npm install
npm run build
npm start
```

## 6. Important Notes
- **Firebase**: Ensure your Firebase whitelist includes `pos.sellerscampus.com`. Go to Firebase Console -> Auth -> Settings -> Authorized domains.
- **SSL**: Hostinger provides free SSL. Ensure it is active for your subdomain.

Your app is now ready for production!

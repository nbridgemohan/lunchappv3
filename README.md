# Simple Vercel App

A simple Next.js application ready to deploy to Vercel.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A GitHub account
- A Vercel account (free at https://vercel.com)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to see your app.

### Building

To create an optimized production build:
```bash
npm run build
npm start
```

## Deploying to Vercel

### Option 1: Using Vercel CLI
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

### Option 2: Using GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

Vercel will automatically deploy on every push to main!

### Option 3: Using Vercel Website
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Other" > "Create Git Repository"
4. Drag and drop your project folder
5. Click "Deploy"

## Project Structure

```
.
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   ├── page.module.css    # Page styles
│   └── globals.css        # Global styles
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── jsconfig.json          # JavaScript path aliases
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Features

- Built with Next.js 14
- React 18
- Responsive design
- Ready for production
- Zero-config deployment to Vercel

## Next Steps

- Customize the home page in `app/page.js`
- Add more pages and routes in the `app` directory
- Add API routes in `app/api/`
- Connect a database (MongoDB, PostgreSQL, etc.)
- Add environment variables in `.env.local`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [React Documentation](https://react.dev)

## License

MIT

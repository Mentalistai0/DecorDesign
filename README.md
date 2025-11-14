# 🎨 DecorDesign - AI-Powered Interior Design Platform

Transform your interior design ideas into reality with AI-generated images and videos.

## ✨ Features

- 🖼️ **AI Image Generation** - Transform room photos with AI-powered redesigns
- 🎬 **AI Video Generation** - Create animated walkthroughs of your designs
- 💳 **Credit-Based Pricing** - Flexible plans with image and video credits
- 🔐 **Secure Authentication** - User accounts with Supabase Auth
- 💰 **Stripe Integration** - Secure payment processing
- 📊 **Usage Tracking** - Monitor your credit usage and history
- 🎯 **Gallery System** - Save and organize your generated content

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Fal.ai API key

### Local Development

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/DecorDesign.git
   cd DecorDesign
   \`\`\`

2. **Backend Setup**
   \`\`\`bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
   \`\`\`

3. **Frontend Setup** (in a new terminal)
   \`\`\`bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
   \`\`\`

4. **Database Setup**
   - Go to Supabase Dashboard
   - Run the SQL migrations from \`/database\` folder
   - See DEPLOYMENT.md for detailed instructions

5. **Stripe Webhook Listener** (in a new terminal)
   \`\`\`bash
   stripe listen --forward-to http://localhost:3000/api/webhook
   \`\`\`

6. **Open the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## 📦 Tech Stack

### Frontend
- React 18 with Vite
- React Router
- Axios
- Tailwind CSS
- Supabase Client

### Backend
- Node.js with Express
- Supabase
- Stripe
- Fal.ai
- Multer

## 🚀 Deployment

See **DEPLOYMENT.md** for comprehensive production deployment guide.

## 📄 License

MIT License

---

**Made with ❤️ using Claude Code**

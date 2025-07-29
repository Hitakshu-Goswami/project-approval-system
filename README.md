# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c7aacd59-66c1-448c-ae98-17d549ccf903

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c7aacd59-66c1-448c-ae98-17d549ccf903) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend & Authentication)
- Google Gemini AI (for project evaluation)

## Setting up AI Evaluation

The project includes an AI-powered evaluation system that uses Google's Gemini API. The system works with a fallback mechanism:

### Basic Evaluation (Default)
The application includes a built-in evaluation system that works immediately without any setup. It evaluates projects based on:
- Title clarity and length
- Description detail and completeness
- Presence of clear goals and objectives
- Overall project structure

### Full AI Evaluation (Optional)
For enhanced AI evaluation using Google Gemini:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set the `GEMINI_API_KEY` environment variable in your Supabase project
3. The system will automatically use AI evaluation when the key is available

**Note**: The application works perfectly without the Gemini API key - it will use the built-in evaluation system as a fallback.

## 🚀 Features

### 📝 Project Management
- **Submit Projects**: Create new projects with detailed descriptions
- **Smart Evaluation**: AI-powered project assessment using Google Gemini
- **Edit & Re-evaluate**: Update rejected projects based on feedback
- **Visual Feedback**: Celebration animations for approvals, feedback indicators for rejections
- **Real-time Updates**: Instant status updates and notifications

### 🎨 User Experience
- **Modern UI**: Clean, professional design with smooth animations
- **Responsive Design**: Works perfectly on desktop and mobile
- **Interactive Elements**: Hover effects, transitions, and micro-interactions
- **Status Indicators**: Color-coded badges with icons for clear project status
- **Celebration Animations**: 🎉 Confetti for approvals, 📋 feedback indicators for rejections

### 🤖 AI Integration
- **Gemini AI Evaluation**: Intelligent project assessment with detailed feedback
- **Fallback System**: Basic evaluation when AI is unavailable
- **Smart Suggestions**: Specific recommendations for improvement
- **Professional Analysis**: Comprehensive review of feasibility, impact, and technical soundness

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Gemini API key (optional, for AI evaluation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-approve-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Update `src/integrations/supabase/client.ts` with your credentials

4. **Configure Gemini AI (Optional)**
   - Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Set the `GEMINI_API_KEY` environment variable in your Supabase project
   - Or use the built-in fallback evaluation system

5. **Run the development server**
   ```bash
   npm run dev
   ```

### Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel, Netlify, or any static hosting service
   - Make sure to set environment variables in your deployment platform

## 🎯 Usage

### Project Submission Flow
1. **Submit** your project with a clear title and detailed description
2. **Evaluate** using the AI-powered evaluation system
3. **Review** feedback and suggestions for improvement
4. **Edit** and re-evaluate if needed until approved

### Project Status Flow
- **Pending** 🟡 → Ready for evaluation
- **Approved** 🟢 → Project meets criteria with celebration animation
- **Rejected** 🔴 → Needs improvement with feedback animation

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c7aacd59-66c1-448c-ae98-17d549ccf903) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# 🚀 Project Approval System

A smart project evaluation tool that leverages AI for intelligent feedback, seamless user experience, and real-time approval workflows.

---

## 🔗 Project Info

**Live Project:** [Lovable Project Page](https://lovable.dev/projects/c7aacd59-66c1-448c-ae98-17d549ccf903)

---

## ✨ How to Edit This Code

### 🧠 Use Lovable
- Go to the [Lovable Editor](https://lovable.dev/projects/c7aacd59-66c1-448c-ae98-17d549ccf903)
- Prompt changes using natural language
- All updates are auto-committed to GitHub

### 💻 Use Your Preferred IDE

1. **Clone the repository**
    ```bash
    git clone https://github.com/Hitakshu-Goswami/project-approval-system.git
    cd project-approval-system
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Run the dev server**
    ```bash
    npm run dev
    ```

> ✅ Make sure Node.js & npm are installed. [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### 🧠 Edit Directly in GitHub

- Navigate to the file
- Click the ✏️ Edit (pencil) button
- Commit your changes

### 🧰 Use GitHub Codespaces

1. Go to your repo's main page
2. Click the green **Code** button → **Codespaces**
3. Launch a new codespace
4. Edit files in-browser and commit your changes

---

## 🧱 Technologies Used

- **Vite** – Frontend build tool
- **React + TypeScript** – UI framework
- **Tailwind CSS** – Utility-first CSS
- **shadcn/ui** – UI components
- **Supabase** – Auth & backend
- **Google Gemini AI** – AI-powered evaluation

---

## 🤖 Setting Up AI Evaluation

### 🔹 Basic Evaluation (Default)
Works out of the box with no configuration.

Evaluates:
- Title clarity and length
- Description detail and completeness
- Defined goals and objectives
- Project structure

### 🔸 Full Gemini AI Evaluation (Optional)

To unlock enhanced feedback:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In your Supabase project, set:
    ```
    GEMINI_API_KEY=your-api-key
    ```
3. The app will use Gemini automatically when the key is present.

> 💡 If not set, fallback evaluator will be used.

---

## 🛠️ Setup Instructions

### ✅ Prerequisites

- Node.js v18+
- Supabase project
- Gemini API key

### 📦 Installation

```bash
git clone https://github.com/Hitakshu-Goswami/project-approval-system.git
cd project-approval-system
npm install
npm run dev

# Requirement Gathering Bot

🤖 **AI-Powered Software Requirements Engineering Assistant**

An intelligent chatbot that guides you through capturing, structuring, and validating software requirements using Claude AI.

## Features

- ✅ **Guided Conversation Flow** - Structured dialog for capturing all requirement types
- 🤖 **AI-Powered Analysis** - Claude AI understands context and asks clarifying questions
- ⚠️ **Ambiguity Detection** - Identifies vague and unmeasurable requirements
- 🚨 **Contradiction Detection** - Flags conflicting requirements
- 📄 **IEEE 830-1998 SRS Generation** - Professional document export
- 💾 **Project Management** - Save and manage multiple projects
- 📊 **Real-time Analytics** - Track requirements, issues, and progress

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **AI:** Claude (Anthropic API)
- **Icons:** Lucide React
- **Build:** Vite

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- Anthropic API key ([Get here](https://console.anthropic.com/account/keys))

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR-USERNAME/requirement-gathering-bot.git
cd requirement-gathering-bot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```bash
cp .env.example .env
```

4. **Add your API key to `.env`:**
## Running Locally
```bash
npm run dev
```

Your app will open at `http://localhost:3000/`

## Building for Production
```bash
npm run build
npm run preview
```

## How It Works

1. **Create Project** - Enter your project name
2. **Guided Conversation** - Answer questions about features, users, performance, security, timeline, budget, and constraints
3. **AI Analysis** - Claude detects ambiguities and contradictions in real-time
4. **Review Issues** - Clarify ambiguous requirements and resolve conflicts
5. **Export SRS** - Generate a professional IEEE 830-1998 formatted document

## Project Structure
requirement-gathering-bot/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.jsx
│   ├── RequirementBot.jsx    (Main bot component)
│   ├── index.jsx
│   └── index.css
├── .env                       (Your API key - DO NOT commit)
├── .env.example              (Template - commit this)
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
## Environment Variables
VITE_ANTHROPIC_API_KEY=sk-ant-...  # Your Anthropic API key
VITE_APP_NAME=Requirement Gathering Bot
⚠️ **Security:** Never commit `.env` to GitHub. Use `.env.example` as template.

## Usage Example
You: "We need an e-commerce platform"
Bot: ✓ Project created! Now, what are the main features?
You: "Shopping cart, payment processing, user accounts"
Bot: ✓ Understood! Who will use this system?
You: "Customers and admins"
Bot: ✓ Got it! How fast should the system respond?
You: "It should be fast"
Bot: ⚠️ AMBIGUITY DETECTED: 'Fast' is subjective.
Can you specify? (e.g., load in <2 seconds?)


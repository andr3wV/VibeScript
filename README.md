# 🌊 VibeScript

> **Code is dead. Vibes are forever.** 

Look, coding is obviously dead. Everyone knows that. Why would you learn TypeScript when you can just describe what you want in plain English? Why memorize React hooks when AI can generate them for you? Why understand databases when you can just vibe with Supabase? 

VibeScript is the **world's first prompt-driven, component-based, full-stack, AI-powered, blockchain-integrated, vibe-oriented programming language**.

You don't write code. You write *vibes*.  
VibeScript compiles your vibes into a production-ready app using our proprietary AI.  It's like React, but instead of JSX, you just say:

```
component Navbar:
    "A minimalistic navbar with a logo on the left and a glowing 'Sign Up' button on the right."
```

## 📋 Table of Contents

- [🏆 Why Use VibeScript?](#why-use-vibescript)
- [📦 Installation](#installation)
- [🛠 Usage](#usage)
  - [Create a `.vibe` file](#create-a-vibe-file)
  - [Build Your Vibes](#build-your-vibes)
- [✨ Features](#features)
  - [🧩 Nested Components](#nested-components)
  - [🔥 Hot Reload](#hot-reload)
  - [🚢 Deploy to Vercel](#deploy-to-vercel)
  - [🧠 Model Selection](#model-selection)
  - [⚙️ Configuration](#configuration)
  - [💽 Supabase Support **BETA**](#supabase-support-beta)
- [🔍 Linting Your Vibes](#linting-your-vibes)
- [📝 License](#license)

## 🏆 Why Use VibeScript?

- You hate typing `div` tags.
- You want to be a **10x developer** without actually learning anything.
- You want to deploy a site in 5 minutes and spend the rest of the day tweeting about it.
- You're tired of "learning" frameworks when you could just be describing your UI in plain English like a normal human.
- You want to use a cutting edge language that will help you raise millions of dollars.

## 📦 Installation

```bash
npm install -g vibescript
```

**Note:** If you get an access error, try using `sudo`:
```bash
sudo npm install -g vibescript
```


You'll also need an **OpenAI API key**. You can set it in two ways:

**Option 1: Environment Variable**
```bash
export OPENAI_API_KEY="your_api_key_here"
```

**Option 2: .env File** (Recommended)
Create a `.env` file in your project root:
```bash
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

## 🛠 Usage

### Create a `.vibe` file

Check out the `example/App.vibe` file for a complete working example, or create your own:

```vibescript
thing NavButton:
    "A glowing button that says 'Sign Up' in upper case letters."

thing Navbar:
    "A minimalistic navbar with a logo on the left and the NavButton on the right."

thing HeroSection:
    "Big bold headline saying 'Welcome to the Vibe'. Background is a gradient from pink to purple. Add a call-to-action button."

page App:
    Navbar
    HeroSection
```

*Advanced users can also use `component` instead of `thing`*

### Build Your Vibes

```bash
vibe example/App.vibe
```

Outputs HTML to `dist/`. That's it. Your vibes are now a website. 🎉

*VibeScript intelligently caches your prompts - change one component without regenerating everything else.*

## ✨ Features

### 🧩 **Nested Components**

VibeScript supports **recursive nesting**:

```vibescript
thing Icon:
    "A small SVG star icon."

thing NavButton:
    "A glowing button that says 'Sign Up'"
    Icon

thing Navbar:
    "A minimalistic navbar with a logo on the left and NavButton on the right."
    NavButton

page App:
    Navbar
```

### 🔥 **Hot Reload**

Save your `.vibe` file and watch your browser update instantly. No refreshing. No thinking.
```bash
vibe example/App.vibe --watch
```


### 🚢 **Deploy to Vercel**

There's really only one way to host a website nowadays and that's with Vercel.

```bash
vercel login # Login to Vercel first

vibe example/App.vibe --deploy 
```

You'll instantly have a working website with a url!

### 🧠 **Model Selection**

VibeScript lets you choose which OpenAI LLM to use for generating your vibes. Because sometimes you need GPT-5.1, and sometimes you just need a vibe.

#### Available Models:
- `gpt-5.1` – Latest and most capable model for complex generation and the best UI. **Best quality, highest cost.**
- `gpt-5-mini` – Faster, more cost-effective version of GPT-5.1. **Good quality, moderate cost.**
- `gpt-5-nano` – Even faster, most cost-effective version. **Basic quality, low cost.**
- `gpt-oss-120b` – Open source model with 120B parameters. **Variable quality, very low cost.**
- `gpt-oss-20b` – Open source model with 20B parameters. **Basic quality, very low cost.**

#### Usage:
```bash
vibe App.vibe --model gpt-5.1
vibe App.vibe --watch --model gpt-5-mini
vibe App.vibe --deploy --model gpt-5.1
```

Results are cached separately per model, so you can experiment with quality vs. speed without losing your previous generations.

### ⚙️ Configuration

VibeScript can be configured via an optional `vibe.config.json` file.

#### Example `vibe.config.json`
```json
{
  "model": "gpt-5.1",
  "port": 4000
}
```

- `model` – Default OpenAI model to use for component generation. **Recommended: gpt-5.1 for best results.**
- `port` – Port for the dev server in `--watch` mode.

#### Priority:
1. Command-line flags (highest priority)
2. `vibe.config.json`
3. Built-in defaults (`gpt-5-nano` for model, `3000` for port)

#### Example:
```bash
# Uses model from config file
vibe example/App.vibe --watch

# Overrides config file
vibe example/App.vibe --model gpt-5.1 --port 5000
```

### 💽 Supabase Support **BETA**

You might need a thing called a database, and the only real one is called Supabase:

```vibescript
source Supabase myDb:
    "Use Supabase with env.SUPABASE_URL and env.SUPABASE_ANON_KEY. Table: users"

component UserList:
    "Show a list of users from source myDb table 'users'"
```

The AI will automatically generate the connection code and CRUD operations. The generated code uses:
- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`)
- `SUPABASE_ANON_KEY` - Your anon/publishable key (for frontend code)
- `SUPABASE_SERVICE_ROLE_KEY` - Your service_role key (for backend/admin code, use "admin" or "backend" in the source description)

Just vibe with your database. Don't think about SQL.

## 🔍 Linting Your Vibes

Check your vibes for violations:

```bash
vibe lint App.vibe
```

The linter checks for:
- Short or generic descriptions (be specific with your vibes!)
- Missing emojis (real vibe coders use emojis!)
- Unused components (why did you define it if you're not using it?)
- Missing pages (you need at least one page to vibe)
- Unused data sources (clean up your mess)

Think of it as a vibe check for your code.


## 📝 License

MIT - because gatekeeping is bad vibes.

**Built with vibes. Shipped with confidence. Debugged with denial.** 🌊

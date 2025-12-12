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

<a id="why-use-vibescript"></a>
## 🏆 Why Use VibeScript?

- You hate typing `div` tags.
- You want to be a **10x developer** without actually learning anything.
- You want to deploy a site in 5 minutes and spend the rest of the day tweeting about it.
- You're tired of "learning" frameworks when you could just be describing your UI in plain English like a normal human.
- You want to use a cutting edge language that will help you raise millions of dollars.

<a id="installation"></a>
## 📦 Installation

```bash
npm install -g vibescript
```

**Note:** If you get any errors, `sudo` usually fixes everything:
```bash
sudo npm install -g vibescript
```


You'll also need an [**OpenAI API key**](https://platform.openai.com/api-keys). You can set it in two ways:

**Option 1: .env File** (Recommended)
Create a `.env` file in your project root:
```bash
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

**Option 2: Inline in `.vibe` file**
Just put it directly in your `.vibe` file at the top. This leaks your keys but fuck it, you don't care:
```vibescript
apiKey: "sk-your-actual-api-key-here"

thing NavButton:
    "A glowing button that says 'Sign Up' in upper case letters."
```

<a id="usage"></a>
## 🛠 Usage

<a id="create-a-vibe-file"></a>
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

<a id="build-your-vibes"></a>
### Build Your Vibes

```bash
vibe example/App.vibe
```

Outputs HTML to `dist/`. That's it. Your vibes are now a website. 🎉

*VibeScript intelligently caches your prompts - change one component without regenerating everything else.*

<a id="features"></a>
## ✨ Features

<a id="nested-components"></a>
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

<a id="hot-reload"></a>
### 🔥 **Hot Reload**

Save your `.vibe` file and watch your browser update instantly. No refreshing. No thinking.
```bash
vibe example/App.vibe --watch
```


<a id="deploy-to-vercel"></a>
### 🚢 **Deploy to Vercel**

There's really only one way to host a website nowadays and that's with Vercel.

```bash
vercel login # Login to Vercel first

vibe example/App.vibe --deploy 
```

You'll instantly have a working website with a url!

<a id="model-selection"></a>
### 🧠 **Model Selection**

VibeScript lets you choose which in-house, proprietary LLM to use for generating your vibes. 

#### Available Models:
- `gpt-5.1` – That Y Combinator check just came in the mail. **Best quality, highest cost.**
- `gpt-5-mini` – A couple family and friends wired you some money. **Good quality, moderate cost.**
- `gpt-5-nano` – You're dirt poor. Give up. **Basic quality, low cost.**
- `gpt-oss-120b` – Wtf are you doing. **Variable quality, very low cost.**
- `gpt-oss-20b` – Wtf are you doing with emphasis. **Basic quality, very low cost.**

#### Usage:
```bash
vibe App.vibe --model gpt-5.1
vibe App.vibe --watch --model gpt-5-mini
vibe App.vibe --deploy --model gpt-5.1
```

Results are cached separately per model, so you can experiment with quality vs. speed without losing your previous generations.

<a id="configuration"></a>
### ⚙️ Configuration

VibeScript can be configured via an optional `vibe.config.json` file so your root folder can look more complicated.

#### Example `vibe.config.json`
```json
{
  "model": "gpt-5.1",
  "port": 4000
}
```

- `model` – Default OpenAI model to use for component generation. **Recommended: gpt-5.1 for best results.**
- `port` – Port for the dev server in `--watch` mode.

<a id="supabase-support-beta"></a>
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

No SQL needed. And if anyone mentions RLSs, just tell them you have them.

<a id="linting-your-vibes"></a>
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

<a id="license"></a>
## 📝 License

MIT - because gatekeeping is bad vibes.

**Built with vibes. Shipped with confidence. Debugged with denial.** 🌊

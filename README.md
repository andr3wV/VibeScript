# 🌊 VibeScript

> **Code is dead. Vibes are forever.** 

VibeScript is the **world’s first prompt-driven, component-based, full-stack, AI-powered, vibe-oriented programming language**.

You don’t write code. You write *vibes*.  
VibeScript compiles your vibes into production-ready HTML/CSS/JS using an LLM, caches the results, and serves them like a normal website.  

It's like React, but instead of JSX, you just say:

```
component Navbar:
    "A minimalistic navbar with a logo on the left and a glowing 'Sign Up' button on the right."
```

(You can use either `component` or `thing` - whatever feels more natural to you.)

---

## ✨ Features

- **🧠 AI-Driven Compilation** – Your code is literally just English prompts. The AI does the rest.
- **📦 Component-Based** – Break your vibes into reusable components (use `component` or `thing` - whatever you prefer).
- **🔄 Recursive Nesting** – Components can contain other components, infinitely deep.
- **⚡ Hot Reload** – Save your `.vibe` file, and your browser updates instantly.
- **🎭 Build Overlay** – Shows a “✨ Building vibes…” overlay while the AI thinks.
- **🚀 One-Command Deploy** – Deploy to Vercel with `--deploy`.
- **🛡️ Prompt Caching** – Change one component without regenerating the whole site.
- **🧘 Zero Learning Curve** – If you can describe it, you can ship it.
- **🧠 Model Selection** – Choose your OpenAI LLM for generation.
- **⚙️ Config File Support** – Set defaults in `vibe.config.json`.

---

## 🏆 Why Use VibeScript?

- You hate typing `div` tags.
- You believe “design is just vibes”.
- You want to feel like a **10x developer** without actually learning anything.
- You want to deploy a site in 5 minutes and spend the rest of the day tweeting about it.

---

## 📦 Installation

```bash
npm install -g vibescript
```

**Note:** If you get an access error, try using `sudo`:
```bash
sudo npm install -g vibescript
```


You’ll also need an **OpenAI API key**. You can set it in two ways:

**Option 1: Environment Variable**
```bash
export OPENAI_API_KEY="your_api_key_here"
```

**Option 2: .env File** (Recommended)
Create a `.env` file in your project root:
```bash
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

---

## 🛠 Usage

### Create a `.vibe` file

Check out the `example/App.vibe` file for a complete working example, or create your own:

```vibescript
component NavButton:
    "A glowing button that says 'Sign Up' in TailwindCSS."

component Navbar:
    "A minimalistic navbar with a logo on the left and the NavButton on the right."

component HeroSection:
    "Big bold headline saying 'Welcome to the Vibe'. Background is a gradient from pink to purple. Add a call-to-action button."

page App:
    Navbar
    HeroSection
```

---

### Build Once

```bash
# Build the example app
vibe example/App.vibe

# Or build your own file
vibe MyApp.vibe
```

Outputs HTML to `dist/`.

---

### Hot Reload (Dev Mode)

```bash
# Start dev server with the example app
vibe example/App.vibe --watch

# Or with your own file
vibe MyApp.vibe --watch
```

- Starts a dev server at `http://localhost:3000`
- Injects a live reload script into your HTML
- Shows a **"✨ Building vibes..."** overlay while the AI generates
- Reloads automatically when done

---

### Deploy to Vercel

```bash
# Deploy the example app
vibe example/App.vibe --deploy

# Or deploy your own
vibe MyApp.vibe --deploy
```

This will:
1. Build your vibes
2. Deploy `dist/` to Vercel
3. Make you feel like a 10x developer

---

## 🧩 Nested Components

VibeScript supports **recursive nesting**.  
Example:

```vibescript
component Icon:
    "A small SVG star icon."

component NavButton:
    "A glowing button that says 'Sign Up'"
    Icon

component Navbar:
    "A minimalistic navbar with a logo on the left and NavButton on the right."
    NavButton

page App:
    Navbar
```

The compiler will:
- Generate `Icon`
- Inject it into `NavButton`
- Inject `NavButton` into `Navbar`
- Inject `Navbar` into your page (which becomes `index.html` if named `App`)
- Ship it

(You can mix `component` and `thing` keywords freely - the compiler understands both!)

---

## 🧠 Choosing Your OpenAI Model

VibeScript lets you choose which OpenAI LLM to use for generating your vibes. 

### Available Models:
- `gpt-5.1` – Latest and most capable model for complex generation and the best UI. **Best quality, highest cost.**
- `gpt-5-mini` – Faster, more cost-effective version of GPT-5.1. **Good quality, moderate cost.**
- `gpt-5-nano` – Even faster, most cost-effective version. **Basic quality, low cost.**
- `gpt-oss-120b` – Open source model with 120B parameters. **Variable quality, very low cost.**
- `gpt-oss-20b` – Open source model with 20B parameters. **Basic quality, very low cost.**

### Model Selection Guide:
- **Production/Professional Sites**: Use `gpt-5.1`
- **Personal Projects/Prototypes**: Use `gpt-5-mini` or `gpt-5-nano`
- **Budget-Conscious Development**: Use `gpt-5-nano`
- **Experimental/Open Source**: Use `gpt-oss-120b` or `gpt-oss-20b`

### Example:
```bash
vibe App.vibe --model gpt-5.1
```

This will:
- Use `gpt-5.1` for all component generation
- Produce higher quality, more polished websites
- Cache results separately per model (so switching models won't overwrite previous cache)
- Allow you to experiment with speed vs. quality trade-offs

---

## ⚙️ Configuration

VibeScript can be configured via:
1. **Command-line flags** (e.g., `--model gpt-4o`)
2. **Optional config file** (`vibe.config.json`)

### Example `vibe.config.json`
```json
{
  "model": "gpt-5.1",
  "port": 4000
}
```

- `model` – Default OpenAI model to use for component generation. **Recommended: gpt-5.1 for best results.**
- `port` – Port for the dev server in `--watch` mode.

### Priority:
1. Command-line flags (highest priority)
2. `vibe.config.json`
3. Built-in defaults (`gpt-5-nano` for model, `3000` for port)

### Example Usage:
```bash
# Uses model from config file
vibe example/App.vibe --watch

# Overrides config file with higher quality model
vibe example/App.vibe --model gpt-5.1 --port 5000

# Quick test with budget model
vibe example/App.vibe --model gpt-5-nano
```

---

## ⚙️ How It Works

1. **Prompt Parsing** – VibeScript reads your `.vibe` file and extracts components, pages, and data sources.
2. **Hashing & Caching** – Each prompt is hashed. If unchanged, it's pulled from `.vibecache.json`.
3. **AI Compilation** – Prompts are sent to an LLM (e.g., GPT-4o-mini) to generate HTML/CSS/JS.
4. **Recursive Resolution** – If a component references another, it's resolved first based on explicit nesting.
5. **Assembly** – Components are stitched together into full HTML pages.
6. **Live Reload** – A WebSocket server pushes reload events to your browser.
7. **Deployment** – `--deploy` sends your vibes to Vercel.

## 🔥 Data Sources (Supabase) **BETA**

VibeScript supports Supabase! Just declare a source:

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

Real vibe coders use databases for everything! 🔥

## 🔍 Linting Your Vibes

Check your vibes for violations:

```bash
vibe lint App.vibe
```

The linter checks for:
- Short or generic descriptions
- Missing emojis (real vibe coders use emojis!)
- Unused components
- Missing pages
- Unused data sources

---

## 🛡 Requirements

- Node.js 18+
- An OpenAI API key
- A willingness to let AI decide your design choices

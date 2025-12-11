// Import the fs module to read and write files
import fs from "fs"; // This is the fs import statement
// Import the path module to handle file paths
import path from "path"; // This is the path import statement
// Import the crypto module to create hashes for caching
import crypto from "crypto"; // This is the crypto import statement
// Import ora for loading spinners
import ora from "ora"; // This imports the ora spinner library

// Define the cache file name as a constant
const cacheFile = ".vibecache.json"; // This assigns the cache file name
// Initialize an empty cache object
let cache = {}; // This creates an empty object for the cache

// Check if the cache file exists on disk
if (fs.existsSync(cacheFile)) { // This is the opening if statement
  // Try to read and parse the cache file
  try { // This is the opening try block
    // Read the cache file as UTF-8 text
    const raw = fs.readFileSync(cacheFile, "utf8").trim(); // This reads the file and trims whitespace
    // Parse the JSON content into a JavaScript object
    cache = raw ? JSON.parse(raw) : {}; // This parses JSON or uses empty object
  } // This is the end of the try block
  catch (err) { // This is the opening catch block
    // If parsing fails, warn the user and start with empty cache
    console.warn("⚠️  Failed to parse .vibecache.json, starting with empty cache."); // This logs a warning
    // Set cache to empty object
    cache = {}; // This resets cache to empty
  } // This is the end of the catch block
} // This is the end of the if statement

// This function creates a hash of a prompt string for caching purposes
function hashPrompt(prompt) { // This is the function declaration
  // Create a SHA-256 hash of the prompt and return it as a hex string
  return crypto.createHash("sha256").update(prompt).digest("hex"); // This creates and returns the hash
} // This is the end of the hashPrompt function

// This function gets an OpenAI client instance
async function getOpenAIClient() { // This is the async function declaration
  // Dynamically import the OpenAI module
  const { default: OpenAI } = await import("openai"); // This imports the OpenAI class
  // Create and return a new OpenAI client with the API key from environment
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // This creates and returns the client
} // This is the end of the getOpenAIClient function

// This function gets the generated code for a thing/component prompt
// If isComponent is true, generates as a JavaScript function; otherwise generates raw HTML
async function getThingCode(prompt, model, sources = {}, isComponent = false, childComponentNames = [], componentName = 'component', showSpinner = true) { // This is the function declaration with parameters
  // Create a hash of the prompt, model, and component flag for caching
  const hashKey = prompt + model + JSON.stringify(sources) + (isComponent ? 'component' : 'html') + JSON.stringify(childComponentNames) + componentName; // This creates the hash key
  const hash = hashPrompt(hashKey); // This creates the hash
  // Check if we have this hash in the cache
  if (cache[hash]) { // This checks if the result is cached
    // If cached, return immediately without spinner (cached items are instant)
    // Re-apply safety transforms in case cache was created before recent fixes
    return escapeScriptClosures(stripStructuralTags(cache[hash])); // This returns the sanitized cached result
  } // This is the end of the cache check if statement

  // Create a spinner for this generation only if showSpinner is true
  const spinner = showSpinner ? ora(`Generating: "${prompt.substring(0, 50)}..."`).start() : null; // This creates and starts a spinner conditionally
  try { // This starts a try block for error handling
    // Get the OpenAI client
    const openai = await getOpenAIClient(); // This gets the OpenAI client instance
    
      // Build the system message with instructions
    let systemMessage; // This declares the system message variable
    const functionName = componentName + 'Component'; // This creates the function name
    if (isComponent && childComponentNames.length > 0) { // This checks if we're generating a component function with children
    // Generate as a JavaScript function that receives child components as parameters
    const childParams = childComponentNames.map(name => `${name}Component`).join(', '); // This creates parameter names
    systemMessage = `You are a code generator. Generate a JavaScript function that returns an HTML string for a website component.

The function should be named ${functionName} and have this signature:
function ${functionName}(${childParams}) {
  return \`...HTML/CSS/JS here...\`;
}

This component receives child components as function parameters: ${childComponentNames.join(', ')}. 
Use these functions by calling them in template literals like: \`\${${childComponentNames[0]}Component()}\` where you want to include their HTML.

Output ONLY the JavaScript function code. Do not include explanations, markdown formatting, comments, or any other text. Just the function code.
IMPORTANT: Do NOT include <html>, <head>, <body>, or <!DOCTYPE> tags. Return only the component's HTML.

The function should return a template literal string containing HTML/CSS/JS. Include all necessary <style> tags for CSS and <script> tags for JavaScript within the returned string.`; // This sets the function-based system message
    } else if (isComponent) { // This checks if we're generating a standalone component function
      systemMessage = `You are a code generator. Generate a JavaScript function that returns an HTML string for a website component.

The function should be named ${functionName} and have this signature:
function ${functionName}() {
  return \`...HTML/CSS/JS here...\`;
}

Output ONLY the JavaScript function code. Do not include explanations, markdown formatting, comments, or any other text. Just the function code.
IMPORTANT: Do NOT include <html>, <head>, <body>, or <!DOCTYPE> tags. Return only the component's HTML.

The function should return a template literal string containing HTML/CSS/JS. Include all necessary <style> tags for CSS and <script> tags for JavaScript within the returned string.`; // This sets the standalone component system message
    } else { // This is the else for component function check
      // Generate raw HTML for inline vibes or standalone content
      systemMessage = "You are a code generator. Output only raw HTML/CSS/JS for a website component. Nothing else. Do not include explanations, markdown formatting, comments (neither // nor <!-- -->), or any other text. Just pure HTML/CSS/JS code. IMPORTANT: Do NOT include <html>, <head>, <body>, or <!DOCTYPE> tags."; // This initializes the base system message
    } // This is the end of the component function check if statement

    // If sources are referenced in the prompt, add instructions about them
    const sourceNames = Object.keys(sources); // This gets all source names
    if (sourceNames.length > 0) { // This checks if there are any sources
      systemMessage += "\n\nIf the prompt mentions a Supabase data source, you should include JavaScript code that:"; // This adds Supabase instructions
      systemMessage += "\n- Uses the Supabase client that will be initialized with SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for admin/backend)"; // This explains environment variables
      systemMessage += "\n- Performs CRUD operations (select, insert, update, delete) as described in the prompt"; // This mentions CRUD operations
      systemMessage += "\n- Renders the data in the UI with proper error handling"; // This mentions UI rendering
      systemMessage += "\n- Uses async/await for database operations"; // This mentions async operations
    } // This is the end of the sources check if statement
    
    // Create the chat completion request
    const res = await openai.chat.completions.create({ // This calls the OpenAI API
      // Use the specified model
      model, // This is the model parameter
      // Set up the messages array with system and user messages
      messages: [ // This starts the messages array
        { // This starts the system message object
          // This is the system message that sets the AI's behavior
          role: "system", // This sets the role to system
          // The content of the system message
          content: systemMessage, // This is the system message content
        }, // This ends the system message object
        // This is the user's prompt
        { role: "user", content: prompt }, // This is the user message object
      ], // This ends the messages array
    }); // This ends the API call

    // Extract the generated code from the response
    let code = res.choices[0].message.content; // This gets the first choice's content

    // Remove any markdown code blocks if they exist
    code = code.replace(/```javascript\s*|\s*```/g, ''); // This removes JavaScript code block markers
    code = code.replace(/```js\s*|\s*```/g, ''); // This removes JS code block markers
    code = code.replace(/```html\s*|\s*```/g, ''); // This removes HTML code block markers
    code = code.replace(/```\s*|\s*```/g, ''); // This removes generic code block markers

    if (isComponent) { // This checks if we're generating a component function
      // For function-based components, ensure it's a valid function
      // If the code doesn't start with "function", try to extract or wrap it
      if (!code.trim().startsWith('function')) { // This checks if code is already a function
        // Try to extract function from the code
        const functionMatch = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*\}/); // This tries to find a function
        if (functionMatch) { // This checks if a function was found
          code = functionMatch[0]; // This uses the extracted function
        } else { // This is the else for function match
          // Wrap the code in a function - this is a fallback
          const params = childComponentNames.map(name => `${name}Component`).join(', '); // This creates parameters
          const functionName = componentName + 'Component'; // This creates the function name
          code = `function ${functionName}(${params}) {\n  return \`${code}\`;\n}`; // This wraps code in a function
        } // This is the end of function match check
      } // This is the end of function check
    } else { // This is the else for component function check
      // JavaScript-style comments and HTML comments are removed for raw HTML

      // Remove JavaScript-style comments (// comments)
      // Match // comments but preserve URLs like http://
      code = code.split('\n').map(line => {
        // Find the position of // that's not part of a URL
        const commentIndex = line.indexOf('//');
        if (commentIndex === -1) return line; // No comment found
        
        // Check if // is part of a URL (http:// or https://)
        const beforeComment = line.substring(0, commentIndex);
        if (beforeComment.match(/https?:$/)) {
          // It's part of a URL, don't remove it
          return line;
        }
        
        // Remove the comment
        return line.substring(0, commentIndex).trimEnd();
      }).join('\n');

      // Remove HTML comments (<!-- -->)
      code = code.replace(/<!--[\s\S]*?-->/g, ''); // This removes HTML comments
    } // This is the end of component function check if statement

    // Trim whitespace from the beginning and end
    code = code.trim(); // This removes leading and trailing whitespace

    // SAFETY: Strip DOCTYPE, html, head, body tags from ALL output (components and raw) to prevent nesting errors
    // This must happen BEFORE wrapping in functions, and also handle cases where tags are inside template literals
    code = stripStructuralTags(code);
    // SAFETY: Escape closing script tags so they cannot terminate the outer <script type="module">
    code = escapeScriptClosures(code);
    
    // Inject Supabase client library if sources are referenced
    const sourceRefs = sourceNames.filter(name => prompt.toLowerCase().includes(name.toLowerCase())); // This filters sources mentioned in the prompt
    if (sourceRefs.length > 0) { // This checks if any sources are referenced
      // Check if Supabase is needed
      const needsSupabase = sourceRefs.some(ref => sources[ref]?.type === "Supabase"); // This checks if Supabase sources are needed

      // Build script tags for the libraries
      let scriptTags = ""; // This initializes the script tags string
      // If Supabase is needed, add the Supabase client library
      if (needsSupabase) { // This checks if Supabase is needed
        scriptTags += '<script type="module">\n'; // This starts the script tag
        scriptTags += 'import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";\n'; // This adds the import statement
        scriptTags += '</script>\n'; // This closes the script tag
      } // This is the end of the Supabase check if statement
      
      // Inject initialization code if not already present
      if (!code.includes("createClient") && !code.includes("supabase.createClient")) { // This checks if initialization code already exists
        let initCode = "\n<script type=\"module\">\n"; // This starts the initialization script
        // Initialize Supabase clients
        for (const ref of sourceRefs) { // This loops through each referenced source
          const source = sources[ref]; // This gets the source configuration
          if (source?.type === "Supabase") { // This checks if it's a Supabase source
            // Determine which environment variables to use based on admin status
            const urlVar = "SUPABASE_URL"; // This is the URL environment variable name
            const keyVar = source.isAdmin ? "SUPABASE_SERVICE_ROLE_KEY" : "SUPABASE_ANON_KEY"; // This selects the appropriate key variable

            initCode += `// Initialize Supabase client for ${ref}\n`; // This adds a comment for the client
            initCode += `// ${source.isAdmin ? "Backend/admin client (uses service_role key)" : "Frontend client (uses anon/publishable key)"}\n`; // This adds type-specific comment
            initCode += `const ${ref}Client = createClient(\n`; // This starts the createClient call
            initCode += `  import.meta.env.${urlVar} || process.env.${urlVar} || '',\n`; // This adds the URL parameter
            initCode += `  import.meta.env.${keyVar} || process.env.${keyVar} || ''\n`; // This adds the key parameter
            initCode += `);\n\n`; // This closes the createClient call
          } // This is the end of the Supabase type check if statement
        } // This is the end of the sourceRefs for loop
        initCode += "</script>\n"; // This closes the script tag
        // Prepend the initialization code
        code = initCode + code; // This prepends the initialization code to the generated code
      } // This is the end of the initialization check if statement
      
      // Prepend the script tags
      code = scriptTags + code; // This prepends the script tags to the code
    } // This is the end of the sourceRefs check if statement

    // Store the code in the cache with the hash as the key
    cache[hash] = code; // This stores the result in the cache
    // Write the cache back to disk
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2)); // This writes the cache to disk
    // Stop spinner with success if spinner exists
    if (spinner) spinner.succeed(`Generated: "${prompt.substring(0, 50)}..."`); // This stops the spinner with success
    // Return the generated code
    return code; // This returns the generated code
  } catch (error) { // This catches any errors
    // Stop spinner with error if spinner exists
    if (spinner) spinner.fail(`Failed: "${prompt.substring(0, 50)}..." - ${error.message}`); // This stops the spinner with error
    // Re-throw the error
    throw error; // This re-throws the error
  } // This is the end of the try-catch block
} // This is the end of the getThingCode function

/**
 * Recursively resolve a thing's code by:
 * 1. Generating its code as a JavaScript function (if it's a component) or raw HTML
 * 2. Resolving any referenced child components first (in parallel)
 * 3. Returning the function code or HTML string
 */
async function resolveThing(name, things, model, sources, resolved = {}, showSpinner = false) { // This is the function declaration with parameters
  // If we've already started resolving this thing, reuse the in-progress or completed Promise
  // This allows multiple references to the same thing to share a single generation call
  if (resolved[name]) return await resolved[name]; // This returns cached Promise result if available

  // Create and store a Promise immediately so concurrent calls share the same work
  const promise = (async () => { // This creates an async IIFE for the resolution logic
    // Check if the thing exists
    if (!things[name]) { // This checks if the thing is defined
      // Warn if thing not found
      console.warn(`⚠️ Thing "${name}" not found.`); // This logs a warning
      // Return empty string if not found
      return ""; // This returns empty string for missing things
    } // This is the end of the thing existence check if statement

    // Get the thing definition (which includes prompt and body)
    const thingDef = things[name]; // This gets the thing definition
    // Extract the main prompt (first line if it's a string, or the prompt field)
    const prompt = typeof thingDef === "string" ? thingDef : thingDef.prompt; // This extracts the prompt
    // Extract the body (list of references and inline vibes)
    const body = thingDef.body || []; // This extracts the body array

    // Separate child components from inline vibes
    const childComponents = []; // This initializes the child components array
    
    for (const bodyItem of body) { // This loops through each body item
      // Check if this body item is a thing reference (not a quoted string)
      if (
        !bodyItem.startsWith('"') &&
        !bodyItem.endsWith('"') &&
        things[bodyItem]
      ) { // This checks if it's a thing reference
        childComponents.push(bodyItem); // This adds it to child components
      } // This is the end of the thing reference check if statement
    } // This is the end of the body for loop

    // Start resolving all child components in parallel
    const childComponentCodes = {}; // This stores resolved child component codes
    const childResolutionPromise = (async () => {
      if (childComponents.length > 0) { // This checks if there are child components
        const childPromises = childComponents.map(async (childName) => { // This maps each child to a Promise
          const childCode = await resolveThing(childName, things, model, sources, resolved, false); // This resolves the child without spinner
          return { name: childName, code: childCode }; // This returns the child name and code
        }); // This ends the map
        const resolvedChildren = await Promise.all(childPromises); // This waits for all children to resolve in parallel
        resolvedChildren.forEach(({ name, code }) => { // This loops through resolved children
          childComponentCodes[name] = code; // This stores the code
        }); // This ends the forEach
      } // This is the end of the child components check if statement
    })();

    // Start generating the component code in parallel with child resolution
    // We already have childComponents (names), which is all we need for the prompt
    // Components with children are generated as functions; standalone components are also functions for consistency
    // Inline vibes (quoted strings) generate raw HTML
    const isComponent = true; // Components are always functions now
    const componentCodePromise = getThingCode(prompt, model, sources, isComponent, childComponents, name, showSpinner); // This generates function code with spinner control

    // Wait for both to finish
    await childResolutionPromise;
    const componentCode = await componentCodePromise;

    // Return the function code - it will be assembled into the page later
    return { type: 'component', name, code: componentCode, children: childComponentCodes }; // This returns component metadata
  })();

  // Cache the in-flight Promise so all callers share the same work
  resolved[name] = promise; // This caches the Promise for the resolved HTML
  // Wait for the Promise to resolve and return the HTML
  return await promise; // This returns the final HTML
} // This is the end of the resolveThing function

// This function strips DOCTYPE and structural HTML tags that shouldn't be in components
// Works even when tags are inside template literals or function bodies
function stripStructuralTags(code) { // This is the function declaration
  return code.replace(/<!DOCTYPE[^>]*>/gi, '')
             .replace(/<html[^>]*>/gi, '')
             .replace(/<\/html>/gi, '')
             .replace(/<head[^>]*>/gi, '')
             .replace(/<\/head>/gi, '')
             .replace(/<body[^>]*>/gi, '')
             .replace(/<\/body>/gi, '');
} // This is the end of stripStructuralTags function

// This function escapes closing script tags so they don't terminate outer script blocks
function escapeScriptClosures(code) { // This is the function declaration
  return code.replace(/<\/script>/gi, '<\\/script>'); // This escapes closing script tags
} // This is the end of escapeScriptClosures function

// This function escapes code for safe embedding in template literals
function escapeForTemplateLiteral(code) { // This is the function declaration
  // Escape backticks, ${ expressions, backslashes, and script tags
  return code
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/`/g, '\\`') // Escape backticks
    .replace(/\${/g, '\\${') // Escape template literal expressions
    .replace(/<\/script>/gi, '<\\/script>'); // Escape closing script tags to prevent breaking out of script blocks
} // This is the end of escapeForTemplateLiteral function

// This function assembles component functions into executable JavaScript code
function assembleComponentCode(componentData) { // This is the function declaration
  const { name, code, children } = componentData; // This destructures the component data
  let assembled = ''; // This initializes the assembled code
  
  // First, recursively assemble all child components
  for (const [childName, childData] of Object.entries(children)) { // This loops through children
    if (childData && typeof childData === 'object' && childData.type === 'component') { // This checks if child is a component
      assembled += assembleComponentCode(childData) + '\n'; // This recursively assembles child
    } else if (typeof childData === 'string') { // This checks if child is raw HTML
      // Raw HTML from inline vibes - wrap in a function for consistency
      const funcName = childName + 'Component'; // This creates function name
      const cleanedHtml = stripStructuralTags(childData); // This strips structural tags
      const escapedHtml = escapeForTemplateLiteral(cleanedHtml); // This escapes the HTML
      // Use string concatenation instead of template literals to avoid nested escaping issues
      assembled += 'function ' + funcName + '() { return `' + escapedHtml + '`; }\n'; // This wraps in function
    } // This is the end of child type check
  } // This is the end of children loop
  
  // Extract function name from generated code or use component name
  const expectedFunctionName = name + 'Component'; // This creates expected function name
  const funcMatch = code.match(/function\s+(\w+)\s*\(/); // This tries to extract function name
  let functionName = expectedFunctionName; // This defaults to expected name
  if (funcMatch) { // This checks if function name was found
    functionName = funcMatch[1]; // This uses extracted name
  } // This is the end of function name extraction

  // Rename function to ensure it matches the expected name (prevents collisions)
  let finalCode = code; // This starts with original code
  if (functionName !== expectedFunctionName) { // This checks if function name needs to be changed
    // Replace the function declaration name
    finalCode = finalCode.replace(/function\s+\w+\s*\(/, `function ${expectedFunctionName}(`); // This renames the function
  } // This is the end of function name check

  // Drop all parameters on the generated function to avoid duplicate-param syntax errors
  // and rely on globally defined child component functions instead.
  const fnDeclRegex = new RegExp(`function\\s+${expectedFunctionName}\\s*\\([^)]*\\)`);
  finalCode = finalCode.replace(fnDeclRegex, `function ${expectedFunctionName}()`);

  // Final safety check: strip structural tags from the function code (handles tags inside template literals)
  finalCode = stripStructuralTags(finalCode);

  // Add the component function code directly (no escaping needed since we're using string concatenation)
  assembled += finalCode + '\n'; // This adds the component function
  return assembled; // This returns the assembled code
} // This is the end of assembleComponentCode function

// This is the main compilation function
export async function compileVibeScript(file, config = {}) { // This is the main function declaration
  // Get the model from config or use default
  const model = config.model || "gpt-4.1-nano"; // This gets the model from config
  // Read the source file as UTF-8 text
  const src = fs.readFileSync(file, "utf8"); // This reads the source file

  // Parse things (supporting both "thing" and "component" keywords)
  // This regex matches: thing/component Name: followed by a quoted string or multi-line body
  const thingRegex = /(?:thing|component)\s+(\w+):\s*([\s\S]*?)(?=(?:thing|component|page|source)\s+\w+:|$)/g; // This is the regex for parsing things
  let things = {}; // This initializes the things object
  let match; // This declares the match variable

  // Loop through all thing matches
  while ((match = thingRegex.exec(src))) { // This loops through regex matches
    // Extract the thing name
    const [, name, body] = match; // This destructures the regex match to get name and body
    // Trim the body
    const bodyText = body.trim(); // This trims whitespace from the body

    // Check if body starts with a quoted string (single-line thing)
    if (bodyText.startsWith('"') && bodyText.includes('"', 1)) { // This checks for single-line format
      // Find the closing quote
      const firstQuoteEnd = bodyText.indexOf('"', 1); // This finds the end quote position
      // Extract the prompt (the quoted string)
      const prompt = bodyText.substring(1, firstQuoteEnd); // This extracts the prompt text
      // Check if there's more content after the quote
      const rest = bodyText.substring(firstQuoteEnd + 1).trim(); // This gets content after the quote
      if (rest) { // This checks if there's additional content
        // Multi-line thing with body
        const bodyLines = rest.split("\n") // This splits by newlines
          .map(line => line.trim()) // This trims each line
          .filter(Boolean); // This removes empty lines
        things[name] = { prompt, body: bodyLines }; // This stores the thing with prompt and body
      } else { // This is the else for the rest check
        // Single-line thing, just a prompt
        things[name] = prompt; // This stores the simple prompt
      } // This is the end of the rest check if statement
    } else { // This is the else for the quote check
      // Multi-line thing without initial quote
      // First line is the prompt, rest is body
      const lines = bodyText.split("\n").map(line => line.trim()).filter(Boolean); // This processes multi-line format
      if (lines.length > 0) { // This checks if there are any lines
        const prompt = lines[0].replace(/^["']|["']$/g, ''); // This extracts and cleans the prompt
        const bodyLines = lines.slice(1); // This gets the remaining lines as body
        things[name] = { prompt, body: bodyLines }; // This stores the thing
      } else { // This is the else for the lines check
        // Empty thing, just use empty prompt
        things[name] = ""; // This stores empty prompt
      } // This is the end of the lines check if statement
    } // This is the end of the quote format check if statement
  }

  // Parse sources (Supabase declarations)
  // This regex matches: source Type Name: followed by a description
  const sourceRegex = /source\s+(\w+)\s+(\w+):\s*"([\s\S]*?)"/g; // This is the regex for parsing sources
  const sources = {}; // This initializes the sources object
  // Reset regex lastIndex
  sourceRegex.lastIndex = 0; // This resets the regex position
  // Loop through all source matches
  while ((match = sourceRegex.exec(src))) { // This loops through source matches
    // Extract source type, name, and description
    const [, type, name, description] = match; // This destructures the regex match
    // Parse the description for URL, table names, etc.
    const urlMatch = description.match(/https?:\/\/[^\s]+/); // This finds URL in description
    const tableMatch = description.match(/table\s+['"]([^'"]+)['"]/i); // This finds table name
    // Check if this is a backend/admin source (uses service_role key)
    const isAdmin = description.toLowerCase().includes("admin") || // This checks for admin keyword
                    description.toLowerCase().includes("backend") || // This checks for backend keyword
                    description.toLowerCase().includes("service_role") || // This checks for service_role keyword
                    description.toLowerCase().includes("server-side") || // This checks for server-side keyword
                    description.toLowerCase().includes("supabase_service_role_key"); // This checks for service_role_key keyword
    // Store source info
    sources[name] = { // This creates the source object
      type, // This is the source type
      url: urlMatch ? urlMatch[0] : "", // This is the extracted URL
      table: tableMatch ? tableMatch[1] : "", // This is the extracted table name
      isAdmin: isAdmin, // This indicates if it's an admin source
      description // This is the full description
    }; // This ends the source object
  } // This is the end of the source parsing while loop

  // Parse pages
  // This regex matches: page Name: followed by body content
  const pageRegex = /page\s+(\w+):([\s\S]*?)(?=page\s+\w+:|source\s+\w+\s+\w+:|(?:thing|component)\s+\w+:|$)/g; // This is the regex for parsing pages
  const pages = []; // This initializes the pages array
  // Reset regex lastIndex
  pageRegex.lastIndex = 0; // This resets the regex position
  // Loop through all page matches
  while ((match = pageRegex.exec(src))) { // This loops through page matches
    // Extract page name and body
    const [, pageName, body] = match; // This destructures the regex match
    // Store page info
    pages.push({ pageName, body }); // This adds the page to the array
  } // This is the end of the page parsing while loop

  // Log what we found
  const parseSpinner = ora(`Parsing VibeScript file...`).start(); // This creates a spinner for parsing
  parseSpinner.succeed(`Found ${Object.keys(things).length} things, ${Object.keys(sources).length} sources, and ${pages.length} pages`); // This stops the spinner with success

  // Ensure output directory exists and clear out stale HTML files
  const distDir = "dist"; // This defines the output directory name
  // Create the dist directory if it doesn't exist
  fs.mkdirSync(distDir, { recursive: true }); // This creates the directory recursively
  try { // This starts the cleanup try block
    // Get all files in the dist directory
    for (const fileName of fs.readdirSync(distDir)) { // This loops through all files in dist
      // If it's an HTML file, delete it to clean up
      if (fileName.toLowerCase().endsWith(".html")) { // This checks if file is HTML
        // Delete the file
        fs.unlinkSync(path.join(distDir, fileName)); // This deletes the HTML file
      } // This is the end of the HTML file check if statement
    } // This is the end of the file cleanup for loop
  } catch (_) { // This starts the cleanup catch block
    // Best-effort cleanup; continue on error
  } // This is the end of the cleanup try-catch block

  // Track resolved things across all pages so each thing is only generated once per compile
  const resolvedThings = {}; // This caches resolved thing Promises for the whole compilation

  // Process each page in parallel
  await Promise.all(pages.map(async (page) => {
    // Extract page name and body
    const { pageName, body } = page; // This destructures the page object
    // Log start of page build (no live spinner to avoid parallel spinner overwrite)
    console.log(`▶ Building page: ${pageName}`);

    // Parse the page body into parts
    const parts = body // This starts the parts parsing chain
      // Trim whitespace
      .trim() // This trims the body
      // Split by newlines
      .split("\n") // This splits into lines
      // Trim each line
      .map((line) => line.trim()) // This trims each line
      // Filter out empty lines
      .filter(Boolean); // This removes empty lines
    
    // Process each part of the page body in parallel where possible to reduce total build time
    // Disable individual spinners when processing in parallel to avoid console conflicts
    const resolvedParts = await Promise.all( // This waits for all parts to resolve concurrently
      parts.map(async (part) => { // This maps each part to its resolved code
        // Check if this is a thing reference
        if (things[part]) { // This checks if part is a thing reference
          // It's a thing reference, resolve it (shared across pages via resolvedThings) without spinner
          return await resolveThing(part, things, model, sources, resolvedThings, false); // This resolves and returns the thing without spinner
        } else if (part.startsWith('"') && part.endsWith('"')) { // This checks if part is a quoted string
          // It's an inline vibe (quoted string), generate as raw HTML without spinner
          const textContent = part.slice(1, -1); // This removes quotes from the content
          // Generate code for this inline vibe as raw HTML
          const htmlCode = await getThingCode(textContent, model, sources, false, [], 'component', false); // This generates raw HTML without spinner
          return { type: 'html', code: htmlCode }; // This returns HTML metadata
        } else { // This is the else for the quoted string check
          // Unknown reference, try to resolve as thing anyway without spinner
          return await resolveThing(part, things, model, sources, resolvedThings, false); // This tries to resolve as thing and returns it without spinner
        } // This is the end of the part type check if-else chain
      })
    ); // This is the end of Promise.all over parts

    // Assemble all component functions and HTML into the page
    let componentFunctions = ''; // This stores all component function definitions
    const functionCalls = []; // This stores function call expressions
    
    for (const part of resolvedParts) { // This loops through resolved parts
      if (part && typeof part === 'object' && part.type === 'component') { // This checks if part is a component
        // Assemble component function code
        componentFunctions += assembleComponentCode(part) + '\n// --- component boundary ---\n'; // This assembles component code with a clear boundary
        // Extract function name for calling - should match the component name
        const expectedFuncName = part.name + 'Component'; // This creates expected function name
        const funcMatch = part.code.match(/function\s+(\w+)\s*\(/); // This tries to extract function name
        const funcName = funcMatch ? funcMatch[1] : expectedFuncName; // This uses extracted or expected name
        // Use the expected name to ensure consistency (assembleComponentCode should have renamed it)
        functionCalls.push(expectedFuncName + '()'); // This adds function call using expected name
      } else if (part && typeof part === 'object' && part.type === 'html') { // This checks if part is raw HTML
        // Wrap inline HTML in a function for consistency
        const inlineFuncName = 'inline' + Math.random().toString(36).substring(7) + 'Component'; // This creates unique function name
        // Strip structural tags as a safety measure (should already be done, but double-check)
        const cleanedHtml = stripStructuralTags(part.code); // This strips structural tags
        const escapedHtml = escapeForTemplateLiteral(cleanedHtml); // This escapes the HTML code
        componentFunctions += `function ${inlineFuncName}() { return \`${escapedHtml}\`; }\n`; // This wraps HTML in function, escaping template literal syntax
        functionCalls.push(`${inlineFuncName}()`); // This adds function call
      } else if (typeof part === 'string') { // This checks if part is a string (fallback)
        // Escape the string and wrap in a function call
        const cleanedHtml = stripStructuralTags(part); // This strips structural tags
        const escapedHtml = escapeForTemplateLiteral(cleanedHtml); // This escapes template literal syntax
        const inlineFuncName = 'inline' + Math.random().toString(36).substring(7) + 'Component'; // This creates unique function name
        componentFunctions += `function ${inlineFuncName}() { return \`${escapedHtml}\`; }\n`; // This wraps HTML in function
        functionCalls.push(`${inlineFuncName}()`); // This adds function call
      } // This is the end of part type check
    } // This is the end of resolved parts loop

    // Determine the output filename
    // If page name is "App", use "index.html", otherwise use pageName.html
    const outputFileName = pageName === "App" ? "index.html" : `${pageName}.html`; // This determines the output filename

    // Build the full HTML document with component functions and content
    // Join function calls to assemble the page content
    const pageContentExpression = functionCalls.join(' + '); // This joins function calls
    // Use string concatenation instead of template literal to avoid escaping issues
    // This allows component functions to contain backticks without them being escaped
    // Put script in head and render into a dedicated app container so we don't
    // replace the entire body (and lose live-reload scripts).
    const html = '<!DOCTYPE html>\n' +
      '<html>\n' +
      '<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <title>' + pageName + '</title>\n' +
      '  <script src="https://cdn.tailwindcss.com"></script>\n' +
      '  <script>\n' +
      '(function() {\n' +
      '  function render() {\n' +
      '    const app = document.getElementById("app");\n' +
      '    if (!app) return;\n' +
      componentFunctions +
      '    app.innerHTML = ' + pageContentExpression + ';\n' +
      '  }\n' +
      '  if (document.readyState === "loading") {\n' +
      '    document.addEventListener("DOMContentLoaded", render);\n' +
      '  } else {\n' +
      '    render();\n' +
      '  }\n' +
      '})();\n' +
      '  </script>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div id="app"></div>\n' +
      '</body>\n' +
      '</html>';
    // Ensure dist directory exists (redundant but safe)
    fs.mkdirSync(distDir, { recursive: true }); // This ensures the dist directory exists
    // Write the HTML file
    fs.writeFileSync(path.join(distDir, outputFileName), html); // This writes the HTML file
    // Mark success for this page
    ora().succeed(`Built dist/${outputFileName}`);
  }));
} // This is the end of the compileVibeScript function

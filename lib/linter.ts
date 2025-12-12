// Import fs module to read files
import fs from "fs"; // This imports the file system module

// This function lints a VibeScript file and returns issues
export function lintVibeScript(file: any): any { // This is the main linting function
  // Read the source file as UTF-8 text
  const src: any = fs.readFileSync(file, "utf8"); // This reads the source file
  // Array to store all linting issues
  const issues: any = []; // This initializes the issues array
  // Split source into lines for line number tracking
  const lines: any = src.split("\n"); // This splits source into lines

  // Parse things to check their descriptions
  // This regex matches thing/component declarations
  const thingRegex: any = /(?:thing|component)\s+(\w+):\s*([\s\S]*?)(?=(?:thing|component|page|source)\s+\w+:|$)/g; // This is the regex for parsing things
  let match: any; // This declares the match variable
  // Track all thing names for unused check
  const thingNames: any = new Set(); // This creates a set to track thing names
  // Track line numbers for things
  const thingLines: any = {}; // This creates an object to track line numbers

  // Reset regex lastIndex
  thingRegex.lastIndex = 0; // This resets the regex position
  // Loop through all thing matches
  while ((match = thingRegex.exec(src))) { // This loops through thing matches
    // Extract thing name and body
    const [, name, body]: any = match; // This destructures the regex match
    // Add to set of thing names
    thingNames.add(name); // This adds the name to the set
    // Find the line number where this thing starts
    const beforeMatch: any = src.substring(0, match.index); // This gets text before the match
    const lineNum: any = beforeMatch.split("\n").length; // This calculates the line number
    // Store line number
    thingLines[name] = lineNum; // This stores the line number for the thing

    // Trim the body
    const bodyText: any = body.trim(); // This trims whitespace from the body
    // Extract the prompt (first quoted string or first line)
    let prompt: any = ""; // This initializes the prompt variable
    if (bodyText.startsWith('"') && bodyText.includes('"', 1)) { // This checks for quoted prompt
      const firstQuoteEnd: any = bodyText.indexOf('"', 1); // This finds the end quote position
      prompt = bodyText.substring(1, firstQuoteEnd); // This extracts the quoted prompt
    } else { // This is the else for unquoted prompt
      const firstLine: any = bodyText.split("\n")[0].trim(); // This gets the first line
      prompt = firstLine.replace(/^["']|["']$/g, ''); // This cleans the prompt
    } // This is the end of the prompt extraction
    
    // Check if prompt is too short (less than 10 characters)
    if (prompt.length < 10) { // This checks if the description is too short
      // Add a warning issue
      issues.push({ // This adds a warning to the issues array
        type: "warning", // This sets the issue type
        message: `Thing "${name}" has a very short description (${prompt.length} chars). Vibe coders usually write more!`, // This is the warning message
        line: lineNum, // This is the line number
        thing: name // This is the thing name
      }); // This closes the issues.push call
    } // This is the end of the short prompt check

    // Check if prompt contains emojis
    const emojiRegex: any = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u; // This is the regex for detecting emojis
    if (!emojiRegex.test(prompt)) { // This checks if no emojis are found
      // Add a warning if no emojis found
      issues.push({ // This adds a warning to the issues array
        type: "warning", // This sets the issue type
        message: `Thing "${name}" has no emojis in its description. Real vibe coders use emojis everywhere! 🎨`, // This is the warning message
        line: lineNum, // This is the line number
        thing: name // This is the thing name
      }); // This closes the issues.push call
    } // This is the end of the emoji check
    
    // Check if prompt is too generic
    const genericWords: any = ["thing", "component", "stuff", "something", "element"]; // This is the list of generic words to avoid
    const lowerPrompt: any = prompt.toLowerCase(); // This converts the prompt to lowercase
    if (genericWords.some((word: any) => lowerPrompt.includes(word))) { // This checks if any generic words are used
      // Add a warning for generic descriptions
      issues.push({ // This adds a warning to the issues array
        type: "warning", // This sets the issue type
        message: `Thing "${name}" uses generic words. Be more specific!`, // This is the warning message
        line: lineNum, // This is the line number
        thing: name // This is the thing name
      }); // This closes the issues.push call
    } // This is the end of the generic words check
  } // This is the end of the thing parsing while loop

  // Parse pages to check their content
  const pageRegex: any = /page\s+(\w+):([\s\S]*?)(?=page\s+\w+:|source\s+\w+\s+\w+:|(?:thing|component)\s+\w+:|$)/g; // This is the regex for parsing pages
  const pageNames: any = new Set(); // This creates a set to track page names
  // Reset regex lastIndex
  pageRegex.lastIndex = 0; // This resets the regex position
  // Loop through all page matches
  while ((match = pageRegex.exec(src))) {
    // Extract page name and body
    const [, pageName, body]: any = match;
    // Add to set of page names
    pageNames.add(pageName);
    // Find line number
    const beforeMatch: any = src.substring(0, match.index);
    const lineNum: any = beforeMatch.split("\n").length;
    
    // Check if page body is empty or very short
    const bodyText: any = body.trim();
    if (bodyText.length < 5) {
      // Add a warning for empty pages
      issues.push({
        type: "warning",
        message: `Page "${pageName}" is empty or nearly empty. Add some things!`,
        line: lineNum,
        page: pageName
      });
    }
    
    // Check if page references any things
    const referencedThings: any = Array.from(thingNames).filter((name: any) => bodyText.includes(name));
    if (referencedThings.length === 0 && !bodyText.match(/^["']/)) {
      // Add a warning if page doesn't reference any things
      issues.push({
        type: "warning",
        message: `Page "${pageName}" doesn't reference any things. What's the point?`,
        line: lineNum,
        page: pageName
      });
    }
  }

  // Check for unused things (things that are never referenced)
  // Build a set of all referenced thing names
  const referencedThings: any = new Set();
  // Check in page bodies
  pageRegex.lastIndex = 0;
  while ((match = pageRegex.exec(src))) {
    const [, , body]: any = match;
    // Find all thing references in the body
    for (const thingName of thingNames) {
      const typedThingName: any = thingName as any;
      if (body.includes(typedThingName)) {
        referencedThings.add(typedThingName);
      }
    }
  }
  
  // Check in thing bodies (for nested things)
  thingRegex.lastIndex = 0;
  while ((match = thingRegex.exec(src))) {
    const [, name, body]: any = match;
    // Find all thing references in this thing's body
    for (const thingName of thingNames) {
      const typedThingName: any = thingName as any;
      if (typedThingName !== name && body.includes(typedThingName)) {
        referencedThings.add(typedThingName);
      }
    }
  }
  
  // Check for unused things
  for (const thingName of thingNames) {
    const typedThingName: any = thingName as any;
    if (!referencedThings.has(typedThingName)) {
      // Add a warning for unused things
      issues.push({
        type: "warning",
        message: `Thing "${typedThingName}" is defined but never used. Dead code vibes! 🪦`,
        line: thingLines[typedThingName],
        thing: typedThingName
      });
    }
  }

  // Check if there are any pages at all
  if (pageNames.size === 0) {
    // Add an error if no pages found
    issues.push({
      type: "error",
      message: "No pages found! You need at least one page to deploy. Vibe coders deploy everything! 🚀",
      line: 1
    });
  }

  // Check if there's an "App" page (recommended)
  if (!pageNames.has("App")) {
    // Add a suggestion
    issues.push({
      type: "info",
      message: "Consider creating a page named 'App' - it will become index.html automatically!",
      line: 1
    });
  }

  // Check for sources (Supabase)
  const sourceRegex: any = /source\s+(\w+)\s+(\w+):/g;
  const sources: any = [];
  // Reset regex lastIndex
  sourceRegex.lastIndex = 0;
  // Loop through all source matches
  while ((match = sourceRegex.exec(src))) {
    // Extract source type and name
    const [, type, name]: any = match;
    // Add to sources array
    sources.push({ type, name });
  }
  
  // If sources exist, check if they're actually used
  if (sources.length > 0) {
    const sourceNames: any = sources.map((s: any) => s.name);
    const sourceUsed: any = sourceNames.some((name: any) => {
      // Check if source name appears in any thing prompts
      thingRegex.lastIndex = 0;
      while ((match = thingRegex.exec(src))) {
        const [, , body]: any = match;
        if (body.toLowerCase().includes(name.toLowerCase())) {
          return true;
        }
      }
      return false;
    });
    
    if (!sourceUsed) {
      // Add a warning if sources are defined but not used
      issues.push({
        type: "warning",
        message: "You defined data sources but aren't using them! Real vibe coders use Supabase for everything! 🔥",
        line: 1
      });
    }
  }

  // Suggest model upgrade if file is large or complex
  const lineCount: any = lines.length;
  const thingCount: any = thingNames.size;
  if (lineCount > 100 || thingCount > 20) {
    // Add a suggestion for larger projects
    issues.push({
      type: "info",
      message: `This is a big project (${lineCount} lines, ${thingCount} things). Consider using --model gpt-5 for better results!`,
      line: 1
    });
  }

  // Return all issues
  return issues;
}

// This function prints linting results in a human-readable format
export function printLintResults(issues: any, file: any): any { // This is the lint results printing function
  // If no issues, print success message
  if (issues.length === 0) { // This checks if there are no issues
    console.log("✨ Your vibes are perfect! No issues found."); // This prints the success message
    return 0; // This returns 0 exit code for success
  } // This is the end of the no issues check

  // Group issues by type
  const errors: any = issues.filter((i: any) => i.type === "error"); // This filters for error issues
  const warnings: any = issues.filter((i: any) => i.type === "warning"); // This filters for warning issues
  const infos: any = issues.filter((i: any) => i.type === "info"); // This filters for info issues

  // Print summary
  console.log(`\n🔍 Vibe Linter Results for ${file}:`); // This prints the results header
  console.log(`   ${errors.length} errors, ${warnings.length} warnings, ${infos.length} suggestions\n`); // This prints the summary

  // Print errors first
  if (errors.length > 0) { // This checks if there are errors to print
    console.log("❌ Errors:"); // This prints the errors header
    for (const issue of errors) { // This loops through each error
      const typedIssue: any = issue as any;
      console.log(`   Line ${typedIssue.line}: ${typedIssue.message}`); // This prints each error
    } // This is the end of the errors loop
    console.log(); // This prints a blank line
  } // This is the end of the errors check

  // Print warnings
  if (warnings.length > 0) { // This checks if there are warnings to print
    console.log("⚠️  Warnings:"); // This prints the warnings header
    for (const issue of warnings) { // This loops through each warning
      const typedIssue: any = issue as any;
      const location: any = typedIssue.thing ? `Thing "${typedIssue.thing}"` : typedIssue.page ? `Page "${typedIssue.page}"` : ""; // This creates location info
      console.log(`   Line ${typedIssue.line}${location ? ` (${location})` : ""}: ${typedIssue.message}`); // This prints each warning
    } // This is the end of the warnings loop
    console.log(); // This prints a blank line
  } // This is the end of the warnings check

  // Print suggestions/info
  if (infos.length > 0) { // This checks if there are suggestions to print
    console.log("💡 Suggestions:"); // This prints the suggestions header
    for (const issue of infos) { // This loops through each suggestion
      const typedIssue: any = issue as any;
      console.log(`   ${typedIssue.message}`); // This prints each suggestion
    } // This is the end of the suggestions loop
    console.log(); // This prints a blank line
  } // This is the end of the suggestions check

  // Return non-zero exit code if there are errors
  return errors.length > 0 ? 1 : 0; // This returns the exit code based on errors
} // This is the end of the printLintResults function


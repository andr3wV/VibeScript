// Import chokidar library for file watching
import chokidar from "chokidar"; // This imports the file watching library
// Import the compileVibeScript function from compiler
import { compileVibeScript } from "./compiler.js"; // This imports the main compilation function
// Import express framework for HTTP server
import express from "express"; // This imports the Express web framework
// Import WebSocketServer from ws library for live reload
import { WebSocketServer } from "ws"; // This imports WebSocket server for live reloading
// Import path module for file path handling
import path from "path"; // This imports the path utilities
// Import fs module for file system operations
import fs from "fs"; // This imports the file system module
// Import ora for loading spinners
import ora from "ora"; // This imports the ora spinner library

// This function watches a VibeScript file and rebuilds on changes
export async function watchVibeScript(file: any, config: any = {}): Promise<any> { // This is the main watch function
  // Print a message that we're starting to watch
  console.log("👀 Watching for changes with live reload..."); // This logs the start of watching
  // Print a message that we're building initially
  console.log("🔨 Building initial pages..."); // This logs the initial build start

  // Create a new Express application instance
  const app: any = express(); // This creates the Express app instance
  // Resolve the absolute path to the dist directory
  const distPath: any = path.resolve("dist"); // This gets the absolute path to dist

  // Ensure 'dist' directory exists before serving static files or reading from it
  // Check if the dist directory exists
  if (!fs.existsSync(distPath)) { // This checks if dist directory exists
    // Create the directory recursively if it doesn't exist
    fs.mkdirSync(distPath, { recursive: true }); // This creates the dist directory
  } // This is the end of the directory check

  // Serve static files from 'dist' directory
  // This middleware serves files from the dist directory
  app.use(express.static(distPath)); // This sets up static file serving

  // Handle the root path ("/") to serve a default HTML file
  // Define a route handler for GET requests to "/"
  app.get("/", (req: any, res: any) => { // This sets up the root route handler
    // Get all HTML files in the dist directory
    // Read the directory contents
    const htmlFiles: any = fs // This starts reading the directory
      // Read all files in the dist directory
      .readdirSync(distPath) // This reads the dist directory
      // Filter to only HTML files
      .filter((f: any) => f.endsWith(".html")); // This filters for HTML files

    // Initialize target file variable
    let targetFile: any = null; // This initializes the target file variable

    // Prioritize 'index.html' if it exists
    // Check if index.html is in the list
    if (htmlFiles.includes("index.html")) { // This checks for index.html
      // Set target file to index.html
      targetFile = "index.html"; // This sets target to index.html
    } else if (htmlFiles.length > 0) { // This checks if any HTML files exist
      // Otherwise, pick the first HTML file found in the directory
      // Use the first HTML file as fallback
      targetFile = htmlFiles[0]; // This sets target to first HTML file
    } // This is the end of the target file selection

    // Check if we found a target file
    if (targetFile) { // This checks if we have a target file
      // Log which file we're serving
      console.log(`Serving default page: ${targetFile}`); // This logs the served file
      // Send the file as the response
      res.sendFile(path.join(distPath, targetFile)); // This sends the HTML file
    } else { // This is the else for no target file
      // If no HTML files are found, send a helpful message
      // Send a 404 status with an error message
      res.status(404).send( // This sends a 404 response
        "<h1>No HTML pages found in 'dist' directory.</h1>" +
          "<p>Please ensure your VibeScript file generates at least one page.</p>"
      ); // This is the 404 message HTML
    } // This is the end of the target file check
  }); // This is the end of the route handler

  // Get the port number from config or use default
  const port: any = Number((config as any).port || 3000); // This gets the port from config or defaults to 3000
  // Declare variables for server and WebSocket server
  let server: any; // This declares the HTTP server variable
  let wss: any; // This declares the WebSocket server variable

  // WebSocket for reload events
  // This function broadcasts a message to all connected WebSocket clients
  function broadcast(msg: any): any {
    // Check if WebSocket server exists
    if (wss) {
      // Loop through all connected clients
      wss.clients.forEach((client: any) => {
        // Check if client connection is open (readyState 1 = OPEN)
        if (client.readyState === 1) {
          // Send the message to this client
          client.send(msg);
        }
      });
    }
  }

  // Inject live reload script into HTML files
  // This function adds the live reload WebSocket script to all HTML files
  function injectLiveReload(): any {
    // Define the live reload script as a string
    const script: any = `
      <script id="vibe-live-reload">
        // Create a WebSocket connection to the current host
        const ws = new WebSocket("ws://" + location.host);
        // Set up message handler for WebSocket events
        ws.onmessage = (event) => {
          // If message is "reload", reload the page
          if (event.data === "reload") {
            // Reload the current page
            location.reload();
          }
          // If message is "building", show the building overlay
          if (event.data === "building") {
            // Create a new div element for the overlay
            const overlay = document.createElement("div");
            // Set the overlay ID so we can remove it later
            overlay.id = "vibe-overlay";
            // Set position to fixed so it covers the whole page
            overlay.style.position = "fixed";
            // Position at top of page
            overlay.style.top = 0;
            // Position at left of page
            overlay.style.left = 0;
            // Make it full width
            overlay.style.width = "100%";
            // Make it full height
            overlay.style.height = "100%";
            // Set semi-transparent black background
            overlay.style.background = "rgba(0,0,0,0.7)";
            // Set text color to white
            overlay.style.color = "white";
            // Set font size to 2rem
            overlay.style.fontSize = "2rem";
            // Use flexbox for centering
            overlay.style.display = "flex";
            // Center vertically
            overlay.style.alignItems = "center";
            // Center horizontally
            overlay.style.justifyContent = "center";
            // Set the text content
            overlay.innerText = "✨ Building vibes...";
            // Add the overlay to the page body
            document.body.appendChild(overlay);
          }
          // If message is "done", remove the building overlay
          if (event.data === "done") {
            // Find the overlay element by ID
            const overlay = document.getElementById("vibe-overlay");
            // Remove it if it exists
            if (overlay) overlay.remove();
          }
        };
      </script>
    `;

    // Loop through all files in the dist directory
    fs.readdirSync(distPath).forEach((file: any) => {
      // Check if file is an HTML file
      if (file.endsWith(".html")) {
        // Build the full file path
        const filePath: any = path.join(distPath, file);
        // Read the HTML file content
        let html: any = fs.readFileSync(filePath, "utf8");
        // Only inject the script if it's not already present in the HTML
        // Check if the script ID is not already in the HTML
        if (!html.includes('id="vibe-live-reload"')) {
          // Replace the closing body tag with script + closing body tag
          html = html.replace("</body>", `${script}</body>`);
          // Write the modified HTML back to the file
          fs.writeFileSync(filePath, html);
        }
      }
    });
  }

  // Initial build - do this BEFORE starting the server
  // Wrap in try-catch to handle errors
  try {
    // Create a spinner for the initial build
    const buildSpinner: any = ora("Building initial pages...").start(); // This creates and starts the build spinner
    // Compile the VibeScript file with the given config
    await compileVibeScript(file, config);
    // Stop spinner with success
    buildSpinner.succeed("Initial build complete!"); // This stops the spinner with success
    
    // Now start the server after build is done
    // Start the Express server listening on the specified port
    server = app.listen(port, () => {
      // Print the server URL
      console.log(`🌐 Dev server running at http://localhost:${port}`);
      // Print a helpful message
      console.log("🚀 Ready for development! Open the link above in your browser.");
    });

    // Initialize WebSocket after server is running
    // Create a new WebSocket server attached to the HTTP server
    wss = new WebSocketServer({ server });
    
    // Inject live reload and notify clients
    // Add the live reload script to HTML files
    injectLiveReload();
    // Broadcast "done" message to remove any building overlay
    broadcast("done");
    
  } catch (error: any) {
    // If build fails, print error and exit
    console.error("❌ Build failed:", (error as any).message);
    // Exit with error code 1
    process.exit(1);
  }

  // Watch for changes
  // Use chokidar to watch the VibeScript file for changes
  chokidar.watch(file).on("change", async () => {
    // Create a spinner for the rebuild
    const rebuildSpinner: any = ora("File changed, rebuilding...").start(); // This creates and starts the rebuild spinner
    // Broadcast "building" message to show overlay
    broadcast("building");
    // Wrap in try-catch to handle rebuild errors
    try {
      // Recompile the file
      await compileVibeScript(file, config);
      // Stop spinner with success
      rebuildSpinner.succeed("Rebuild complete!"); // This stops the spinner with success
      // Re-inject live reload script if files were re-generated
      injectLiveReload();
      // Broadcast "done" to remove overlay
      broadcast("done");
      // Broadcast "reload" to trigger page reload
      broadcast("reload");
    } catch (error: any) {
      // Stop spinner with error
      rebuildSpinner.fail(`Rebuild failed: ${(error as any).message}`); // This stops the spinner with error
      // Remove building overlay even on failure
      broadcast("done");
    }
  });
}

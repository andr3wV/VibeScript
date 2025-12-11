#!/usr/bin/env node
// This shebang tells the system to use node to run this script

// Import the Commander library for CLI argument parsing
import { Command } from "commander";
// Import fs module to read files
import fs from "fs";
// Import path module to handle file paths
import path from "path";
// Import chalk library for colored terminal output
import chalk from "chalk";
// Import ora for loading spinners
import ora from "ora";
// Import the compileVibeScript function from the compiler module
import { compileVibeScript } from "../lib/compiler.js";
// Import the watchVibeScript function from the watcher module
import { watchVibeScript } from "../lib/watcher.js";
// Import the deployToVercel function from the deploy module
import { deployToVercel } from "../lib/deploy.js";
// Import linting functions from the linter module
import { lintVibeScript, printLintResults } from "../lib/linter.js";
// Import dotenv for environment variable loading
import dotenv from "dotenv";

// This function loads the config file if it exists
function loadConfig() {
  // Resolve the path to vibe.config.json in the current directory
  const configPath = path.resolve("vibe.config.json");
  // Check if the config file exists
  if (fs.existsSync(configPath)) {
    // Try to read and parse the config file
    try {
      // Read the file as UTF-8 and parse as JSON
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      // If parsing fails, log an error
      console.error("❌ Failed to parse vibe.config.json:", err.message);
    }
  }
  // Return empty object if no config file exists
  return {};
}

// This function prints the configuration to the console
function printConfig(config) {
  // Print a cyan bold header
  console.log(chalk.cyan.bold("\n🚀 VibeScript Configuration"));
  // Print a cyan separator line
  console.log(chalk.cyan("───────────────────────────"));
  // Print the model setting
  console.log(`${chalk.bold("Model:")} ${config.model}`);
  // Print the port setting
  console.log(`${chalk.bold("Port:")} ${config.port}`);
  // Print that cache is enabled
  console.log(`${chalk.bold("Cache:")} Enabled`);
  // Print a blank line
  console.log();
}

// This function checks if the OpenAI API key is set
function checkApiKey() { // This is the API key check function
  // Check if the environment variable is missing or empty
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") { // This checks for missing API key
    // Try to load from .env file
    dotenv.config(); // This loads the .env file if it exists

    // Check again after loading .env file
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") { // Still missing after loading .env
      // Print an error message in red bold
      console.error( // This prints the error message
        chalk.red.bold("\n❌ Missing OpenAI API Key!") + // This is the error header
          // Print instructions on how to set it
          "\n\nPlease set your API key before running VibeScript:\n" + // This is the instruction text
          // Print the export command in yellow
          chalk.yellow("export OPENAI_API_KEY=\"your_api_key_here\"") + // This is the export command
          "\n\nOr create a " + chalk.green(".env") + " file with:\n" + // This introduces the .env option
          chalk.green("OPENAI_API_KEY=your_api_key_here") + // This is the .env content
          // Print a link to get an API key
          "\n\nGet one here: " + // This introduces the link
          chalk.blue.underline("https://platform.openai.com/account/api-keys") + // This is the link
          // Print a blank line
          "\n" // This adds a newline
      ); // This closes the console.error call
      // Exit with error code 1
      process.exit(1); // This exits the program with error
    } // This is the end of the still missing check
  } // This is the end of the API key check
} // This is the end of the checkApiKey function

// Create a new Commander program instance
const program = new Command();
// Load the config file
const fileConfig = loadConfig();

// Set up the main program command
program
  // Set the command name
  .name("vibe")
  // Set the description
  .description("Compile and run VibeScript projects")
  // Set the version number
  .version("1.3.2");

// Add a lint subcommand
program
  // Define the command name
  .command("lint")
  // Set the description
  .description("Lint your VibeScript file for vibe violations")
  // Add a required file argument
  .argument("<file>", "VibeScript file to lint")
  // Define the action to run when lint command is executed
  .action((file) => { // This is the lint command action handler
    // Check if the file exists
    if (!fs.existsSync(file)) { // This checks if the input file exists
      // Print error if file doesn't exist
      console.error(chalk.red(`❌ File not found: ${file}`)); // This prints the file not found error
      // Exit with error code
      process.exit(1); // This exits with error code 1
    } // This is the end of the file existence check
    // Run the linter on the file
    const issues = lintVibeScript(file); // This runs the linting function
    // Print the results
    const exitCode = printLintResults(issues, file); // This prints the lint results
    // Exit with the appropriate code
    process.exit(exitCode); // This exits with the lint exit code
  }); // This is the end of the lint command action

// Set up the main compile command
program
  // Add a required file argument
  .argument("<file>", "VibeScript file to compile")
  // Add watch option flag
  .option("-w, --watch", "Enable hot reload")
  // Add deploy option flag
  .option("-d, --deploy", "Deploy to Vercel after build")
  // Add model option with default from config
  .option(
    "-m, --model <model>",
    "Choose OpenAI model (gpt-5.1, gpt-5-mini, gpt-5-nano, gpt-oss-120b, gpt-oss-20b, etc)",
    fileConfig.model || "gpt-5-nano"
  )
  // Add port option with default from config
  .option(
    "-p, --port <port>",
    "Port for dev server",
    fileConfig.port || 3000
  )
  // Define the action to run when the main command is executed
  .action(async (file, options) => {
    // Check API key before doing anything
    checkApiKey();

    // Build the config object from options
    const config = {
      // Use the model from options
      model: options.model,
      // Use the port from options
      port: options.port,
    };

    // Print the configuration
    printConfig(config);

    // Check if watch mode is enabled
    if (options.watch) {
      // Print a message about starting dev mode
      console.log(chalk.blue("🔄 Starting development mode..."));
      // Start watching the file
      await watchVibeScript(file, config);
    } else {
      // Create a main spinner for the build process
      const buildSpinner = ora("Building your vibes...").start(); // This creates and starts the build spinner
      try { // This starts a try block for error handling
        // Compile the file
        await compileVibeScript(file, config);
        // Stop spinner with success
        buildSpinner.succeed("Build complete! Check the 'dist' folder for your generated files."); // This stops the spinner with success
        // Check if deploy flag is set
        if (options.deploy) { // This checks if deploy flag is set
          // Create a spinner for deployment
          const deploySpinner = ora("Deploying to Vercel...").start(); // This creates and starts the deploy spinner
          try { // This starts a try block for deployment
            // Deploy to Vercel
            await deployToVercel(); // This deploys to Vercel
            // Stop spinner with success
            deploySpinner.succeed("Deployed to Vercel successfully!"); // This stops the spinner with success
          } catch (error) { // This catches deployment errors
            // Stop spinner with error
            deploySpinner.fail(`Deployment failed: ${error.message}`); // This stops the spinner with error
            // Exit with error code
            process.exit(1); // This exits with error code
          } // This is the end of deployment try-catch block
        } // This is the end of deploy flag check
      } catch (error) { // This catches build errors
        // Stop spinner with error
        buildSpinner.fail(`Build failed: ${error.message}`); // This stops the spinner with error
        // Exit with error code
        process.exit(1); // This exits with error code
      } // This is the end of build try-catch block
    }
  });

// Parse the command line arguments
program.parse(process.argv); // This parses the CLI arguments and executes the appropriate command

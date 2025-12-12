// Import execSync from child_process to run shell commands
import { execSync } from "child_process";

// This function deploys the dist directory to Vercel
export async function deployToVercel(): Promise<any> {
  // Print a message that we're deploying
  console.log("🚀 Deploying to Vercel...");
  // Wrap in try-catch to handle deployment errors
  try {
    // Run the vercel CLI command to deploy the dist directory to production
    // npx vercel --prod dist will deploy the dist folder to Vercel's production environment
    // stdio: "inherit" means the command's output will be shown in the terminal
    execSync("npx vercel --prod dist", { stdio: "inherit" });
  } catch (err: any) {
    // If deployment fails, print an error message
    console.error("❌ Deployment failed:", (err as any).message);
  }
}

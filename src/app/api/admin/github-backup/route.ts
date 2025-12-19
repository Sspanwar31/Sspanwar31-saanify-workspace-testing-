import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { username, repo, token, branch } = await req.json();

    if (!username || !repo || !token) {
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    // 1. CONSTRUCT REMOTE URL (Securely with token)
    const remoteName = 'origin';
    const remoteUrl = `https://${token}@github.com/${username}/${repo}.git`;
    
    // 2. DEFINE COMMANDS - ROBUST SEQUENCE WITH BRANCH CREATION
    const commands = [
      // 1. Configure Identity
      `git config --global user.name "${username}"`,
      `git config --global user.email "${username}@users.noreply.github.com"`,
      
      // 2. Initialize and Clean
      `git init`,
      `git remote remove origin || true`, // Remove existing to avoid conflicts
      
      // 3. Add Remote (Securely)
      `git remote add origin ${remoteUrl}`,
      
      // 4. Stage & Commit
      `git add .`,
      `git commit -m "Auto-Backup via Admin Panel: ${new Date().toISOString()}" || echo "No changes to commit"`,
      
      // 5. CRITICAL FIX: Force Branch Creation
      // Try to create 'main', if exists, switch to it
      `git checkout -b ${branch || 'main'} || git checkout ${branch || 'main'}`,
      
      // 6. Push
      `git push -u origin ${branch || 'main'} --force`
    ];

    console.log("🚀 Starting GitHub Backup...");

    // 3. EXECUTE ROBUST COMMAND SEQUENCE
    for (const cmd of commands) {
      // Mask token in logs for security
      console.log(`> ${cmd.replace(token, '******')}`);
      await execAsync(cmd);
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error("❌ Backup Failed:", error);
    // Return 500 but with error details
    return NextResponse.json({ 
      error: error.message || 'Git command failed', 
      details: error.stderr 
    }, { status: 500 });
  }
}
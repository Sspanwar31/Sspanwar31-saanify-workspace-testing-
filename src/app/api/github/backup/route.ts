import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper to collect all files recursively, skipping node_modules and .env*
function collectFiles(dir: string, baseDir = dir, files: { [key: string]: string } = {}) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (/^node_modules/.test(relPath) || /^\.env/.test(entry.name)) continue;

    if (entry.isDirectory()) {
      collectFiles(fullPath, baseDir, files);
    } else {
      const content = fs.readFileSync(fullPath);
      files[relPath] = content.toString("base64");
    }
  }
  return files;
}

// Helper: GitHub API call
async function githubApi(url: string, method = "GET", body?: any, token?: string) {
  const headers: any = { Authorization: `token ${token}`, "Content-Type": "application/json" };
  const res = await fetch(`https://api.github.com${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  return res.json();
}

// Main backup handler
export async function POST(req: NextRequest) {
  try {
    const { repo, owner, branch = "main", token } = await req.json();

    // Step 1: Collect files
    const files = collectFiles(process.cwd());

    // Step 2: Get latest commit & tree
    const latestCommit = await githubApi(`/repos/${owner}/${repo}/commits/${branch}`, "GET", undefined, token);
    let baseTreeSha = latestCommit.commit.tree.sha;

    // Step 3: Create blobs individually & prepare tree
    const tree: any[] = [];
    for (const [filePath, content] of Object.entries(files)) {
      const blob = await githubApi(`/repos/${owner}/${repo}/git/blobs`, "POST", {
        content,
        encoding: "base64",
      }, token);

      tree.push({
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }

    // Step 4: Create new tree referencing blobs
    const newTree = await githubApi(`/repos/${owner}/${repo}/git/trees`, "POST", {
      base_tree: baseTreeSha,
      tree,
    }, token);

    // Step 5: Create commit with safe retry (fast-forward handling)
    const commitBody = {
      message: `Backup: ${new Date().toISOString()}`,
      tree: newTree.sha,
      parents: [latestCommit.sha],
    };

    const MAX_RETRIES = 3;
    let commit;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        commit = await githubApi(`/repos/${owner}/${repo}/git/commits`, "POST", commitBody, token);
        break;
      } catch (err: any) {
        if (err.message.includes("fast-forward") && attempt < MAX_RETRIES - 1) {
          attempt++;
          const latest = await githubApi(`/repos/${owner}/${repo}/commits/${branch}`, "GET", undefined, token);
          commitBody.parents = [latest.sha];
        } else throw err;
      }
    }

    // Step 6: Update branch reference
    await githubApi(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, "PATCH", {
      sha: commit.sha,
      force: false,
    }, token);

    // Step 7: Local git fallback
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync(`git add .`, { timeout: 180000 });
      await execAsync(`git commit -m "Backup: ${new Date().toISOString()}" || true`, { timeout: 180000 });
      await execAsync(`git push origin ${branch}`, { timeout: 300000 });
    } catch (localErr) {
      console.warn("Local git backup failed", localErr);
    }

    return NextResponse.json({ success: true, message: "Backup completed successfully." });
  } catch (error: any) {
    console.error("Backup failed:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, token, files, message = "Quick Backup" } = await request.json();

    if (!owner || !repo || !token || !files)
      return NextResponse.json({ error: "owner, repo, token & files required" }, { status: 400 });

    const time = new Date().toISOString();

    // 1) Get current HEAD commit
    const head = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    const baseCommitSha = head.object.sha;

    // 2) Get base tree
    const baseTree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    // 3) Upload new files as BLOB
    const tree = [];
    for (const path in files) {
      const blob = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: files[path], encoding: "utf-8" })
      }).then(r => r.json());

      tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    }

    // 4) Create new tree
    const newTree = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ base_tree: baseTree.tree.sha, tree })
    }).then(r => r.json());

    // 5) Create commit
    const commit = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: `🚀 Backup: ${time} → ${message}`,
        tree: newTree.sha,
        parents: [baseCommitSha]
      })
    }).then(r => r.json());

    // 6) Update HEAD pointer
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sha: commit.sha })
    });

    return NextResponse.json({
      success: true,
      pushed: Object.keys(files).length,
      commit: commit.sha,
      time
    });

  } catch (e) {
    return NextResponse.json({ error: e.message || "Backup Failed" }, { status: 500 });
  }
}
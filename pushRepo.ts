import type { VercelRequest, VercelResponse } from '@vercel/node';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}

interface FileEntry { path: string; content: string; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ ok:false, errors:['Use POST'] });

  const { token, owner, repoName, files, commitMessage } = (req.body ?? {}) as {
    token?: string; owner?: string; repoName?: string;
    files?: FileEntry[]; commitMessage?: string;
  };

  if (!token || !owner || !repoName)
    return res.status(400).json({ ok:false, errors:['token, owner, repoName required'] });
  if (!Array.isArray(files) || !files.length)
    return res.status(400).json({ ok:false, errors:['files array required'] });

  const baseUrl    = `https://api.github.com/repos/${owner}/${repoName}`;
  const headers    = { Authorization:`Bearer ${token}`, 'Content-Type':'application/json', 'User-Agent':'AppForge/2.0' };
  const message    = (commitMessage as string) ?? 'feat: initial commit by AppForge';
  const pushed: string[] = [];
  const failed:  string[] = [];

  // Push files sequentially to avoid rate limit
  for (const file of files.slice(0, 50)) { // cap at 50 files per push
    try {
      const b64 = Buffer.from(file.content, 'utf8').toString('base64');

      // Check if file exists (get its sha for update)
      let sha: string | undefined;
      const getRes = await fetch(`${baseUrl}/contents/${file.path}`, { headers });
      if (getRes.ok) {
        const existing = await getRes.json() as { sha?: string };
        sha = existing.sha;
      }

      const body: Record<string,unknown> = { message, content: b64 };
      if (sha) body['sha'] = sha;

      const putRes = await fetch(`${baseUrl}/contents/${file.path}`, {
        method: 'PUT', headers, body: JSON.stringify(body),
      });

      if (putRes.ok) pushed.push(file.path);
      else failed.push(file.path);
    } catch {
      failed.push(file.path);
    }
  }

  return res.status(200).json({
    ok:     failed.length === 0,
    data: {
      pushed:     pushed.length,
      failed:     failed.length,
      failedPaths: failed,
      repoUrl:    `https://github.com/${owner}/${repoName}`,
      commitMessage: message,
    },
    warnings: failed.length ? [`${failed.length} file(s) failed to push`] : [],
  });
}

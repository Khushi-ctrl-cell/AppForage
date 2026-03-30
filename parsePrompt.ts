import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsePrompt }  from './parser';
import { scanBlocked }  from './validator';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ ok:false, errors:['Method not allowed'] });

  const { prompt } = (req.body ?? {}) as { prompt?: string };
  if (!prompt || prompt.trim().length < 5)
    return res.status(400).json({ ok:false, errors:['"prompt" is required (min 5 chars)'] });

  const blocked = scanBlocked(prompt.trim());
  if (blocked.length)
    return res.status(422).json({ ok:false, errors: blocked.map(e=>`[BLOCKED] ${e.rejected}: ${e.reason}`), suggestions: blocked.map(e=>e.suggestion) });

  try {
    const parsed = parsePrompt(prompt.trim());
    return res.status(200).json({
      ok: true,
      data: {
        projectName: parsed.projectName, description: parsed.description,
        frontend: parsed.frontend, backend: parsed.backend,
        infra: parsed.infra, extras: parsed.extras, confidence: parsed.confidence,
      },
      warnings: parsed.warnings,
      meta: { primaryFrontend:'angular', angularEnforced:true, parsedAt: new Date().toISOString() },
    });
  } catch(e) {
    return res.status(500).json({ ok:false, errors:[`Parse error: ${e instanceof Error ? e.message : e}`] });
  }
}

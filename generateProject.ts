import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsePrompt }              from './parser';
import type { ParsedStack }         from './parser';
import { scanBlocked, validateStack } from './validator';
import { generateProject }          from './generator';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ ok:false, errors:['Method not allowed'] });

  const body = (req.body ?? {}) as Record<string,unknown>;
  const { prompt, backend, frontend, infra, extras } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5)
    return res.status(400).json({ ok:false, errors:['"prompt" required (min 5 chars)'] });

  const blocked = scanBlocked(prompt.trim());
  if (blocked.length)
    return res.status(422).json({ ok:false, errors: blocked.map(e=>`[BLOCKED] ${e.rejected}: ${e.reason}`) });

  let parsed: ParsedStack;
  try { parsed = parsePrompt(prompt.trim()); }
  catch(e) { return res.status(500).json({ ok:false, errors:[`Parse: ${e instanceof Error?e.message:e}`] }); }

  const allowBE = ['golang','rust','zig','deno'];
  const allowFE = ['angular','angular+flutter','flutter'];
  if (typeof backend  === 'string' && allowBE.includes(backend))  parsed.backend  = backend  as ParsedStack['backend'];
  if (typeof frontend === 'string' && allowFE.includes(frontend))  parsed.frontend = frontend as ParsedStack['frontend'];
  if (Array.isArray(infra)  && infra.length)  parsed.infra  = infra  as ParsedStack['infra'];
  if (Array.isArray(extras) && extras.length) parsed.extras = extras as ParsedStack['extras'];

  const v = validateStack(parsed);
  if (!v.valid) return res.status(422).json({ ok:false, errors: v.errors.map(e=>`[${e.field.toUpperCase()}] ${e.reason}`) });

  try {
    const project = generateProject(v.stack!);
    return res.status(200).json({
      ok: true,
      data: {
        projectName:  project.projectName,
        description:  project.description,
        stack:        project.stack,
        files:        project.files.map(f => ({ path:f.path, lang:f.lang, content:f.content, size: Buffer.byteLength(f.content,'utf8') })),
        fileTree:     project.fileTree,
        stats:        project.stats,
      },
      warnings: v.warnings,
      meta: { primaryFrontend:'angular', angularEnforced:true, generatedAt: new Date().toISOString() },
    });
  } catch(e) {
    return res.status(500).json({ ok:false, errors:[`Generation failed: ${e instanceof Error?e.message:e}`] });
  }
}

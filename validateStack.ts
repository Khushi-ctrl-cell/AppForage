import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateSingleTech, validateStack, ALLOWED_BACKENDS, ALLOWED_FRONTENDS, ALLOWED_INFRA } from './validator';
import type { ParsedStack } from './parser';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ ok:false, errors:['Use POST'] });

  const body = (req.body ?? {}) as Record<string,unknown>;

  if (Array.isArray(body.technologies)) {
    const techs = (body.technologies as unknown[]).filter(t=>typeof t==='string'&&(t as string).trim()) as string[];
    if (!techs.length) return res.status(400).json({ ok:false, errors:['"technologies" must be non-empty'] });
    const results = techs.map(t=>validateSingleTech(t));
    return res.status(200).json({
      ok:true, allAllowed: results.every(r=>r.allowed), results,
      summary:{ total:results.length, allowed:results.filter(r=>r.allowed).length, blocked:results.filter(r=>!r.allowed).length },
      meta:{ allowedBackends:ALLOWED_BACKENDS, allowedFrontends:ALLOWED_FRONTENDS, allowedInfra:ALLOWED_INFRA },
    });
  }

  if (body.stack && typeof body.stack === 'object') {
    const s = body.stack as Record<string,unknown>;
    const mock: ParsedStack = {
      projectName: (s.projectName as string)||'check', description:'',
      backend:  (s.backend  as ParsedStack['backend']) ||'golang',
      frontend: (s.frontend as ParsedStack['frontend'])||'angular',
      infra:    Array.isArray(s.infra)  ? s.infra  as ParsedStack['infra']   : ['docker','vercel'],
      extras:   Array.isArray(s.extras) ? s.extras as ParsedStack['extras']  : ['rest-api'],
      confidence:0, warnings:[],
    };
    const v = validateStack(mock);
    return res.status(v.valid?200:422).json({ ok:v.valid, valid:v.valid, errors:v.errors, warnings:v.warnings, stack:v.stack });
  }

  return res.status(400).json({ ok:false, errors:['Provide "technologies" (string[]) or "stack" object'] });
}

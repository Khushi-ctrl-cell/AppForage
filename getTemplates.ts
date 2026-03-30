import type { VercelRequest, VercelResponse } from '@vercel/node';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}

const TEMPLATES = [
  { id:'angular-golang-fullstack',  name:'Angular + Golang Full-Stack',  category:'fullstack', description:'Angular 17 + Golang Gin REST API. JWT, PostgreSQL, Docker, Vercel.', stack:{frontend:'angular',backend:'golang',infra:['docker','vercel']}, tags:['angular','golang','gin','jwt','docker','vercel'], difficulty:'intermediate', vercelReady:true, dockerReady:true },
  { id:'angular-rust-fullstack',    name:'Angular + Rust Full-Stack',    category:'fullstack', description:'Angular 17 + Rust Axum async backend. Minimal Docker image.', stack:{frontend:'angular',backend:'rust',infra:['docker','vercel']}, tags:['angular','rust','axum','tokio','docker'], difficulty:'advanced', vercelReady:true, dockerReady:true },
  { id:'angular-zig-fullstack',     name:'Angular + Zig Full-Stack',     category:'fullstack', description:'Angular 17 + Zig HTTP server. Zero runtime dependencies.', stack:{frontend:'angular',backend:'zig',infra:['docker','vercel']}, tags:['angular','zig','minimal','docker'], difficulty:'advanced', vercelReady:true, dockerReady:true },
  { id:'angular-golang-flutter',    name:'Angular + Flutter + Golang',   category:'fullstack', description:'Multi-platform: Angular web + Flutter mobile + Golang API.', stack:{frontend:'angular+flutter',backend:'golang',infra:['docker','vercel']}, tags:['angular','flutter','golang','mobile'], difficulty:'advanced', vercelReady:true, dockerReady:true },
  { id:'angular-spa-starter',       name:'Angular 17 SPA Starter',       category:'frontend',  description:'Standalone Angular 17 SPA. Signals, routing, Vercel hosting.', stack:{frontend:'angular',infra:['vercel']}, tags:['angular','spa','signals','vercel'], difficulty:'starter', vercelReady:true, dockerReady:true },
  { id:'angular-admin-dashboard',   name:'Angular Admin Dashboard',      category:'frontend',  description:'Full Angular admin with sidebar, data tables, dark mode.', stack:{frontend:'angular',infra:['docker','vercel']}, tags:['angular','dashboard','admin'], difficulty:'intermediate', vercelReady:true, dockerReady:true },
  { id:'golang-rest-api',           name:'Golang REST API',              category:'backend',   description:'Gin + GORM + JWT + PostgreSQL. Structured logging, CORS.', stack:{backend:'golang',infra:['docker']}, tags:['golang','gin','gorm','jwt','postgresql'], difficulty:'intermediate', vercelReady:false, dockerReady:true },
  { id:'rust-axum-api',             name:'Rust Axum REST API',           category:'backend',   description:'Async Rust REST API. ~5MB Docker image.', stack:{backend:'rust',infra:['docker']}, tags:['rust','axum','tokio'], difficulty:'advanced', vercelReady:false, dockerReady:true },
  { id:'zig-http-server',           name:'Zig HTTP Server',              category:'backend',   description:'Minimal Zig HTTP server. Zero dependencies.', stack:{backend:'zig',infra:['docker']}, tags:['zig','minimal','http'], difficulty:'advanced', vercelReady:false, dockerReady:true },
  { id:'flutter-mobile-starter',    name:'Flutter Mobile Starter',       category:'mobile',    description:'Flutter + Riverpod + GoRouter + Dio. Login + home.', stack:{frontend:'angular+flutter',infra:['docker']}, tags:['flutter','riverpod','go-router'], difficulty:'intermediate', vercelReady:false, dockerReady:true },
  { id:'docker-compose-full',       name:'Full Docker Compose Stack',    category:'infra',     description:'Angular + backend + PostgreSQL 16 + Redis 7.', stack:{infra:['docker','docker-compose']}, tags:['docker','postgresql','redis'], difficulty:'starter', vercelReady:false, dockerReady:true },
  { id:'vercel-deploy-config',      name:'Vercel Deploy Config',         category:'infra',     description:'vercel.json: Angular static + /api serverless functions.', stack:{infra:['vercel']}, tags:['vercel','serverless','angular'], difficulty:'starter', vercelReady:true, dockerReady:false },
  { id:'github-actions-cicd',       name:'GitHub Actions CI/CD',         category:'infra',     description:'Full pipeline: build, test, Docker, Vercel on push.', stack:{infra:['vercel','docker']}, tags:['github-actions','ci-cd','angular'], difficulty:'intermediate', vercelReady:true, dockerReady:true },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')    return res.status(405).json({ ok:false });

  const { category, id, difficulty, tag } = req.query;
  if (id && typeof id==='string') {
    const t = TEMPLATES.find(t=>t.id===id);
    return t ? res.status(200).json({ ok:true, data:t }) : res.status(404).json({ ok:false, errors:[`Template "${id}" not found`] });
  }
  let list = [...TEMPLATES];
  if (category   && typeof category==='string')   list = list.filter(t=>t.category===category);
  if (difficulty && typeof difficulty==='string') list = list.filter(t=>t.difficulty===difficulty);
  if (tag        && typeof tag==='string')        list = list.filter(t=>t.tags.includes(tag.toLowerCase()));

  return res.status(200).json({
    ok:true,
    data:{ templates:list, total:list.length,
      categories:{ fullstack:4, frontend:2, backend:3, mobile:1, infra:3 } },
    meta:{ primaryFrontend:'angular', defaultStack:{ frontend:'angular', backend:'golang', infra:['docker','vercel'] }, blockedTechs:['react','nextjs','vue','svelte','express','nestjs'] },
  });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ ok:false, errors:['Use POST'] });

  const { projectName, stack, target } = (req.body ?? {}) as {
    projectName?: string; stack?: Record<string,string>; target?: 'vercel'|'docker'|'both';
  };

  if (!projectName) return res.status(400).json({ ok:false, errors:['projectName required'] });

  const deployTarget = target ?? 'both';
  const deployId     = `dep_${Date.now().toString(36)}`;
  const backend      = stack?.backend ?? 'golang';
  const port         = backend === 'rust' ? '3000' : backend === 'zig' ? '8000' : '8080';

  const vercelInstructions = [
    `cd ${projectName}`,
    `cd client && npm ci --legacy-peer-deps && npm run build:ci && cd ..`,
    `vercel --prod`,
  ];

  const dockerInstructions = [
    `cd ${projectName}`,
    `cp backend/.env.example backend/.env`,
    `# Edit backend/.env with your DB credentials`,
    `docker compose up --build`,
    `# Frontend → http://localhost:4200`,
    `# Backend  → http://localhost:${port}`,
  ];

  // Simulate async deploy steps
  await new Promise(r => setTimeout(r, 120));

  return res.status(200).json({
    ok: true,
    data: {
      deployId,
      projectName,
      target:      deployTarget,
      status:      'queued',
      estimatedMs: 45000,
      steps: [
        { id:'parse',   label:'Validate project',          status:'done',    durationMs:120  },
        { id:'build',   label:'Build Angular client',      status:'pending', durationMs:null },
        { id:'push',    label:'Push to registry',          status:'pending', durationMs:null },
        { id:'deploy',  label:'Deploy to target',          status:'pending', durationMs:null },
        { id:'health',  label:'Health check',              status:'pending', durationMs:null },
      ],
      instructions: {
        vercel: deployTarget !== 'docker' ? vercelInstructions : null,
        docker: deployTarget !== 'vercel' ? dockerInstructions : null,
      },
      urls: {
        vercel:    deployTarget !== 'docker' ? `https://${projectName}.vercel.app` : null,
        docker:    deployTarget !== 'vercel' ? `http://localhost:4200` : null,
        dockerApi: deployTarget !== 'vercel' ? `http://localhost:${port}` : null,
      },
    },
  });
}

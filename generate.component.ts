import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStore, GeneratedFile } from '../../store/app.store';
import { ApiService } from '../../services/api.service';

type GenStep = 'idle' | 'parsing' | 'generating' | 'done' | 'error';

interface ExtraChip { label: string; key: string; on: boolean; }

@Component({
  selector: 'app-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-inner" style="max-width:1100px">

      <div class="page-header">
        <div class="page-eyebrow">POST /api/parsePrompt → POST /api/generateProject</div>
        <h1>Generate Project</h1>
        <p>Describe your app. AppForge enforces Angular as the primary frontend and generates Docker-ready, Vercel-compatible output.</p>
      </div>

      <div class="grid-2" style="align-items:start;gap:20px">

        <!-- LEFT: PROMPT FORM -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Prompt Panel -->
          <div class="card brand-accent">
            <div class="card-header">
              <div class="card-title">
                <div class="card-title-dot"></div>
                Prompt Input
              </div>
              <span class="badge" [ngClass]="{
                'badge-ghost':   step() === 'idle',
                'badge-warning': step() === 'parsing',
                'badge-info':    step() === 'generating',
                'badge-success': step() === 'done',
                'badge-error':   step() === 'error'
              }">{{ stepLabels[step()] }}</span>
            </div>

            <div class="card-body">
              <textarea
                class="prompt-textarea"
                [(ngModel)]="prompt"
                [disabled]="isGenerating()"
                rows="7"
                placeholder="e.g. Build a REST API in Golang with JWT authentication and PostgreSQL database, an Angular admin dashboard with real-time WebSocket updates, Docker multi-service setup, and Vercel deployment. Include Swagger docs and unit tests.">
              </textarea>

              <!-- Options row -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">
                <div class="form-group" style="margin:0">
                  <label>Backend</label>
                  <select class="form-select" [(ngModel)]="selBackend" [disabled]="isGenerating()">
                    <option value="">Auto-detect</option>
                    <option value="golang">Golang (Gin + GORM)</option>
                    <option value="rust">Rust (Axum)</option>
                    <option value="zig">Zig (minimal)</option>
                    <option value="deno">Deno (TS)</option>
                  </select>
                </div>
                <div class="form-group" style="margin:0">
                  <label>Frontend</label>
                  <select class="form-select" [(ngModel)]="selFrontend" [disabled]="isGenerating()">
                    <option value="angular">Angular 17 (enforced)</option>
                    <option value="angular+flutter">Angular + Flutter</option>
                  </select>
                </div>
                <div class="form-group" style="margin:0">
                  <label>Deploy</label>
                  <select class="form-select" [(ngModel)]="selDeploy" [disabled]="isGenerating()">
                    <option value="both">Vercel + Docker</option>
                    <option value="vercel">Vercel Only</option>
                    <option value="docker">Docker Only</option>
                  </select>
                </div>
              </div>

              <!-- Extras chips -->
              <div style="margin-top:14px">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Extras</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                  <div *ngFor="let c of extraChips"
                       class="chip"
                       [class.active]="c.on"
                       (click)="!isGenerating() && (c.on = !c.on)">
                    {{ c.label }}
                  </div>
                </div>
              </div>

              <!-- Progress bar -->
              <div *ngIf="isGenerating()" style="margin-top:14px">
                <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-bottom:5px">
                  <span>{{ progressLabel() }}</span>
                  <span>{{ progress() }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="progress()"></div>
                </div>
              </div>

              <!-- Action buttons -->
              <div style="display:flex;gap:10px;margin-top:14px">
                <button
                  class="btn btn-primary btn-lg"
                  style="flex:1"
                  [disabled]="isGenerating() || !prompt.trim()"
                  (click)="generateProject()">
                  <span *ngIf="isGenerating()" class="spinner"></span>
                  <svg *ngIf="!isGenerating()" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L8.5 5.5 13 7 8.5 8.5 7 13 5.5 8.5 1 7 5.5 5.5 7 1z" fill="white"/>
                  </svg>
                  {{ isGenerating() ? stepLabels[step()] : 'Generate Project' }}
                </button>
                <button *ngIf="step() !== 'idle'" class="btn btn-secondary" (click)="reset()">Reset</button>
              </div>

              <!-- Errors -->
              <div *ngIf="store.genError().length" style="margin-top:12px">
                <div class="alert alert-error">
                  <div class="alert-icon">✕</div>
                  <div>
                    <div style="font-weight:600;margin-bottom:4px">Blocked / Error</div>
                    <div *ngFor="let e of store.genError()" style="font-size:11px;margin-top:2px">{{ e }}</div>
                  </div>
                </div>
              </div>

              <!-- Warnings -->
              <div *ngIf="store.genWarnings().length" style="margin-top:8px">
                <div class="alert alert-warning">
                  <div class="alert-icon">⚠</div>
                  <div>
                    <div *ngFor="let w of store.genWarnings()" style="font-size:11px">{{ w }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Parsed Stack Preview -->
          <div class="card" *ngIf="store.parsedStack()">
            <div class="card-header">
              <div class="card-title">Parsed Stack</div>
              <span class="badge badge-success">{{ store.parsedStack()!.confidence }}% confidence</span>
            </div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
                <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
                  <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Frontend</div>
                  <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--brand-light)">{{ store.parsedStack()!.frontend }}</div>
                </div>
                <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
                  <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Backend</div>
                  <div style="font-family:var(--font-mono);font-size:13px;font-weight:600">{{ store.parsedStack()!.backend }}</div>
                </div>
                <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
                  <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Infra</div>
                  <div style="font-size:11px;font-family:var(--font-mono);color:var(--text-secondary)">{{ store.parsedStack()!.infra.join(' · ') }}</div>
                </div>
                <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
                  <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Extras</div>
                  <div style="font-size:11px;font-family:var(--font-mono);color:var(--text-secondary)">{{ store.parsedStack()!.extras.slice(0,3).join(', ') }}{{ store.parsedStack()!.extras.length > 3 ? '...' : '' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Terminal -->
          <div class="terminal-window">
            <div class="terminal-bar">
              <div class="t-dot" style="background:#ff5f57"></div>
              <div class="t-dot" style="background:#febc2e"></div>
              <div class="t-dot" style="background:#28c840"></div>
              <span class="t-title">appforge — console</span>
            </div>
            <div class="terminal-body" style="max-height:200px;overflow-y:auto" #termBody>
              <div class="t-line" *ngFor="let line of termLines">
                <span [class]="line.cls">{{ line.text }}</span>
              </div>
              <div class="t-line" *ngIf="step() === 'idle' || step() === 'done'">
                <span class="t-prompt">›</span>
                <span class="t-muted">Awaiting prompt<span class="t-cursor"></span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: OUTPUT -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- File Explorer + Code Preview -->
          <div class="card" *ngIf="store.currentProject()" style="height:calc(100vh - 200px);display:flex;flex-direction:column">
            <div class="card-header">
              <div class="card-title">
                <div class="card-title-dot" style="background:var(--success);box-shadow:0 0 8px var(--success)"></div>
                {{ store.currentProject()!.projectName }}
                <span class="badge badge-success" style="margin-left:4px">{{ store.currentProject()!.stats.totalFiles }} files</span>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-secondary btn-sm" (click)="copyAll()" title="Copy all files">Copy All</button>
                <button class="btn btn-secondary btn-sm" (click)="openInViewer()">Viewer →</button>
                <button *ngIf="store.github().connected" class="btn btn-github btn-sm" (click)="pushToGithub()">
                  <span *ngIf="githubLoading()" class="spinner" style="width:10px;height:10px;border-width:1.5px"></span>
                  Push to GitHub
                </button>
                <button class="btn btn-primary btn-sm" (click)="deploy()">
                  <span *ngIf="deployLoading()" class="spinner" style="width:10px;height:10px;border-width:1.5px"></span>
                  Deploy
                </button>
              </div>
            </div>

            <!-- Stack badges -->
            <div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap">
              <span class="badge badge-angular">Angular</span>
              <span class="badge" [class]="'badge-' + store.currentProject()!.stack.backend">{{ store.currentProject()!.stack.backend }}</span>
              <span class="badge badge-ghost" *ngFor="let lang of store.currentProject()!.stats.languages.slice(0,4)">{{ lang }}</span>
            </div>

            <!-- Split pane: file tree + code -->
            <div style="display:flex;flex:1;overflow:hidden">
              <!-- File tree -->
              <div style="width:220px;border-right:1px solid var(--border);overflow-y:auto;padding:8px">
                <div class="file-tree">
                  <div class="file-item"
                       *ngFor="let f of store.currentProject()!.files"
                       [class.active]="store.selectedFile()?.path === f.path"
                       (click)="selectFile(f)">
                    <span class="file-lang-badge" [style.color]="langColor(f.lang)">{{ langBadge(f.lang) }}</span>
                    <span class="file-path">{{ f.path }}</span>
                    <span class="file-size">{{ formatSize(f.size) }}</span>
                  </div>
                </div>
              </div>

              <!-- Code preview -->
              <div style="flex:1;overflow:hidden;display:flex;flex-direction:column">
                <div *ngIf="store.selectedFile()" style="display:flex;flex-direction:column;height:100%">
                  <div class="code-header" style="border-radius:0;border-bottom:1px solid var(--border)">
                    <span class="code-path">{{ store.selectedFile()!.path }}</span>
                    <button class="btn btn-ghost btn-sm" (click)="copyFile()">{{ copied() ? '✓ Copied' : 'Copy' }}</button>
                  </div>
                  <div style="flex:1;overflow-y:auto">
                    <pre class="code-block" style="border:none;border-radius:0;height:100%;margin:0"><code>{{ store.selectedFile()!.content }}</code></pre>
                  </div>
                </div>
                <div *ngIf="!store.selectedFile()" class="empty-state">
                  <div class="empty-title">Select a file</div>
                </div>
              </div>
            </div>

            <!-- Success / Deploy bar -->
            <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--success)">
                ✓ {{ store.currentProject()!.stats.totalFiles }} files · {{ store.currentProject()!.stats.languages.join(' · ') }}
              </div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">
                Run: <code style="background:var(--bg-hover);padding:1px 5px;border-radius:3px">docker compose up --build</code>
              </div>
            </div>
          </div>

          <!-- Empty output state -->
          <div class="card" *ngIf="!store.currentProject()" style="min-height:400px">
            <div class="empty-state">
              <svg class="empty-icon" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="4" width="32" height="40" rx="3" stroke="currentColor" stroke-width="2"/>
                <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <div class="empty-title">No project generated yet</div>
              <div class="empty-desc">Write a prompt and click Generate Project to create your first app.</div>
            </div>
          </div>

          <!-- Deploy result -->
          <div class="card" *ngIf="deployResult">
            <div class="card-header">
              <div class="card-title">
                <div class="card-title-dot" style="background:var(--info);box-shadow:0 0 8px var(--info)"></div>
                Deploy Instructions
              </div>
            </div>
            <div class="card-body">
              <div *ngIf="deployResult.instructions?.vercel" style="margin-bottom:14px">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Vercel</div>
                <pre class="code-block" style="font-size:11px">{{ deployResult.instructions.vercel.join('\n') }}</pre>
              </div>
              <div *ngIf="deployResult.instructions?.docker">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Docker</div>
                <pre class="code-block" style="font-size:11px">{{ deployResult.instructions.docker.join('\n') }}</pre>
              </div>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                <a *ngIf="deployResult.urls?.vercel" [href]="deployResult.urls.vercel" target="_blank" class="btn btn-primary btn-sm">Open Vercel →</a>
                <a *ngIf="store.currentProject()?.githubUrl" [href]="store.currentProject()!.githubUrl" target="_blank" class="btn btn-github btn-sm">View on GitHub →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GenerateComponent {
  readonly store  = inject(AppStore);
  private api     = inject(ApiService);
  private router  = inject(Router);

  prompt      = '';
  selBackend  = '';
  selFrontend = 'angular';
  selDeploy   = 'both';

  extraChips: ExtraChip[] = [
    { label:'JWT Auth',    key:'jwt-auth',    on:true  },
    { label:'PostgreSQL',  key:'postgresql',  on:true  },
    { label:'Docker',      key:'docker',      on:true  },
    { label:'CI/CD',       key:'ci-cd',       on:false },
    { label:'Redis',       key:'redis',       on:false },
    { label:'Swagger',     key:'swagger',     on:false },
    { label:'Unit Tests',  key:'unit-tests',  on:false },
    { label:'README',      key:'readme',      on:true  },
  ];

  step         = signal<GenStep>('idle');
  progress     = signal(0);
  progressLabel= signal('');
  termLines    = signal<{ cls:string; text:string }[]>([
    { cls:'t-muted', text:'$ AppForge v2.0 — Angular-primary AI app generator' },
    { cls:'t-muted', text:'$ Awaiting prompt...' },
  ]);

  copied       = signal(false);
  githubLoading= signal(false);
  deployLoading= signal(false);
  deployResult: { instructions: Record<string,string[]|null>; urls: Record<string,string|null> } | null = null;

  readonly isGenerating = computed(() => this.step() === 'parsing' || this.step() === 'generating');

  readonly stepLabels: Record<GenStep,string> = {
    idle:       'ready',
    parsing:    'parsing prompt...',
    generating: 'generating project...',
    done:       'complete',
    error:      'error',
  };

  private log(text: string, cls = 't-muted'): void {
    this.termLines.update(lines => [...lines, { cls, text }]);
  }

  /** ── CRITICAL: Calls /api/parsePrompt then /api/generateProject ── */
  generateProject(): void {
    if (!this.prompt.trim() || this.isGenerating()) return;

    this.store.startGeneration();
    this.step.set('parsing');
    this.progress.set(0);
    this.deployResult = null;
    this.termLines.set([{ cls:'t-muted', text:`$ appforge generate` }]);

    // ── Step 1: POST /api/parsePrompt ─────────────────────────────────
    this.store.parseLoading.set(true);
    this.progress.set(15);
    this.progressLabel.set('Parsing prompt with AI...');
    this.log('$ POST /api/parsePrompt', 't-prompt');

    this.api.parsePrompt(this.prompt.trim()).subscribe({
      next: res => {
        this.store.parseLoading.set(false);

        if (!res.ok || !res.data) {
          this.store.genError.set(res.errors ?? ['Parse failed']);
          this.step.set('error');
          this.log('✕ Parse failed: ' + (res.errors?.[0] ?? 'unknown'), 't-muted');
          return;
        }

        this.store.parsedStack.set(res.data);
        if (res.warnings?.length) this.store.genWarnings.set(res.warnings);

        this.log(`✓ Frontend: ${res.data.frontend} | Backend: ${res.data.backend} | Confidence: ${res.data.confidence}%`, 't-cmd');
        if (res.warnings?.length) this.log(`⚠ ${res.warnings[0]}`, 't-muted');

        // ── Step 2: POST /api/generateProject ─────────────────────────
        this.step.set('generating');
        this.store.genLoading.set(true);
        this.progress.set(40);
        this.progressLabel.set('Generating project files...');
        this.log('$ POST /api/generateProject', 't-prompt');

        const extras = [
          ...res.data.extras,
          ...this.extraChips.filter(c => c.on).map(c => c.key),
        ];

        this.api.generateProject({
          prompt:   this.prompt.trim(),
          backend:  this.selBackend  || res.data.backend,
          frontend: this.selFrontend || res.data.frontend,
          infra:    res.data.infra,
          extras:   [...new Set(extras)],
        }).subscribe({
          next: gr => {
            this.store.genLoading.set(false);

            if (!gr.ok || !gr.data) {
              this.store.genError.set(gr.errors ?? ['Generation failed']);
              this.step.set('error');
              this.log('✕ Generation failed: ' + (gr.errors?.[0] ?? ''), 't-muted');
              return;
            }

            this.progress.set(100);
            this.progressLabel.set('Complete!');

            const project = this.store.addProject({
              projectName: gr.data.projectName,
              description: gr.data.description,
              stack:       gr.data.stack,
              files:       gr.data.files,
              fileTree:    gr.data.fileTree,
              stats:       gr.data.stats,
            });

            this.step.set('done');

            this.log(`✓ ${gr.data.stats.totalFiles} files generated`, 't-cmd');
            this.log(`✓ Languages: ${gr.data.stats.languages.join(', ')}`, 't-cmd');
            this.log(`✓ Project: ${gr.data.projectName}`, 't-cmd');
            this.log('› Run: docker compose up --build', 't-info');

            if (gr.warnings?.length) this.store.genWarnings.update(w => [...w, ...gr.warnings!]);
          },
          error: err => {
            this.store.genLoading.set(false);
            const msg = err?.error?.errors?.[0] ?? err?.message ?? 'Network error on /api/generateProject';
            this.store.genError.set([msg]);
            this.step.set('error');
            this.log('✕ ' + msg, 't-muted');
          },
        });
      },
      error: err => {
        this.store.parseLoading.set(false);
        const msg = err?.error?.errors?.[0] ?? err?.message ?? 'Network error on /api/parsePrompt';
        this.store.genError.set([msg]);
        this.step.set('error');
        this.log('✕ ' + msg, 't-muted');
      },
    });
  }

  selectFile(f: GeneratedFile): void { this.store.selectedFile.set(f); this.copied.set(false); }

  copyFile(): void {
    const f = this.store.selectedFile();
    if (!f) return;
    navigator.clipboard.writeText(f.content).then(() => { this.copied.set(true); setTimeout(() => this.copied.set(false), 2000); });
  }

  copyAll(): void {
    const p = this.store.currentProject();
    if (!p) return;
    const all = p.files.map(f => `// ── ${f.path} ──\n${f.content}`).join('\n\n');
    navigator.clipboard.writeText(all);
  }

  openInViewer(): void {
    this.router.navigate(['/viewer']);
  }

  /** POST /api/createRepo + /api/pushRepo */
  pushToGithub(): void {
    const p = this.store.currentProject();
    const gh = this.store.github();
    if (!p || !gh.connected) return;

    this.githubLoading.set(true);
    this.log('$ POST /api/createRepo', 't-prompt');

    this.api.createRepo({ token: gh.token, repoName: p.projectName, description: p.description }).subscribe({
      next: cr => {
        if (!cr.ok || !cr.data) {
          this.log('✕ GitHub repo creation failed: ' + (cr.errors?.[0] ?? ''), 't-muted');
          this.githubLoading.set(false);
          return;
        }

        this.log(`✓ Repo created: ${cr.data.htmlUrl}`, 't-cmd');
        this.log('$ POST /api/pushRepo', 't-prompt');

        this.api.pushRepo({
          token:   gh.token,
          owner:   cr.data.owner,
          repoName: p.projectName,
          files:   p.files,
        }).subscribe({
          next: pr => {
            this.githubLoading.set(false);
            if (pr.ok) {
              this.store.updateProjectGithub(p.id, cr.data!.htmlUrl);
              this.log(`✓ ${pr.data?.pushed ?? 0} files pushed to GitHub`, 't-cmd');
              this.log(`✓ ${cr.data!.htmlUrl}`, 't-info');
            } else {
              this.log('✕ Push failed: ' + (pr.errors?.[0] ?? ''), 't-muted');
            }
          },
          error: () => { this.githubLoading.set(false); this.log('✕ Push network error', 't-muted'); },
        });
      },
      error: () => { this.githubLoading.set(false); this.log('✕ GitHub network error', 't-muted'); },
    });
  }

  /** POST /api/deployProject */
  deploy(): void {
    const p = this.store.currentProject();
    if (!p) return;

    this.deployLoading.set(true);
    this.log('$ POST /api/deployProject', 't-prompt');

    this.api.deployProject({
      projectName: p.projectName,
      stack:       { frontend: p.stack.frontend, backend: p.stack.backend },
      target:      this.selDeploy,
    }).subscribe({
      next: dr => {
        this.deployLoading.set(false);
        if (dr.ok && dr.data) {
          this.deployResult = { instructions: dr.data.instructions, urls: dr.data.urls };
          this.store.updateProjectDeploy(p.id, 'queued', dr.data.urls?.['vercel'] ?? undefined);
          this.log('✓ Deploy job queued — see instructions below', 't-cmd');
        }
      },
      error: () => { this.deployLoading.set(false); this.log('✕ Deploy error', 't-muted'); },
    });
  }

  reset(): void {
    this.step.set('idle');
    this.progress.set(0);
    this.store.genError.set([]);
    this.store.genWarnings.set([]);
    this.deployResult = null;
    this.termLines.set([{ cls:'t-muted', text:'$ AppForge v2.0 — ready' }]);
  }

  langBadge(lang: string): string {
    const m: Record<string,string> = {
      typescript:'TS', go:'Go', rust:'Rs', zig:'Zg',
      dart:'Fl', html:'HT', scss:'SC', json:'JS', yaml:'YM',
      markdown:'MD', toml:'TM', plaintext:'··',
    };
    return m[lang] ?? '··';
  }

  langColor(lang: string): string {
    const m: Record<string,string> = {
      go:'var(--golang)', rust:'var(--rust)', zig:'var(--zig)',
      typescript:'var(--info)', dart:'var(--flutter)',
    };
    return m[lang] ?? 'var(--text-muted)';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}b`;
    return `${(bytes/1024).toFixed(1)}k`;
  }
}

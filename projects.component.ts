import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AppStore, GeneratedProject } from '../../store/app.store';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-inner">

      <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <div class="page-eyebrow">Workspace</div>
          <h1>Projects <span style="font-size:16px;color:var(--text-muted);font-weight:400">({{ store.projectCount() }})</span></h1>
          <p>All generated projects this session. Click to open in viewer.</p>
        </div>
        <a routerLink="/generate" class="btn btn-primary">New Project +</a>
      </div>

      <!-- Empty state -->
      <div class="card" *ngIf="store.projects().length === 0">
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 48 48" fill="none">
            <path d="M8 12A4 4 0 0112 8h24a4 4 0 014 4v24a4 4 0 01-4 4H12a4 4 0 01-4-4V12z" stroke="currentColor" stroke-width="2"/>
            <path d="M16 20h16M16 26h12M16 32h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div class="empty-title">No projects generated yet</div>
          <div class="empty-desc">Use the Generate page to create your first project from a natural language prompt.</div>
          <a routerLink="/generate" class="btn btn-primary" style="margin-top:20px">Generate Project</a>
        </div>
      </div>

      <!-- Projects grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px" *ngIf="store.projects().length > 0">

        <div *ngFor="let p of store.projects()"
             class="card"
             style="cursor:pointer"
             (click)="openProject(p)">

          <div class="card-header">
            <div class="card-title" style="gap:10px">
              <div class="project-icon" [class]="p.stack.backend">{{ backendInitial(p.stack.backend) }}</div>
              <div>
                <div style="font-size:13px;font-weight:600">{{ p.projectName }}</div>
                <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);margin-top:2px">{{ timeAgo(p.generatedAt) }}</div>
              </div>
            </div>
            <span class="badge" [ngClass]="{
              'badge-success': p.deployStatus === 'live',
              'badge-warning': p.deployStatus === 'queued' || p.deployStatus === 'deploying',
              'badge-ghost':   p.deployStatus === 'none',
              'badge-error':   p.deployStatus === 'error'
            }">{{ p.deployStatus === 'none' ? 'local' : p.deployStatus }}</span>
          </div>

          <div class="card-body">
            <!-- Stack badges -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
              <span class="badge badge-angular">Angular</span>
              <span class="badge" [class]="'badge-' + p.stack.backend">{{ p.stack.backend }}</span>
              <span class="badge badge-ghost" *ngIf="p.stack.infra.includes('docker')">Docker</span>
              <span class="badge badge-ghost" *ngIf="p.stack.infra.includes('vercel')">Vercel</span>
            </div>

            <!-- Stats -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
              <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:8px">
                <div style="font-size:18px;font-weight:700;color:var(--text-primary)">{{ p.stats.totalFiles }}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:2px">FILES</div>
              </div>
              <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:8px">
                <div style="font-size:18px;font-weight:700;color:var(--text-primary)">{{ p.stats.languages.length }}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:2px">LANGS</div>
              </div>
              <div style="text-align:center;background:var(--bg-elevated);border-radius:var(--radius-md);padding:8px">
                <div style="font-size:18px;font-weight:700;color:var(--text-primary)">{{ totalKb(p) }}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:2px">KB</div>
              </div>
            </div>

            <!-- Languages used -->
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px">
              <span *ngFor="let lang of p.stats.languages" class="chip" style="cursor:default;font-size:10px;padding:2px 8px">{{ lang }}</span>
            </div>

            <!-- Action buttons -->
            <div style="display:flex;gap:8px" (click)="$event.stopPropagation()">
              <button class="btn btn-secondary btn-sm" style="flex:1" (click)="openProject(p)">
                Open in Viewer
              </button>
              <button *ngIf="store.github().connected && !p.githubUrl" class="btn btn-github btn-sm" (click)="pushToGithub(p)">
                <span *ngIf="pushingId() === p.id" class="spinner" style="width:10px;height:10px;border-width:1.5px"></span>
                <svg *ngIf="pushingId() !== p.id" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                Push
              </button>
              <a *ngIf="p.githubUrl" [href]="p.githubUrl" target="_blank" class="btn btn-github btn-sm" (click)="$event.stopPropagation()">GitHub →</a>
              <button class="btn btn-primary btn-sm" (click)="deploy(p)">
                <span *ngIf="deployingId() === p.id" class="spinner" style="width:10px;height:10px;border-width:1.5px"></span>
                Deploy
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Deploy instructions modal -->
      <div class="modal-overlay" *ngIf="deployInstructions()" (click.self)="deployInstructions.set(null)">
        <div class="modal">
          <div class="modal-header">
            <h2>Deploy Instructions</h2>
            <button class="btn btn-ghost btn-icon" (click)="deployInstructions.set(null)">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="deployInstructions()!.vercel" style="margin-bottom:16px">
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Vercel Deploy</div>
              <pre class="code-block" style="font-size:11px">{{ deployInstructions()!.vercel!.join('\n') }}</pre>
            </div>
            <div *ngIf="deployInstructions()!.docker">
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Docker</div>
              <pre class="code-block" style="font-size:11px">{{ deployInstructions()!.docker!.join('\n') }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="deployInstructions.set(null)">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProjectsComponent {
  readonly store = inject(AppStore);
  private api    = inject(ApiService);
  private router = inject(Router);

  pushingId    = signal('');
  deployingId  = signal('');
  deployInstructions = signal<Record<string,string[]|null> | null>(null);

  openProject(p: GeneratedProject): void {
    this.store.currentProject.set(p);
    if (p.files.length) this.store.selectedFile.set(p.files[0]);
    this.router.navigate(['/viewer']);
  }

  backendInitial(be: string): string {
    return { golang:'Go', rust:'Rs', zig:'Zg', deno:'De' }[be] ?? be.slice(0,2).toUpperCase();
  }

  timeAgo(iso: string): string {
    const d = Date.now() - new Date(iso).getTime();
    if (d < 60000) return 'just now';
    if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
    return `${Math.floor(d/3600000)}h ago`;
  }

  totalKb(p: GeneratedProject): string {
    return (p.files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1);
  }

  pushToGithub(p: GeneratedProject): void {
    const gh = this.store.github();
    if (!gh.connected || this.pushingId()) return;

    this.pushingId.set(p.id);
    this.api.createRepo({ token: gh.token, repoName: p.projectName, description: p.description }).subscribe({
      next: cr => {
        if (!cr.ok || !cr.data) { this.pushingId.set(''); return; }
        this.api.pushRepo({ token: gh.token, owner: cr.data.owner, repoName: p.projectName, files: p.files }).subscribe({
          next: pr => {
            this.pushingId.set('');
            if (pr.ok && cr.data) this.store.updateProjectGithub(p.id, cr.data.htmlUrl);
          },
          error: () => this.pushingId.set(''),
        });
      },
      error: () => this.pushingId.set(''),
    });
  }

  deploy(p: GeneratedProject): void {
    if (this.deployingId()) return;
    this.deployingId.set(p.id);
    this.api.deployProject({ projectName: p.projectName, stack: { frontend: p.stack.frontend, backend: p.stack.backend } }).subscribe({
      next: dr => {
        this.deployingId.set('');
        if (dr.ok && dr.data) {
          this.store.updateProjectDeploy(p.id, 'queued');
          this.deployInstructions.set(dr.data.instructions);
        }
      },
      error: () => this.deployingId.set(''),
    });
  }
}

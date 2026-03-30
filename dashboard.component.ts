import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../store/app.store';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-inner">

      <!-- Header -->
      <div class="page-header">
        <div class="page-eyebrow">AppForge Platform</div>
        <h1>Welcome back 👋</h1>
        <p>AI-powered multi-language app builder. Generate production-ready projects with Angular, Golang, Rust, Zig & more.</p>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card c-brand">
          <div class="stat-label">Projects Generated</div>
          <div class="stat-value">{{ store.projectCount() }}</div>
          <div class="stat-sub">Angular primary · always enforced</div>
          <div class="stat-trend up" *ngIf="store.projectCount() > 0">↑ this session</div>
        </div>
        <div class="stat-card c-info">
          <div class="stat-label">Total Files</div>
          <div class="stat-value">{{ store.totalFilesCount() }}</div>
          <div class="stat-sub">Across all projects</div>
        </div>
        <div class="stat-card c-success">
          <div class="stat-label">API Endpoints</div>
          <div class="stat-value">7</div>
          <div class="stat-sub">Vercel serverless · TS</div>
          <div class="stat-trend up" [class.up]="apiOnline()">{{ apiOnline() ? '● Online' : '○ Checking...' }}</div>
        </div>
        <div class="stat-card c-purple">
          <div class="stat-label">Templates</div>
          <div class="stat-value">13</div>
          <div class="stat-sub">5 categories · all stacks</div>
        </div>
      </div>

      <!-- Quick Actions + Recent Projects -->
      <div class="grid-2" style="margin-bottom:24px">

        <!-- Quick Actions -->
        <div class="card brand-accent">
          <div class="card-header">
            <div class="card-title">
              <div class="card-title-dot"></div>
              Quick Actions
            </div>
          </div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
            <a routerLink="/generate" class="btn btn-primary btn-lg" style="justify-content:flex-start">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 6.5 15.5 8 10 9.5 8 15 6 9.5.5 8 6 6.5 8 1z" fill="white"/>
              </svg>
              Generate New Project
            </a>
            <a routerLink="/templates" class="btn btn-secondary" style="justify-content:flex-start">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="3" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <rect x="1" y="6" width="5.5" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <rect x="8" y="6" width="5" height="3" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <rect x="8" y="11" width="5" height="2" rx="1" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              Browse Templates
            </a>
            <a routerLink="/viewer" class="btn btn-secondary" style="justify-content:flex-start">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1.5" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 5.5l2.5 2.5L4 10.5M8 9.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Open Code Viewer
            </a>
          </div>
        </div>

        <!-- API Status -->
        <div class="card info-accent">
          <div class="card-header">
            <div class="card-title">
              <div class="card-title-dot" style="background:var(--info);box-shadow:0 0 8px var(--info)"></div>
              API Endpoints
            </div>
            <span class="badge" [class]="apiOnline() ? 'badge-success' : 'badge-warning'">
              {{ apiOnline() ? '● All online' : '○ Checking...' }}
            </span>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr *ngFor="let ep of endpoints">
                  <td><span class="badge" [class]="ep.method === 'GET' ? 'badge-success' : 'badge-info'" style="font-family:var(--font-mono)">{{ ep.method }}</span></td>
                  <td style="font-family:var(--font-mono);font-size:11px">{{ ep.path }}</td>
                  <td style="font-size:11px;color:var(--text-muted)">{{ ep.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent projects -->
      <div class="card" *ngIf="store.projects().length > 0">
        <div class="card-header">
          <div class="card-title">Recent Projects</div>
          <a routerLink="/projects" class="btn btn-ghost btn-sm">View all →</a>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Stack</th>
                <th>Files</th>
                <th>Languages</th>
                <th>Generated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of store.projects().slice(0,5)" style="cursor:pointer" [routerLink]="['/viewer']" (click)="openProject(p)">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="project-icon" [class]="p.stack.backend">{{ backendInitial(p.stack.backend) }}</div>
                    <div>
                      <div style="font-weight:500;font-size:13px">{{ p.projectName }}</div>
                      <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">{{ p.stack.backend }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="display:flex;gap:5px">
                    <span class="badge badge-angular">Angular</span>
                    <span class="badge" [class]="'badge-' + p.stack.backend">{{ p.stack.backend }}</span>
                  </div>
                </td>
                <td style="font-family:var(--font-mono);font-size:12px">{{ p.stats.totalFiles }}</td>
                <td style="font-size:11px;color:var(--text-muted)">{{ p.stats.languages.slice(0,3).join(' · ') }}</td>
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">{{ timeAgo(p.generatedAt) }}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': p.deployStatus === 'live',
                    'badge-warning': p.deployStatus === 'queued' || p.deployStatus === 'deploying',
                    'badge-ghost':   p.deployStatus === 'none',
                    'badge-error':   p.deployStatus === 'error'
                  }">{{ p.deployStatus === 'none' ? 'local' : p.deployStatus }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty state -->
      <div class="card" *ngIf="store.projects().length === 0">
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 48 48" fill="none">
            <path d="M24 4L30 18 44 24 30 30 24 44 18 30 4 24 18 18 24 4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          </svg>
          <div class="empty-title">No projects yet</div>
          <div class="empty-desc">Generate your first project using a natural language prompt. Angular is always the primary frontend.</div>
          <a routerLink="/generate" class="btn btn-primary" style="margin-top:20px">Generate First Project</a>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly store = inject(AppStore);
  private api    = inject(ApiService);

  apiOnline = (() => {
    const s = { value: false };
    return () => s.value;
  })();

  endpoints = [
    { method:'POST', path:'/api/parsePrompt',     desc:'NL → stack config'     },
    { method:'POST', path:'/api/generateProject', desc:'Full project generation' },
    { method:'POST', path:'/api/validateStack',   desc:'Tech allowlist check'   },
    { method:'GET',  path:'/api/getTemplates',    desc:'Template catalogue'     },
    { method:'POST', path:'/api/createRepo',      desc:'GitHub repo creation'   },
    { method:'POST', path:'/api/pushRepo',        desc:'Push files to GitHub'   },
    { method:'POST', path:'/api/deployProject',   desc:'Deploy project'         },
  ];

  private _apiOnline = false;
  get apiOnlineVal() { return this._apiOnline; }

  ngOnInit(): void {
    // Check health
    this.api.getTemplates({ category: 'frontend' }).subscribe({
      next: () => { this._apiOnline = true; },
      error: () => { this._apiOnline = false; },
    });
  }

  openProject(p: { id: string; files: unknown[] }): void {
    const proj = this.store.projects().find(x => x.id === p.id);
    if (proj) {
      this.store.currentProject.set(proj);
      if (proj.files.length) this.store.selectedFile.set(proj.files[0]);
    }
  }

  backendInitial(be: string): string {
    const m: Record<string,string> = { golang:'Go', rust:'Rs', zig:'Zg', deno:'De' };
    return m[be] ?? be.slice(0,2).toUpperCase();
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000)    return 'just now';
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }
}

import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppStore, GeneratedFile } from '../../store/app.store';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="display:flex;flex-direction:column;height:calc(100vh - var(--topbar-h));overflow:hidden">

      <!-- Viewer topbar -->
      <div style="padding:12px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0;background:var(--bg-surface)">
        <div class="page-eyebrow" style="margin:0">Code Viewer</div>
        <span *ngIf="store.currentProject()" style="font-size:13px;font-weight:600">
          {{ store.currentProject()!.projectName }}
        </span>
        <span *ngIf="store.currentProject()" class="badge badge-success">
          {{ store.currentProject()!.stats.totalFiles }} files
        </span>

        <!-- Filter -->
        <input *ngIf="store.currentProject()" class="form-input"
               [(ngModel)]="filterQuery"
               placeholder="Filter files..."
               style="width:200px;margin-left:auto" />

        <!-- Actions -->
        <div style="display:flex;gap:8px;flex-shrink:0" *ngIf="store.currentProject()">
          <button class="btn btn-secondary btn-sm" (click)="copyAll()">Copy All</button>
          <button *ngIf="store.github().connected" class="btn btn-github btn-sm" (click)="quickPush()">
            <span *ngIf="pushing()" class="spinner" style="width:10px;height:10px;border-width:1.5px"></span>
            Push to GitHub
          </button>
          <button class="btn btn-primary btn-sm" (click)="quickDeploy()">Deploy</button>
        </div>
      </div>

      <!-- No project -->
      <div *ngIf="!store.currentProject()" class="empty-state" style="flex:1">
        <svg class="empty-icon" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="4" width="32" height="40" rx="3" stroke="currentColor" stroke-width="2"/>
          <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div class="empty-title">No project open</div>
        <div class="empty-desc">Generate a project first, then view its files here.</div>
        <a routerLink="/generate" class="btn btn-primary" style="margin-top:20px">Generate Project</a>
      </div>

      <!-- Split pane viewer -->
      <div *ngIf="store.currentProject()" style="display:flex;flex:1;overflow:hidden">

        <!-- File tree sidebar -->
        <div style="width:260px;border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;overflow:hidden">

          <!-- Language filter tabs -->
          <div style="padding:8px;border-bottom:1px solid var(--border);display:flex;gap:4px;flex-wrap:wrap">
            <button class="btn btn-xs" [class.btn-primary]="langFilter()===''" [class.btn-ghost]="langFilter()!==''" (click)="langFilter.set('')">All</button>
            <button *ngFor="let lang of languages()"
                    class="btn btn-xs"
                    [class.btn-primary]="langFilter()===lang"
                    [class.btn-ghost]="langFilter()!==lang"
                    (click)="langFilter.set(lang)">
              {{ langBadge(lang) }}
            </button>
          </div>

          <div style="flex:1;overflow-y:auto;padding:6px">
            <div class="file-tree">
              <div *ngFor="let f of filteredFiles()"
                   class="file-item"
                   [class.active]="store.selectedFile()?.path === f.path"
                   (click)="selectFile(f)">
                <span class="file-lang-badge" [style.color]="langColor(f.lang)">{{ langBadge(f.lang) }}</span>
                <span class="file-path">{{ f.path }}</span>
                <span class="file-size">{{ formatSize(f.size) }}</span>
              </div>
            </div>
          </div>

          <!-- File count -->
          <div style="padding:8px 12px;border-top:1px solid var(--border);font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">
            {{ filteredFiles().length }} / {{ store.currentProject()!.files.length }} files
          </div>
        </div>

        <!-- Code panel -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">

          <!-- Code header -->
          <div *ngIf="store.selectedFile()" class="code-header" style="border-radius:0;border-bottom:1px solid var(--border);flex-shrink:0">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="file-lang-badge" [style.color]="langColor(store.selectedFile()!.lang)">{{ langBadge(store.selectedFile()!.lang) }}</span>
              <span class="code-path">{{ store.selectedFile()!.path }}</span>
              <span class="badge badge-ghost" style="font-size:9px">{{ formatSize(store.selectedFile()!.size) }}</span>
            </div>
            <div style="display:flex;gap:8px">
              <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">{{ lineCount(store.selectedFile()!.content) }} lines</span>
              <button class="btn btn-ghost btn-sm" (click)="copyFile()">{{ copied() ? '✓ Copied' : 'Copy' }}</button>
            </div>
          </div>

          <!-- Code content -->
          <div *ngIf="store.selectedFile()" style="flex:1;overflow:auto">
            <pre class="code-block" style="margin:0;border:none;border-radius:0;min-height:100%;white-space:pre;tab-size:2"><code>{{ store.selectedFile()!.content }}</code></pre>
          </div>

          <!-- No file selected -->
          <div *ngIf="!store.selectedFile()" class="empty-state" style="flex:1">
            <div class="empty-title">Select a file</div>
            <div class="empty-desc">Click any file in the left panel to view its contents.</div>
          </div>
        </div>

        <!-- Stats panel (collapsible right) -->
        <div style="width:220px;border-left:1px solid var(--border);padding:16px;overflow-y:auto;flex-shrink:0">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Project Stats</div>

          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Frontend</div>
              <div style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--brand-light)">{{ store.currentProject()!.stack.frontend }}</div>
            </div>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Backend</div>
              <div style="font-family:var(--font-mono);font-size:12px;font-weight:600">{{ store.currentProject()!.stack.backend }}</div>
            </div>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Total Files</div>
              <div style="font-size:22px;font-weight:700">{{ store.currentProject()!.stats.totalFiles }}</div>
            </div>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:6px">Languages</div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <div *ngFor="let lang of store.currentProject()!.stats.languages" style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">{{ lang }}</span>
                  <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">{{ langFileCount(lang) }}</span>
                </div>
              </div>
            </div>

            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Generated</div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">{{ formatDate(store.currentProject()!.stats.generatedAt) }}</div>
            </div>

            <!-- GitHub link -->
            <a *ngIf="store.currentProject()!.githubUrl" [href]="store.currentProject()!.githubUrl" target="_blank" class="btn btn-github btn-sm">View on GitHub →</a>
          </div>
        </div>
      </div>

      <!-- Validate panel below -->
      <div style="border-top:1px solid var(--border);flex-shrink:0">
        <div style="padding:10px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">POST /api/validateStack</span>
          <input class="form-input" [(ngModel)]="validateInput" placeholder="angular, golang, react, nextjs..." style="flex:1;max-width:400px" />
          <button class="btn btn-secondary btn-sm" (click)="validate()">Validate</button>
          <div style="display:flex;gap:6px;flex-wrap:wrap" *ngIf="validateResults().length">
            <span *ngFor="let r of validateResults()"
                  class="badge"
                  [class.badge-success]="r.allowed"
                  [class.badge-error]="!r.allowed">
              {{ r.technology }}: {{ r.allowed ? '✓' : '✗' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ViewerComponent {
  readonly store = inject(AppStore);
  private api    = inject(ApiService);

  filterQuery  = '';
  langFilter   = signal('');
  copied       = signal(false);
  validateInput = 'angular, golang, react, nextjs, docker';
  validateResults = signal<{ technology:string; allowed:boolean }[]>([]);
  pushing      = signal(false);
  deploying    = signal(false);

  readonly languages = computed(() => {
    const p = this.store.currentProject();
    if (!p) return [];
    return [...new Set(p.files.map(f => f.lang).filter(Boolean))];
  });

  readonly filteredFiles = computed(() => {
    const p = this.store.currentProject();
    if (!p) return [];
    let files = p.files;
    if (this.langFilter()) files = files.filter(f => f.lang === this.langFilter());
    if (this.filterQuery.trim()) {
      const q = this.filterQuery.trim().toLowerCase();
      files = files.filter(f => f.path.toLowerCase().includes(q));
    }
    return files;
  });

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

  langBadge(lang: string): string {
    const m: Record<string,string> = { typescript:'TS', go:'Go', rust:'Rs', zig:'Zg', dart:'Fl', html:'HT', scss:'SC', json:'JS', yaml:'YM', markdown:'MD', toml:'TM', plaintext:'··' };
    return m[lang] ?? lang.slice(0,2).toUpperCase();
  }

  langColor(lang: string): string {
    const m: Record<string,string> = { go:'var(--golang)', rust:'var(--rust)', zig:'var(--zig)', typescript:'var(--info)', dart:'var(--flutter)' };
    return m[lang] ?? 'var(--text-muted)';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}b`;
    return `${(bytes/1024).toFixed(1)}k`;
  }

  lineCount(content: string): number { return content.split('\n').length; }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en', { dateStyle:'short', timeStyle:'short' });
  }

  langFileCount(lang: string): number {
    return this.store.currentProject()?.files.filter(f => f.lang === lang).length ?? 0;
  }

  validate(): void {
    const techs = this.validateInput.split(',').map(t => t.trim()).filter(Boolean);
    if (!techs.length) return;
    this.api.validateStack({ technologies: techs }).subscribe({
      next: res => { this.validateResults.set(res.results ?? []); },
      error: () => {},
    });
  }

  quickPush(): void {
    const p  = this.store.currentProject();
    const gh = this.store.github();
    if (!p || !gh.connected || this.pushing()) return;
    this.pushing.set(true);
    this.api.createRepo({ token: gh.token, repoName: p.projectName, description: p.description }).subscribe({
      next: cr => {
        if (!cr.ok || !cr.data) { this.pushing.set(false); return; }
        this.api.pushRepo({ token: gh.token, owner: cr.data.owner, repoName: p.projectName, files: p.files }).subscribe({
          next: pr => { this.pushing.set(false); if (pr.ok && cr.data) this.store.updateProjectGithub(p.id, cr.data.htmlUrl); },
          error: () => this.pushing.set(false),
        });
      },
      error: () => this.pushing.set(false),
    });
  }

  quickDeploy(): void {
    const p = this.store.currentProject();
    if (!p || this.deploying()) return;
    this.deploying.set(true);
    this.api.deployProject({ projectName: p.projectName, stack: { frontend: p.stack.frontend, backend: p.stack.backend } }).subscribe({
      next: dr => { this.deploying.set(false); if (dr.ok) this.store.updateProjectDeploy(p.id, 'queued'); },
      error: () => this.deploying.set(false),
    });
  }
}

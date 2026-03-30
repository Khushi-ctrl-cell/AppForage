import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from './store/app.store';

interface NavItem {
  path:  string;
  label: string;
  icon:  string;
  badge?: () => number | null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <!-- TOPBAR -->
    <header class="topbar">
      <div class="topbar-logo">
        <div class="logo-hex" (click)="router.navigate(['/dashboard'])"></div>
        <span class="logo-name">AppForge</span>
        <span class="logo-version">v2.0</span>
      </div>

      <div class="topbar-search">
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input class="search-input" [(ngModel)]="searchQuery" placeholder="Search projects, templates..." (keydown.escape)="searchQuery = ''" />
        </div>
      </div>

      <div class="topbar-right">
        <div class="status-dot" title="API online"></div>

        <button class="topbar-btn" (click)="openGithubModal()">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          {{ store.github().connected ? store.github().username : 'Connect GitHub' }}
        </button>

        <button class="topbar-btn primary" (click)="router.navigate(['/generate'])">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1.5 3.5L11 6l-3.5 1.5L6 11 4.5 7.5 1 6l3.5-1.5L6 1z" fill="white"/>
          </svg>
          Generate
        </button>

        <div class="avatar" (click)="router.navigate(['/settings'])" title="Settings">
          {{ store.github().connected ? store.github().username.charAt(0).toUpperCase() : 'A' }}
        </div>
      </div>
    </header>

    <!-- SHELL -->
    <div class="app-shell">

      <!-- SIDEBAR -->
      <nav class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">Main</div>

          <a *ngFor="let item of mainNav"
             class="sidebar-item"
             [routerLink]="item.path"
             routerLinkActive="active">
            <span class="item-icon" [innerHTML]="item.icon"></span>
            {{ item.label }}
            <span *ngIf="item.badge && item.badge()! > 0" class="item-badge">
              {{ item.badge()! }}
            </span>
          </a>
        </div>

        <div class="sidebar-divider"></div>

        <div class="sidebar-section">
          <div class="sidebar-label">Workspace</div>

          <a *ngFor="let item of workspaceNav"
             class="sidebar-item"
             [routerLink]="item.path"
             routerLinkActive="active">
            <span class="item-icon" [innerHTML]="item.icon"></span>
            {{ item.label }}
          </a>
        </div>

        <!-- Recent projects quick-links -->
        <div class="sidebar-section" *ngIf="store.projects().length > 0">
          <div class="sidebar-label">Recent</div>
          <div class="sidebar-item"
               *ngFor="let proj of store.projects().slice(0, 4)"
               (click)="openProject(proj)">
            <span class="item-icon" [style.color]="langColor(proj.stack.backend)">⬡</span>
            <span style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ proj.projectName }}</span>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="sidebar-tech-pills">
            <span class="tech-pill angular">Angular</span>
            <span class="tech-pill go">Golang</span>
            <span class="tech-pill rust">Rust</span>
            <span class="tech-pill docker">Docker</span>
          </div>
        </div>
      </nav>

      <!-- MAIN -->
      <main class="main-content">
        <div class="page-scroll">
          <router-outlet />
        </div>
      </main>
    </div>

    <!-- GITHUB MODAL -->
    <div class="modal-overlay" *ngIf="showGithubModal()" (click.self)="showGithubModal.set(false)">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ store.github().connected ? 'GitHub Connected' : 'Connect GitHub' }}</h2>
          <button class="btn btn-ghost btn-icon" (click)="showGithubModal.set(false)">✕</button>
        </div>
        <div class="modal-body">

          <div *ngIf="store.github().connected" class="flex items-center gap-3" style="margin-bottom:16px">
            <div class="avatar" style="width:40px;height:40px;font-size:16px">{{ store.github().username.charAt(0).toUpperCase() }}</div>
            <div>
              <div style="font-weight:600;font-size:14px">{{ store.github().username }}</div>
              <div class="badge badge-success" style="margin-top:4px">Connected</div>
            </div>
          </div>

          <div class="form-group">
            <label>{{ store.github().connected ? 'Update Token' : 'Personal Access Token' }}</label>
            <input class="form-input" type="password" [(ngModel)]="githubToken"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" autocomplete="new-password" />
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
              Needs <code style="background:var(--bg-hover);padding:1px 4px;border-radius:3px">repo</code> scope.
              <a href="https://github.com/settings/tokens/new" target="_blank" style="color:var(--info)">Create token →</a>
            </div>
          </div>

          <div *ngIf="githubError()" class="alert alert-error" style="margin-top:8px">{{ githubError() }}</div>
        </div>
        <div class="modal-footer">
          <button *ngIf="store.github().connected" class="btn btn-danger" (click)="disconnectGithub()">Disconnect</button>
          <button class="btn btn-secondary" (click)="showGithubModal.set(false)">Cancel</button>
          <button class="btn btn-github" [disabled]="!githubToken.trim() || connectingGithub()" (click)="connectGithub()">
            <span *ngIf="connectingGithub()" class="spinner"></span>
            {{ connectingGithub() ? 'Connecting...' : 'Connect' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit {
  readonly store  = inject(AppStore);
  readonly router = inject(Router);

  showGithubModal  = signal(false);
  connectingGithub = signal(false);
  githubToken      = '';
  githubError      = signal('');
  searchQuery      = '';

  mainNav: NavItem[] = [
    { path:'/dashboard', label:'Dashboard', icon:'<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>' },
    { path:'/generate',  label:'Generate',  icon:'<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L9 5.5 13.5 7.5 9 9.5 7.5 14 6 9.5 1.5 7.5 6 5.5 7.5 1Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>' },
    { path:'/templates', label:'Templates', icon:'<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="3" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="1" y="6" width="6" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="6" width="5" height="3.5" rx="1" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="11.5" width="5" height="2.5" rx="1" stroke="currentColor" stroke-width="1.2"/></svg>' },
    { path:'/projects',  label:'Projects',  icon:'<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 3.5A1.5 1.5 0 012.5 2h4l1.5 2H13a1.5 1.5 0 011.5 1.5v6A1.5 1.5 0 0113 13H2.5A1.5 1.5 0 011 11.5v-8z" stroke="currentColor" stroke-width="1.2"/></svg>',
      badge: () => this.store.projectCount() || null },
  ];

  workspaceNav: NavItem[] = [
    { path:'/viewer',   label:'Code Viewer', icon:'<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="2" width="13" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 6l2.5 2.5L4 11M8.5 10h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { path:'/settings', label:'Settings',    icon:'<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M6.5 1.5h2l.5 1.5a5 5 0 011.2.7l1.5-.5 1 1.7-1.1 1.1a5 5 0 010 1.4l1.1 1.1-1 1.7-1.5-.5a5 5 0 01-1.2.7L8.5 12h-2l-.5-1.5a5 5 0 01-1.2-.7l-1.5.5-1-1.7L3.4 7.5a5 5 0 010-1.4L2.3 5 3.3 3.3l1.5.5A5 5 0 016 3.1L6.5 1.5z" stroke="currentColor" stroke-width="1.2"/><circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" stroke-width="1.2"/></svg>' },
  ];

  ngOnInit(): void {
    this.store.restoreGithub();
  }

  openProject(proj: { stack: { backend: string }; id: string }): void {
    const p = this.store.projects().find(x => x.id === proj.id);
    if (p) { this.store.currentProject.set(p); if (p.files.length) this.store.selectedFile.set(p.files[0]); }
    this.router.navigate(['/viewer']);
  }

  langColor(backend: string): string {
    const m: Record<string,string> = { golang:'var(--golang)', rust:'var(--rust)', zig:'var(--zig)', angular:'var(--angular)' };
    return m[backend] ?? 'var(--text-muted)';
  }

  openGithubModal(): void { this.githubToken = ''; this.githubError.set(''); this.showGithubModal.set(true); }

  connectGithub(): void {
    if (!this.githubToken.trim()) return;
    this.connectingGithub.set(true);
    this.githubError.set('');

    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${this.githubToken}`, 'User-Agent': 'AppForge/2.0' },
    }).then(r => r.json()).then((data: { login?: string; avatar_url?: string; message?: string }) => {
      if (data.login) {
        this.store.connectGithub(this.githubToken, data.login, data.avatar_url ?? '');
        this.showGithubModal.set(false);
      } else {
        this.githubError.set(data.message ?? 'Invalid token');
      }
    }).catch(() => {
      this.githubError.set('Network error — check token and try again');
    }).finally(() => this.connectingGithub.set(false));
  }

  disconnectGithub(): void { this.store.disconnectGithub(); this.showGithubModal.set(false); }
}

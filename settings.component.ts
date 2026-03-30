import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../store/app.store';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-inner" style="max-width:720px">

      <div class="page-header">
        <div class="page-eyebrow">Configuration</div>
        <h1>Settings</h1>
        <p>Configure GitHub integration, preferences, and platform settings.</p>
      </div>

      <!-- GitHub Integration -->
      <div class="card brand-accent" style="margin-bottom:20px">
        <div class="card-header">
          <div class="card-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--text-secondary)">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub Integration
          </div>
          <span class="badge" [class]="store.github().connected ? 'badge-success' : 'badge-ghost'">
            {{ store.github().connected ? '● Connected' : '○ Not connected' }}
          </span>
        </div>
        <div class="card-body">

          <!-- Connected state -->
          <div *ngIf="store.github().connected" style="display:flex;align-items:center;gap:14px;margin-bottom:20px;padding:14px;background:var(--bg-elevated);border-radius:var(--radius-md)">
            <div class="avatar" style="width:44px;height:44px;font-size:18px">
              {{ store.github().username.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div style="font-size:15px;font-weight:600">{{ store.github().username }}</div>
              <div class="badge badge-success" style="margin-top:4px">Connected to GitHub</div>
            </div>
          </div>

          <div class="form-group">
            <label>Personal Access Token</label>
            <input class="form-input" type="password"
                   [(ngModel)]="ghToken"
                   [placeholder]="store.github().connected ? 'Token saved — enter new to update' : 'ghp_xxxxxxxxxxxxxxxxxxxx'"
                   autocomplete="new-password" />
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
              Requires <code style="background:var(--bg-hover);padding:1px 4px;border-radius:3px">repo</code> scope.
              <a href="https://github.com/settings/tokens/new" target="_blank" style="color:var(--info)">Create token →</a>
            </div>
          </div>

          <div *ngIf="ghError()" class="alert alert-error" style="margin-bottom:12px">{{ ghError() }}</div>

          <div style="display:flex;gap:10px">
            <button class="btn btn-github" [disabled]="!ghToken.trim() || ghLoading()" (click)="connectGithub()">
              <span *ngIf="ghLoading()" class="spinner"></span>
              {{ ghLoading() ? 'Connecting...' : (store.github().connected ? 'Update Token' : 'Connect GitHub') }}
            </button>
            <button *ngIf="store.github().connected" class="btn btn-danger" (click)="store.disconnectGithub()">Disconnect</button>
          </div>
        </div>
      </div>

      <!-- Platform Info -->
      <div class="card info-accent" style="margin-bottom:20px">
        <div class="card-header">
          <div class="card-title">Platform Info</div>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Version</div>
              <div style="font-family:var(--font-mono);font-size:14px;font-weight:600">v2.0.0</div>
            </div>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Primary Frontend</div>
              <div style="font-family:var(--font-mono);font-size:14px;font-weight:600;color:var(--brand-light)">Angular 17</div>
            </div>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Deploy Platform</div>
              <div style="font-family:var(--font-mono);font-size:14px;font-weight:600">Vercel</div>
            </div>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
              <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-bottom:4px">Projects Generated</div>
              <div style="font-size:22px;font-weight:700">{{ store.projectCount() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Allowed Tech Reference -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Technology Rules</div>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
            <div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">✓ Backends</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <div *ngFor="let t of allowedBE" style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--success-dim);border-radius:var(--radius-sm);border:1px solid rgba(0,212,170,0.15)">
                  <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--success)">{{ t.name }}</span>
                  <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">{{ t.note }}</span>
                </div>
              </div>
            </div>
            <div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">✓ Frontends</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <div *ngFor="let t of allowedFE" style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--brand-dim);border-radius:var(--radius-sm);border:1px solid var(--brand-glow)">
                  <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--brand-light)">{{ t.name }}</span>
                  <span *ngIf="t.primary" class="badge badge-brand">primary</span>
                </div>
              </div>
            </div>
            <div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">✗ Blocked</div>
              <div style="display:flex;flex-direction:column;gap:6px">
                <div *ngFor="let t of blocked" style="padding:6px 10px;background:var(--error-dim);border-radius:var(--radius-sm);border:1px solid rgba(255,71,87,0.2)">
                  <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--error)">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  readonly store = inject(AppStore);

  ghToken  = '';
  ghLoading = signal(false);
  ghError   = signal('');

  allowedBE = [
    { name:'golang', note:'Gin + GORM' },
    { name:'rust',   note:'Axum + Tower' },
    { name:'zig',    note:'minimal HTTP' },
    { name:'deno',   note:'TypeScript' },
  ];

  allowedFE = [
    { name:'angular',         primary:true  },
    { name:'angular+flutter', primary:false },
    { name:'flutter',         primary:false },
  ];

  blocked = ['react', 'next.js', 'vue', 'svelte', 'express', 'nestjs', 'django', 'flask'];

  connectGithub(): void {
    if (!this.ghToken.trim()) return;
    this.ghLoading.set(true);
    this.ghError.set('');

    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${this.ghToken}`, 'User-Agent': 'AppForge/2.0' },
    }).then(r => r.json()).then((d: { login?: string; avatar_url?: string; message?: string }) => {
      if (d.login) {
        this.store.connectGithub(this.ghToken, d.login, d.avatar_url ?? '');
        this.ghToken = '';
      } else {
        this.ghError.set(d.message ?? 'Invalid token');
      }
    }).catch(() => {
      this.ghError.set('Network error — check token');
    }).finally(() => this.ghLoading.set(false));
  }
}

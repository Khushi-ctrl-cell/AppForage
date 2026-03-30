/**
 * AppForge v2 — Centralized App State (Angular Signals)
 * Single source of truth for generated projects, GitHub, deploy state.
 */
import { Injectable, signal, computed } from '@angular/core';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedFile {
  path:    string;
  content: string;
  lang:    string;
  size:    number;
}

export interface FileTreeNode {
  name:      string;
  type:      'file' | 'dir';
  path:      string;
  lang?:     string;
  children?: FileTreeNode[];
}

export interface ParsedStack {
  projectName: string;
  description: string;
  frontend:    string;
  backend:     string;
  infra:       string[];
  extras:      string[];
  confidence:  number;
}

export interface GeneratedProject {
  id:          string;
  projectName: string;
  description: string;
  stack: {
    frontend: string;
    backend:  string;
    infra:    string[];
    extras:   string[];
  };
  files:       GeneratedFile[];
  fileTree:    FileTreeNode[];
  stats: {
    totalFiles:  number;
    totalDirs:   number;
    languages:   string[];
    generatedAt: string;
  };
  generatedAt:  string;
  githubUrl?:   string;
  deployUrl?:   string;
  deployStatus: 'none' | 'queued' | 'deploying' | 'live' | 'error';
}

export interface GithubState {
  connected:  boolean;
  token:      string;
  username:   string;
  avatarUrl:  string;
}

export interface DeployStep {
  id:         string;
  label:      string;
  status:     'pending' | 'running' | 'done' | 'error';
  durationMs: number | null;
}

// ── Store ─────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AppStore {

  // ── Generation state ──────────────────────────────────────────────────────
  readonly generating   = signal(false);
  readonly parseLoading = signal(false);
  readonly genLoading   = signal(false);
  readonly genError     = signal<string[]>([]);
  readonly genWarnings  = signal<string[]>([]);
  readonly parsedStack  = signal<ParsedStack | null>(null);
  readonly currentProject = signal<GeneratedProject | null>(null);

  // ── Projects history ──────────────────────────────────────────────────────
  readonly projects = signal<GeneratedProject[]>([]);

  // ── Selected file in viewer ───────────────────────────────────────────────
  readonly selectedFile = signal<GeneratedFile | null>(null);

  // ── GitHub ────────────────────────────────────────────────────────────────
  readonly github = signal<GithubState>({
    connected: false, token: '', username: '', avatarUrl: '',
  });

  readonly githubLoading = signal(false);
  readonly githubError   = signal('');

  // ── Deploy ────────────────────────────────────────────────────────────────
  readonly deployLoading = signal(false);
  readonly deploySteps   = signal<DeployStep[]>([]);
  readonly deployUrl     = signal('');
  readonly deployError   = signal('');

  // ── UI state ──────────────────────────────────────────────────────────────
  readonly sidebarCollapsed = signal(false);
  readonly activeModal      = signal<string | null>(null);
  readonly searchQuery      = signal('');

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly projectCount    = computed(() => this.projects().length);
  readonly totalFilesCount = computed(() => this.projects().reduce((s, p) => s + p.stats.totalFiles, 0));
  readonly languagesUsed   = computed(() => {
    const langs = new Set<string>();
    this.projects().forEach(p => p.stats.languages.forEach(l => langs.add(l)));
    return [...langs];
  });
  readonly isGenerating    = computed(() => this.parseLoading() || this.genLoading());

  // ── Actions ───────────────────────────────────────────────────────────────

  startGeneration(): void {
    this.generating.set(true);
    this.genError.set([]);
    this.genWarnings.set([]);
    this.parsedStack.set(null);
    this.currentProject.set(null);
    this.selectedFile.set(null);
  }

  addProject(p: Omit<GeneratedProject, 'id' | 'generatedAt' | 'deployStatus'>): GeneratedProject {
    const project: GeneratedProject = {
      ...p,
      id:           `proj_${Date.now().toString(36)}`,
      generatedAt:  new Date().toISOString(),
      deployStatus: 'none',
    };
    this.projects.update(list => [project, ...list]);
    this.currentProject.set(project);
    if (project.files.length) this.selectedFile.set(project.files[0]);
    return project;
  }

  updateProjectGithub(id: string, url: string): void {
    this.projects.update(list => list.map(p => p.id === id ? { ...p, githubUrl: url } : p));
    const cur = this.currentProject();
    if (cur?.id === id) this.currentProject.set({ ...cur, githubUrl: url });
  }

  updateProjectDeploy(id: string, status: GeneratedProject['deployStatus'], url?: string): void {
    this.projects.update(list => list.map(p => p.id === id ? { ...p, deployStatus: status, deployUrl: url ?? p.deployUrl } : p));
    const cur = this.currentProject();
    if (cur?.id === id) this.currentProject.set({ ...cur, deployStatus: status, deployUrl: url ?? cur.deployUrl });
  }

  connectGithub(token: string, username: string, avatarUrl: string): void {
    this.github.set({ connected: true, token, username, avatarUrl });
    localStorage.setItem('af_gh_token',   token);
    localStorage.setItem('af_gh_user',    username);
    localStorage.setItem('af_gh_avatar',  avatarUrl);
  }

  disconnectGithub(): void {
    this.github.set({ connected: false, token: '', username: '', avatarUrl: '' });
    localStorage.removeItem('af_gh_token');
    localStorage.removeItem('af_gh_user');
    localStorage.removeItem('af_gh_avatar');
  }

  restoreGithub(): void {
    const token     = localStorage.getItem('af_gh_token')  ?? '';
    const username  = localStorage.getItem('af_gh_user')   ?? '';
    const avatarUrl = localStorage.getItem('af_gh_avatar') ?? '';
    if (token && username) this.github.set({ connected:true, token, username, avatarUrl });
  }

  openModal(id: string)  { this.activeModal.set(id); }
  closeModal()           { this.activeModal.set(null); }
  toggleSidebar()        { this.sidebarCollapsed.update(v => !v); }
}

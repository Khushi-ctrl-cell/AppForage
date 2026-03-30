import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ── Response shapes ───────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok:        boolean;
  data?:     T;
  errors?:   string[];
  warnings?: string[];
  meta?:     Record<string, unknown>;
}

export interface ParsedStackData {
  projectName: string; description: string;
  frontend: string; backend: string;
  infra: string[]; extras: string[]; confidence: number;
}

export interface GeneratedFile   { path:string; content:string; lang:string; size:number; }
export interface FileTreeNode    { name:string; type:'file'|'dir'; path:string; lang?:string; children?:FileTreeNode[]; }
export interface GeneratedProjectData {
  projectName:string; description:string;
  stack:{ frontend:string; backend:string; infra:string[]; extras:string[] };
  files:GeneratedFile[]; fileTree:FileTreeNode[];
  stats:{ totalFiles:number; totalDirs:number; languages:string[]; generatedAt:string };
}
export interface TechValidationResult { technology:string; allowed:boolean; reason:string; suggestion?:string; category?:string; }
export interface CreateRepoData { repoName:string; owner:string; htmlUrl:string; cloneUrl:string; fullName:string; createdAt:string; }
export interface PushRepoData   { pushed:number; failed:number; failedPaths:string[]; repoUrl:string; }
export interface DeployStep     { id:string; label:string; status:string; durationMs:number|null; }
export interface DeployData     { deployId:string; projectName:string; target:string; status:string; estimatedMs:number; steps:DeployStep[]; instructions:Record<string,string[]|null>; urls:Record<string,string|null>; }

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  private get h(): HttpHeaders { return new HttpHeaders({ 'Content-Type': 'application/json' }); }
  private url(path: string): string { return `${this.base}${path}`; }

  /** POST /api/parsePrompt */
  parsePrompt(prompt: string): Observable<ApiResponse<ParsedStackData>> {
    return this.http.post<ApiResponse<ParsedStackData>>(this.url('/api/parsePrompt'), { prompt }, { headers: this.h })
      .pipe(catchError(e => throwError(() => e)));
  }

  /** POST /api/generateProject */
  generateProject(body: {
    prompt:string; backend?:string; frontend?:string; infra?:string[]; extras?:string[];
  }): Observable<ApiResponse<GeneratedProjectData>> {
    return this.http.post<ApiResponse<GeneratedProjectData>>(this.url('/api/generateProject'), body, { headers: this.h })
      .pipe(catchError(e => throwError(() => e)));
  }

  /** POST /api/validateStack */
  validateStack(body: { technologies?:string[]; stack?:Record<string,unknown> }): Observable<ApiResponse & { results?:TechValidationResult[]; allAllowed?:boolean }> {
    return this.http.post<ApiResponse & { results?:TechValidationResult[]; allAllowed?:boolean }>(this.url('/api/validateStack'), body, { headers: this.h })
      .pipe(catchError(e => throwError(() => e)));
  }

  /** GET /api/getTemplates */
  getTemplates(params?: { category?:string; difficulty?:string; tag?:string }): Observable<ApiResponse> {
    let url = this.url('/api/getTemplates');
    if (params) {
      const qs = Object.entries(params).filter(([,v])=>v).map(([k,v])=>`${k}=${encodeURIComponent(v!)}`).join('&');
      if (qs) url += '?' + qs;
    }
    return this.http.get<ApiResponse>(url).pipe(catchError(e => throwError(() => e)));
  }

  /** POST /api/createRepo — GitHub repo creation */
  createRepo(body: { token:string; repoName:string; description?:string; isPrivate?:boolean }): Observable<ApiResponse<CreateRepoData>> {
    return this.http.post<ApiResponse<CreateRepoData>>(this.url('/api/createRepo'), body, { headers: this.h })
      .pipe(catchError(e => throwError(() => e)));
  }

  /** POST /api/pushRepo — push files to GitHub */
  pushRepo(body: { token:string; owner:string; repoName:string; files:GeneratedFile[]; commitMessage?:string }): Observable<ApiResponse<PushRepoData>> {
    return this.http.post<ApiResponse<PushRepoData>>(this.url('/api/pushRepo'), body, { headers: this.h })
      .pipe(catchError(e => throwError(() => e)));
  }

  /** POST /api/deployProject — deploy simulation */
  deployProject(body: { projectName:string; stack?:Record<string,string>; target?:string }): Observable<ApiResponse<DeployData>> {
    return this.http.post<ApiResponse<DeployData>>(this.url('/api/deployProject'), body, { headers: this.h })
      .pipe(catchError(e => throwError(() => e)));
  }
}

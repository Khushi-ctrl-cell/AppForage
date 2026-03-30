import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AppStore } from '../../store/app.store';

interface Template {
  id:string; name:string; category:string; description:string;
  tags:string[]; difficulty:string; vercelReady:boolean; dockerReady:boolean;
  stack:Record<string,unknown>;
}

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-inner">

      <div class="page-header">
        <div class="page-eyebrow">GET /api/getTemplates</div>
        <h1>Template Catalogue</h1>
        <p>{{ totalCount() }} production-ready templates across 5 categories. Angular 17 always enforced as primary frontend.</p>
      </div>

      <!-- Filters -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button *ngFor="let cat of categories"
                  class="btn btn-sm"
                  [class.btn-primary]="selectedCat() === cat.value"
                  [class.btn-secondary]="selectedCat() !== cat.value"
                  (click)="filterCat(cat.value)">
            {{ cat.label }} <span *ngIf="cat.count > 0" style="opacity:.6;margin-left:4px">{{ cat.count }}</span>
          </button>
        </div>

        <select class="form-select" [(ngModel)]="selectedDiff" (ngModelChange)="load()" style="width:auto;margin-left:auto">
          <option value="">All Levels</option>
          <option value="starter">Starter</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" style="display:flex;align-items:center;gap:12px;padding:32px;color:var(--text-muted)">
        <div class="spinner"></div> Loading templates...
      </div>

      <!-- Error -->
      <div *ngIf="error()" class="alert alert-error">{{ error() }}</div>

      <!-- Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px" *ngIf="!loading()">
        <div *ngFor="let t of templates()"
             class="card"
             [class.brand-accent]="selected()?.id === t.id"
             style="cursor:pointer;transition:all .18s"
             (click)="select(t)">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <span class="badge badge-brand" style="text-transform:capitalize">{{ t.category }}</span>
              <span class="badge"
                [class.badge-success]="t.difficulty==='starter'"
                [class.badge-warning]="t.difficulty==='intermediate'"
                [class.badge-error]="t.difficulty==='advanced'">
                {{ t.difficulty }}
              </span>
            </div>

            <div style="font-size:14px;font-weight:600;margin-bottom:6px;color:var(--text-primary)">{{ t.name }}</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">{{ t.description }}</div>

            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
              <span class="chip" style="cursor:default" *ngFor="let tag of t.tags.slice(0,5)">{{ tag }}</span>
            </div>

            <div style="display:flex;gap:6px;justify-content:space-between;align-items:center">
              <div style="display:flex;gap:5px">
                <span class="badge badge-angular">Angular</span>
                <span *ngIf="t.vercelReady" class="badge badge-ghost">Vercel</span>
                <span *ngIf="t.dockerReady" class="badge badge-info">Docker</span>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="useTemplate(t);$event.stopPropagation()">Use →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail panel -->
      <div class="modal-overlay" *ngIf="selected()" (click.self)="selected.set(null)">
        <div class="modal" style="max-width:600px">
          <div class="modal-header">
            <h2>{{ selected()!.name }}</h2>
            <button class="btn btn-ghost btn-icon" (click)="selected.set(null)">✕</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
              <span class="badge badge-brand">{{ selected()!.category }}</span>
              <span class="badge badge-success" *ngIf="selected()!.difficulty==='starter'">starter</span>
              <span class="badge badge-warning" *ngIf="selected()!.difficulty==='intermediate'">intermediate</span>
              <span class="badge badge-error"   *ngIf="selected()!.difficulty==='advanced'">advanced</span>
              <span class="badge badge-ghost"   *ngIf="selected()!.vercelReady">Vercel ready</span>
              <span class="badge badge-info"    *ngIf="selected()!.dockerReady">Docker ready</span>
            </div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:16px">{{ selected()!.description }}</p>

            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">
              <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Frontend</div>
                <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--brand-light)">{{ selected()!.stack['frontend'] ?? 'angular' }}</div>
              </div>
              <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:12px">
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Backend</div>
                <div style="font-family:var(--font-mono);font-size:13px;font-weight:600">{{ selected()!.stack['backend'] ?? 'n/a' }}</div>
              </div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:5px">
              <span class="chip" *ngFor="let tag of selected()!.tags">{{ tag }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selected.set(null)">Close</button>
            <button class="btn btn-primary" (click)="useTemplate(selected()!)">Use This Template →</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TemplatesComponent implements OnInit {
  private api     = inject(ApiService);
  private router  = inject(Router);
  private store   = inject(AppStore);

  templates    = signal<Template[]>([]);
  loading      = signal(true);
  error        = signal('');
  selected     = signal<Template | null>(null);
  selectedCat  = signal('');
  selectedDiff = '';

  totalCount = () => this.templates().length;

  categories = [
    { value:'', label:'All', count:0 },
    { value:'fullstack', label:'Fullstack', count:4 },
    { value:'frontend',  label:'Frontend',  count:2 },
    { value:'backend',   label:'Backend',   count:3 },
    { value:'mobile',    label:'Mobile',    count:1 },
    { value:'infra',     label:'Infra',     count:3 },
  ];

  ngOnInit(): void { this.load(); }

  filterCat(cat: string): void { this.selectedCat.set(cat); this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getTemplates({ category: this.selectedCat() || undefined, difficulty: this.selectedDiff || undefined }).subscribe({
      next: res => {
        this.templates.set((res.data as { templates: Template[] })?.templates ?? []);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load templates'); this.loading.set(false); },
    });
  }

  select(t: Template): void { this.selected.set(this.selected()?.id === t.id ? null : t); }

  useTemplate(t: Template): void {
    const be = (t.stack['backend'] as string) ?? 'golang';
    const fe = (t.stack['frontend'] as string) ?? 'angular';
    this.selected.set(null);
    this.router.navigate(['/generate'], { queryParams: { backend: be, frontend: fe, template: t.id } });
  }
}

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'AppForge — Dashboard',
  },
  {
    path: 'generate',
    loadComponent: () => import('./pages/generate/generate.component').then(m => m.GenerateComponent),
    title: 'AppForge — Generate',
  },
  {
    path: 'templates',
    loadComponent: () => import('./pages/templates/templates.component').then(m => m.TemplatesComponent),
    title: 'AppForge — Templates',
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent),
    title: 'AppForge — Projects',
  },
  {
    path: 'viewer',
    loadComponent: () => import('./pages/viewer/viewer.component').then(m => m.ViewerComponent),
    title: 'AppForge — Viewer',
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
    title: 'AppForge — Settings',
  },
  { path: '**', redirectTo: '/dashboard' },
];

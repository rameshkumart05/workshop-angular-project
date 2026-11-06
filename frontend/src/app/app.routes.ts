import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { Register } from './pages/register/register';

export const routes: Routes = [
  { path: '', component: Landing, title: 'Workshop TGS Registration' },
  { path: 'register', component: Register, title: 'Complete Your Payment' },
  { path: '**', redirectTo: '' }
];

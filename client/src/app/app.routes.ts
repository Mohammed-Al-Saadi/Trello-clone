import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { AboutPage } from './pages/about-page/about-page';
import { LoginPage } from './pages/login-page/login-page';
import { FeaturesPage } from './pages/features-page/features-page';
import { WithNavbarLayout } from './with-navbar-layout/with-navbar-layout';
import { Dashboard } from './pages/dashboard-pages/dashboard-page';
import { Register } from './pages/register/register';
import { Management } from './pages/dashboard-pages/management/management';
import { Settings } from './pages/dashboard-pages/settings/settings';

export const routes: Routes = [
  {
    path: '',
    component: WithNavbarLayout,
    children: [
      { path: '', component: HomePage },
      { path: 'feature', component: FeaturesPage },
      { path: 'about', component: AboutPage },
    ],
  },
  {
    path: 'dashboard',
    component: Dashboard,
    children: [
      { path: 'management', component: Management },
      { path: 'settings', component: Settings },
      { path: '', redirectTo: 'management', pathMatch: 'prefix' },
    ],
  },
  { path: 'login', component: LoginPage },
  { path: 'register', component: Register },
];

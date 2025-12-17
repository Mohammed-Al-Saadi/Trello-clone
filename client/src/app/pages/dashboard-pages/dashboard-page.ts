import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DashboardNavbar } from '../../components/navbar/dashboard-navbar/dashboard-navbar';
import { NavLink } from '../../components/navbar/navbar.model';
import { AuthService } from '../../services/auth';
import { getShortNameUtil } from '../../utils/main.projects.utils';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DashboardNavbar],
  templateUrl: './dashboard-page.html',
  styleUrls: ['./dashboard-page.css'],
})
export class Dashboard {
  logoUrl = 'assets/logo1.png';
  auth = inject(AuthService);

  dashboardLinks: NavLink[] = [
    { label: 'Projects', path: '/dashboard/projects', icon: 'fa-regular fa-folder-open' },
    { label: 'Settings', path: '/dashboard/settings', icon: 'fa-solid fa-gear' },
  ];

  profileImage = 'assets/profile.png';
  profileName = this.auth.user().full_name;
}

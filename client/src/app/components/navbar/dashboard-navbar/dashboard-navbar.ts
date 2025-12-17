import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavLink } from '../navbar.model';
import { getShortNameUtil } from '../../../utils/main.projects.utils';
@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './dashboard-navbar.html',
  styleUrls: ['./dashboard-navbar.css'],
})
export class DashboardNavbar {
  navLinks = input<NavLink[]>([]);
  logoUrl = input<string>('');
  showProfileName = input<boolean>(false);
  showProfileImage = input<boolean>(false);
  profileImage = input<string>('');
  profileName = input<string>('');
  isDarkMode = true;

  collapsed = signal(true);

  toggle() {
    this.collapsed.update((v) => !v);
  }
  logout() {}

  getShortName(name: string) {
    return getShortNameUtil(name);
  }
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('light-mode', !this.isDarkMode);
  }
}

import { Component, computed, effect, inject } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { NavbarService } from '../../components/navbar/navbar-service';
import { NavLink } from '../../components/navbar/navbar.model';
import { LoginLink } from '../../components/login-link/login-link';
import { RegisterLink } from '../../components/register-link/register-link';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Settings } from './settings/settings';
import { Management } from './management/management';

@Component({
  selector: 'app-dashboard',
  imports: [Navbar],
  templateUrl: './dashboard-page.html',
  styleUrls: ['./dashboard-page.css'],
  standalone: true,
})
export class Dashboard {
  private navbarService = inject(NavbarService);
  navLinks = computed(() => this.navbarService.navLinks());
  showLogin = computed(() => this.navbarService.showLogin());
  showLogo = computed(() => this.navbarService.showLogo());
  logo = computed(() => this.navbarService.logoUrl());
  isMenuOpen = computed(() => this.navbarService.isMenyOpen());

  private defaultLinks: NavLink[] = [
    { label: 'Management', path: 'management', icon: 'fa-solid fa-gear' },
    { label: 'Settings', path: 'settings', icon: 'fa-solid fa-gear' },
  ];

  constructor() {
    effect(() => {
    });
  }
  ngOnInit() {
    this.navbarService.setNavLinks(this.defaultLinks);
    this.navbarService.setLogo('assets/favicon.ico');
    this.navbarService.toggleLogin(true);
    this.navbarService.toggleLogo(false);
  }
}

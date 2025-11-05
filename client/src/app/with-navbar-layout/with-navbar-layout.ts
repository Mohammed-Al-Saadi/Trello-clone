import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../components/footer/footer';
import { NavbarService } from '../components/navbar/navbar-service';
import { NavLink } from '../components/navbar/navbar.model';
import { LinkButton } from '../components/link-button/link-button';

@Component({
  selector: 'app-with-navbar-layout',
  standalone: true,
  imports: [Navbar, LinkButton, Footer],
  templateUrl: './with-navbar-layout.html',
  styleUrl: './with-navbar-layout.css',
})
export class WithNavbarLayout implements OnInit {
  private navbarService = inject(NavbarService);
  navLinks = computed(() => this.navbarService.navLinks());
  showLogin = computed(() => this.navbarService.showLogin());
  showLogo = computed(() => this.navbarService.showLogo());
  logo = computed(() => this.navbarService.logoUrl());
  private defaultLinks: NavLink[] = [
    { label: 'Home', path: '/', icon: '' },
    { label: 'Feature', path: '/feature', icon: '' },
    { label: 'About', path: '/about', icon: '' },
  ];

  ngOnInit() {
    this.navbarService.setNavLinks(this.defaultLinks);
    this.navbarService.setLogo('assets/app_logo.png');
    this.navbarService.toggleLogin(false);
    this.navbarService.toggleLogo(false);
  }
}

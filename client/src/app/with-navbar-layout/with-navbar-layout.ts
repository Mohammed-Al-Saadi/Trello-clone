import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../components/footer/footer';
import { NavbarService } from '../components/navbar/navbar-service';
import { NavLink } from '../components/navbar/navbar.model';
import { Register } from '../pages/register/register';
import { LoginLink } from '../components/login-link/login-link';
import { RegisterLink } from '../components/register-link/register-link';
import { RouterOutlet } from '@angular/router';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-with-navbar-layout',
  standalone: true,
  imports: [Navbar, Footer, LoginLink, RegisterLink],
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
    { label: 'About', path: '/about', icon: '' },
    { label: 'Feature', path: '/feature', icon: '' },
  ];

  ngOnInit() {
    this.navbarService.setNavLinks(this.defaultLinks);
    this.navbarService.setLogo('assets/favicon.ico');
    this.navbarService.toggleLogin(false);
    this.navbarService.toggleLogo(false);
  }
}

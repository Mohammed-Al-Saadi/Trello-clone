import { Component, OnInit, inject } from '@angular/core';
import { Footer } from '../components/footer/footer';
import { LinkButton } from '../components/link-button/link-button';
import { LandingNavbar } from '../components/navbar/landing-navbar/landing-navbar';
import { NavLink } from '../components/navbar/navbar.model';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-with-navbar-layout',
  standalone: true,
  imports: [LandingNavbar, Footer, RouterOutlet, LinkButton],
  templateUrl: './with-navbar-layout.html',
  styleUrl: './with-navbar-layout.css',
})
export class WithNavbarLayout implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  logoUrl = 'assets/logo1.png';

  publicLinks: NavLink[] = [
    { label: 'Home', path: '/', icon: '' },
    { label: 'Feature', path: '/feature', icon: '' },
    { label: 'About', path: '/about', icon: '' },
  ];

  ngOnInit() {}

  async onLoginClick() {
    const user = await this.auth.checkAuth();
    this.router.navigate([user ? '/dashboard' : '/login']);
  }
}

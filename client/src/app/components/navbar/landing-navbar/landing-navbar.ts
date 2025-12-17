import {
  Component,
  ContentChild,
  TemplateRef,
  input,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavLink } from '../navbar.model';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './landing-navbar.html',
  styleUrls: ['./landing-navbar.css'],
})
export class LandingNavbar implements OnInit, OnDestroy {
  navLinks = input<NavLink[]>([]);
  logoUrl = input<string>('');
  isMobileOpen = signal(false);

  @ContentChild('landingAuth', { read: TemplateRef })
  authTpl?: TemplateRef<unknown>;

  private resizeListener!: () => void;

  toggleMobileMenu() {
    this.isMobileOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.isMobileOpen.set(false);
  }

  ngOnInit() {
    this.resizeListener = () => {
      if (window.innerWidth > 768 && this.isMobileOpen()) {
        this.closeMobileMenu();
      }
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }
}

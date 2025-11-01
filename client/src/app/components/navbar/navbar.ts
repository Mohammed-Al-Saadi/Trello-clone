import { Component, inject, input, Input, output, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavLink } from './navbar.model';
import { CommonModule } from '@angular/common';
import { NavbarService } from './navbar-service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, RouterOutlet],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  private navBarService = inject(NavbarService);

  navLinks = input<NavLink[]>([]);
  showLogin = input<boolean>(false);
  showLogo = input<boolean>(false);
  logo = input<string>('');
  navbarClass = input<string>('');
  showProfileName = input<boolean>(false);
  showMenuIcon = input<boolean>(false);

  toggleMenu() {
    this.navBarService.toggleMenu();
  }

  get checkMenuOpen() {
    return this.navBarService.isMenyOpen();
  }
}

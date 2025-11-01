import { Component, inject } from '@angular/core';
import { routes } from '../../app.routes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-link',
  imports: [],
  templateUrl: './login-link.html',
  styleUrl: './login-link.css',
  standalone: true,
})
export class LoginLink {
  private router = inject(Router);

  onClick() {
    this.router.navigate(['/login']);
  }
}

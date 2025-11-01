import { Component, inject } from '@angular/core';
import { routes } from '../../app.routes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-link',
  imports: [],
  templateUrl: './register-link.html',
  styleUrl: './register-link.css',
})
export class RegisterLink {
  private router = inject(Router);

  onClick() {
    this.router.navigate(['/register']);
  }
}

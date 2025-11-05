import { CommonModule } from '@angular/common';
import { Component, inject, input, Input } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-link-button',
  standalone: true,

  imports: [CommonModule],
  templateUrl: './link-button.html',
  styleUrls: ['./link-button.css'],
})
export class LinkButton {
  private router = inject(Router);
  buttonClass = input<string>('');
  title = input<string>('Get Started');
  route = input<string>('/');
  icon = input<string>('');

  onClick() {
    this.router.navigate([this.route()]);
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SrpAuthService } from './srp-auth';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css'],
})
export class LoginPage {
  private router = inject(Router);
  private srpAuthService = inject(SrpAuthService);

  loading = signal(false);
  message = signal('');
  isError = signal(false);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.message.set('');
    this.isError.set(false);

    const email = this.form.value.email!;
    const password = this.form.value.password!;

    try {
      const res: any = await this.srpAuthService.login(email, password);

      // If login succeeded
      if (res?.success || res === true) {
        this.message.set(res?.message || 'Login successful! Redirecting...');
        this.isError.set(false);
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      } else {
        // Login failed or returned error
        this.message.set(res?.message || 'Invalid credentials. Please try again.');
        this.isError.set(true);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err?.error?.error ||
        err?.error?.message ||
        err?.message ||
        'An unexpected error occurred. Please try again.';
      this.message.set(msg);
      this.isError.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}

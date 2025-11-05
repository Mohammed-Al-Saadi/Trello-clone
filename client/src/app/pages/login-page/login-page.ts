import { Component, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { SrpAuthService } from './srp-auth';
import { FormItems, ReactiveForm } from '../../components/reactive-form/reactive-form';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveForm],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css'],
})
export class LoginPage {
  private router = inject(Router);
  private srpAuthService = inject(SrpAuthService);

  loading = signal(false);
  message = signal('');

  formData = signal<FormItems[]>([
    {
      label: 'Email',
      type: 'email',
      formControlName: 'email',
      placeholder: 'Your email...',
      validators: [Validators.required, Validators.email],
    },
    {
      label: 'Password',
      type: 'password',
      formControlName: 'password',
      placeholder: 'Password',
      validators: [Validators.required, Validators.minLength(6)],
    },
  ]);

  async onSubmitted(value: any) {
    // Reset messages
    this.message.set('');
    this.loading.set(true);

    try {
      const responseData = await this.srpAuthService.login(value.email, value.password);

      if (responseData === true) {
        this.message.set('Login successful ✅');
        console.log('Login success:', responseData);

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      } else {
        this.message.set('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      this.message.set('Something went wrong. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }
}

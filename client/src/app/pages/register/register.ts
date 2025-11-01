import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import * as srp from 'secure-remote-password/client';
import { SrpRegisterService } from './srp-register-service';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
})
export class Register {
  form = new FormGroup({
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    passwords: new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    }),
  });

  private auth = inject(SrpRegisterService);
  message = signal<string>('');
  isError = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  async onSubmit() {
    if (this.form.invalid) return;

    const username = this.form.value.username!;
    const email = this.form.value.email!;
    const passwords = this.form.value.passwords as any;
    const password = passwords?.password;
    const confirmPassword = passwords?.confirmPassword;
    if (password !== confirmPassword) {
      this.message.set('Passwords do not match');
      return;
    }
    try {
      const res = await this.auth.register(username, email, password);

      // Pick a human-readable message
      const msg =
        typeof res === 'string'
          ? res
          : res && typeof res === 'object' && 'message' in res
          ? (res as any).message
          : JSON.stringify(res);

      this.message.set(msg);
      this.isError.set(false);
      this.form.reset();
    } catch (err: any) {
      console.error('Error:', err);
      const backendMessage = err?.error?.message || 'Registration failed. Please try again.';
      this.message.set(backendMessage);
      this.isError.set(true);
    }
  }
}

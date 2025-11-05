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
import { Router, RouterLink } from '@angular/router';
import { FormItems, ReactiveForm } from '../../components/reactive-form/reactive-form';

@Component({
  selector: 'app-register',
  imports: [ReactiveForm, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
})
export class Register {
  private auth = inject(SrpRegisterService);
  private router = inject(Router);

  loading = signal(false);
  message = signal('');

  formData = signal<FormItems[]>([
    {
      label: 'Name',
      type: 'text',
      formControlName: 'full_name',
      placeholder: 'Your email...',
      validators: [Validators.required],
    },
    {
      label: 'Email',
      type: 'email',
      formControlName: 'emailRaw',
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
    {
      label: 'Confirm Password',
      type: 'password',
      formControlName: 'confirmPassword',
      placeholder: 'Password',
      validators: [Validators.required, Validators.minLength(6)],
    },
  ]);

  async onSubmitted(value: any) {
    this.message.set('');
    this.loading.set(true);

    try {
      const responseData = await this.auth.register(
        value.full_name,
        value.emailRaw,
        value.password
      );
      console.log(responseData);
    } catch (err: any) {
      console.error('Register error:', err);
      this.message.set('Something went wrong. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }
}

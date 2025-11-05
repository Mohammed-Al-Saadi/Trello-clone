import { NgFor, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  Output,
  output,
  signal,
  effect,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { passwordsMatchValidator } from '../../utils/form-validators';
import { getErrorMessages } from '../../utils/forms_error';
import { RouterLink } from '@angular/router';

export interface FormItems {
  label: string;
  type: string;
  formControlName: string;
  placeholder: string;
  validators?: any[];
}

@Component({
  selector: 'app-reactive-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reactive-form.html',
  styleUrl: './reactive-form.css',
  standalone: true,
})
export class ReactiveForm implements OnInit {
  formData = input<FormItems[]>([]);
  title = input<string>('');
  p = input<string>('');

  inputValidation = input<[]>([]);
  buttonName = input<string>('');
  @Output() submittedData = new EventEmitter<any>();
  form = new FormGroup({});
  private formBuilder = inject(FormBuilder);

  ngOnInit() {
    const items = this.formData();
    const group: Record<string, FormControl> = {};
    for (const item of items) {
      group[item.formControlName] = new FormControl('', { validators: item.validators });
    }
    this.form = this.formBuilder.group(group, { validators: passwordsMatchValidator() });
  }
  errorMessages(controlName: string, label: string): string[] {
    return getErrorMessages(this.form, controlName, label);
  }
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submittedData.emit(this.form.value);
  }
}

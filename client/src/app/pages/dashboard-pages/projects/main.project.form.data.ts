import { FormItems } from '../../../components/reactive-form/reactive-form';
import { Validators } from '@angular/forms';

export const ProjectFormData: FormItems[] = [
  {
    label: 'Project Name *',
    type: 'text',
    formControlName: 'project_name',
    placeholder: 'Your project...',
    validators: [Validators.required, Validators.maxLength(50)],
    options: [],
  },
  {
    label: 'Description *',
    type: 'textarea',
    formControlName: 'description',
    placeholder: 'Description...',
    validators: [Validators.required, Validators.maxLength(150)],
    options: [],
  },
  {
    label: 'Category',
    type: 'select',
    formControlName: 'category',
    placeholder: 'Choose or type a category',
    options: ['Web App', 'Mobile App', 'AI Tool', 'Internal'],
    validators: [Validators.required, Validators.maxLength(30)],
    allowTyping: true,
  },
  {
    label: 'Start Date',
    type: 'date',
    formControlName: 'start_date',
    validators: [],
    options: [],
    placeholder: 'Description...',
  },
];

export const CollaboratorFormData = (roles: string[]): FormItems[] => [
  {
    label: 'Owner Email *',
    type: 'email',
    formControlName: 'email',
    placeholder: 'Email...',
    validators: [Validators.required, Validators.email],
    options: [],
  },
  {
    label: 'Select Project *',
    type: 'select',
    formControlName: 'project',
    placeholder: 'Select project.. ',
    options: [],
    validators: [Validators.required],
    allowTyping: false,
  },
  {
    label: 'Select Role *',
    type: 'select',
    formControlName: 'roles',
    placeholder: 'Select role.. ',
    options: roles,
    validators: [Validators.required],
    allowTyping: false,
  },
];
export const DeleteCollaboratorFormData: FormItems[] = [
  {
    label: 'Select Project *',
    type: 'select',
    formControlName: 'project',
    placeholder: 'Select project.. ',
    options: [],
    validators: [Validators.required],
    allowTyping: false,
  },
];

export function getAddMemberFormData(roles: any[]): FormItems[] {
  return [
    {
      label: 'Email *',
      type: 'email',
      formControlName: 'email',
      placeholder: 'Email...',
      validators: [Validators.required, Validators.email],
      options: [],
    },
    {
      label: 'Select Board *',
      type: 'select',
      formControlName: 'board',
      placeholder: 'Select board.. ',
      validators: [Validators.required],
      allowTyping: false,
      options: [],
    },
    {
      label: 'Select Role *',
      type: 'select',
      formControlName: 'roles',
      placeholder: 'Select role.. ',
      options: roles
        .filter((item) => item.name.toLowerCase().startsWith('board'))
        .map((item) => item.name),
      validators: [Validators.required],
      allowTyping: false,
    },
  ];
}

export const editBoardsFormData: FormItems[] = [
  {
    label: 'Name ',
    type: 'text',
    formControlName: 'name',
    placeholder: 'Name...',
    validators: [Validators.required, Validators.maxLength(50)],
    options: [],
  },
  {
    label: 'Select category ',
    type: 'select',
    formControlName: 'category',
    placeholder: 'Select category.. ',
    options: ['General', 'Design', 'Development', 'Testing', 'Review', 'Deployment'],
    validators: [Validators.required, Validators.maxLength(50)],
    allowTyping: true,
  },
];

export const newBoardFormData: FormItems[] = [
  {
    label: 'Board Name *',
    type: 'text',
    formControlName: 'board_name',
    placeholder: 'Your board...',
    validators: [Validators.required, Validators.maxLength(50)],
    options: [],
  },
  {
    label: 'Select or Type Category  *',
    type: 'select',
    formControlName: 'category',
    placeholder: 'Select board.. ',
    options: ['General', 'Design', 'Development', 'Testing', 'Review', 'Deployment'],
    validators: [Validators.required, Validators.maxLength(50)],
    allowTyping: true,
  },
];

export function createAddMemberFormItems(boardRoles: string[]): FormItems[] {
  return [
    {
      label: 'Email *',
      type: 'email',
      formControlName: 'email',
      placeholder: 'Email...',
      validators: [Validators.required, Validators.email],
      options: [],
    },

    {
      label: 'Select Role *',
      type: 'select',
      formControlName: 'roles',
      placeholder: 'Select role...',
      options: boardRoles,
      validators: [Validators.required],
      allowTyping: false,
    },
  ];
}

export function createAddListFormItems(): FormItems[] {
  return [
    {
      label: 'List Name *',
      type: 'text',
      formControlName: 'list_name',
      placeholder: 'List name...',
      validators: [Validators.required],
      options: [],
    },
  ];
}

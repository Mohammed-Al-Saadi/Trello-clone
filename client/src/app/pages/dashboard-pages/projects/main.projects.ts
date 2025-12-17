import { Component, inject, signal } from '@angular/core';
import { DashboardInfoPanel } from '../../../components/dashboard-info-panel/dashboard-info-panel';
import { LinkButton } from '../../../components/link-button/link-button';
import { ModelView } from '../../../components/model-view/model-view';
import { FormItems, ReactiveForm } from '../../../components/reactive-form/reactive-form';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { ToastService } from '../../../components/reusable-toast/toast-service';
import { ProjectsService } from '../../../services/projects-service';
import { selectUser } from '../../../store/selectors';
import { Store } from '@ngrx/store';
import { ProjectMembership } from '../../../services/project-membership';
import { ProjectCard } from '../../../components/project-card/project-card';
import { CollaboratorFormData, ProjectFormData } from './main.project.form.data';
import { NgFor, TitleCasePipe } from '@angular/common';
import { ConfirmDelete } from '../../../components/confirm-delete/confirm-delete';
import {
  filterProjectsUtils,
  populateEditFormUtils,
  resetFormUtils,
} from '../../../utils/main.projects.utils';
import { LoadingSkeleton } from '../../../components/loading-skeleton/loading-skeleton';
import { FloatingField } from '../../../components/floating-field/floating-field';
import { ManageRoles } from '../../../components/manage-roles/manage-roles';

@Component({
  selector: 'app-management',
  imports: [
    DashboardInfoPanel,
    LinkButton,
    ModelView,
    ReactiveForm,
    FormsModule,
    ProjectCard,
    NgFor,
    ConfirmDelete,
    LoadingSkeleton,
    FloatingField,
    ManageRoles,
    TitleCasePipe,
  ],
  templateUrl: './main.projects.html',
  styleUrl: './main.projects.css',
})
export class Management {
  router = inject(Router);
  projectMembership = inject(ProjectMembership);
  toast = inject(ToastService);
  addProject = inject(ProjectsService);
  store = inject(Store);
  auth = inject(AuthService);

  showDeleteModal = signal(false);
  isProjectDelete = signal(false);

  selectedProjectId = signal<number | null>(null);
  selectedCollaboratorId = signal<number | null>(null);

  projectsData = signal<any[]>([]);
  allProjects = signal<any[]>([]);
  selectedProject = signal<any>(null);

  showModel = signal(false);
  showEditModel = signal(false);
  showCollaboratorModel = signal(false);
  showManageOwners = signal(false);
  searchQuery = '';
  ownerFilter = signal<'all' | 'me' | 'others'>('all');
  ownerMode: 'add' | 'delete' = 'add';
  createProjectLoading = signal(false);
  updateProjectLoading = signal(false);
  loadingProjects = signal(true);
  userDataState = this.store.selectSignal(selectUser);
  roles = this.auth.roles;
  user = this.auth.user;
  rolesList = signal<any[]>([]);
  selectedRole = signal('');
  formData = signal<FormItems[]>([...ProjectFormData]);
  selectedRoleDescription = signal('');
  roleName = signal('');

  addProjectCollaborator = signal<FormItems[]>(
    CollaboratorFormData(
      this.roles()
        .filter(
          (item) =>
            item.name.toLowerCase().startsWith('project') &&
            item.name.toLowerCase() !== 'project_owner'
        )
        .map((item) => item.name)
    )
  );
  onChangeSelect(event: any) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value.startsWith('project_')) return;
    this.selectedRole.set(value);
    this.selectedRoleDescription.set(this.roleDescriptions[value] || '');
  }

  roleDescriptions: Record<string, string> = {
    project_admin: 'Full access: manage boards, tasks, and members.',
    project_member: 'Standard access: manage tasks but not project members.',
  };

  async onNewRole(event: any) {
    const user_id = event.memberId;
    const project_id = event.entityId;
    const role_name = event.newRole;
    const project_role_name = event.entityRoleName;

    const role_id = this.roles().find((item) => item.name === role_name).id;
    await this.projectMembership.editProjectUserRole(
      project_id,
      user_id,
      role_id,
      project_role_name
    );
  }
  async deleteMemberShip(event: any) {
    console.log(event);

    const user_id = event.memberId;
    const project_id = event.entityId;
    await this.projectMembership.deleteProjectMembership(project_id, user_id, event.entityRoleName);
    this.ngOnInit();
  }
  onOpenManageOwners() {
    this.showManageOwners.update((v) => !v);
  }
  async ngOnInit() {
    this.loadingProjects.set(true);
    const userId = this.userDataState().id;
    const response: any = await this.addProject.getAllProjects(userId);
    this.rolesList.set(
      this.roles().filter(
        (role) => role.name.startsWith('project') && role.name !== 'project_owner'
      )
    );
    const data = Array.isArray(response) ? response : response.projects ?? [];
    console.log(data);
    console.log(response);

    this.projectsData.set(data);
    this.allProjects.set(data);
    const projectNames = data.map((p: any) => p.name);

    this.addProjectCollaborator.update((items) => {
      const projectField = items.find((f) => f.formControlName === 'project');
      if (projectField) projectField.options = projectNames;
      return [...items];
    });

    this.loadingProjects.set(false);
  }

  get ownerFilterValue() {
    return this.ownerFilter();
  }
  set ownerFilterValue(value: 'all' | 'me' | 'others') {
    this.ownerFilter.set(value);
  }
  formatRole(role: string): string {
    return role
      .replace('project_', '')
      .replace('_', ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  openDeleteProject(projectId: number, ownerId: number, role_name: string) {
    this.isProjectDelete.set(true);
    this.selectedProjectId.set(projectId);
    this.selectedCollaboratorId.set(ownerId);
    this.showDeleteModal.set(true);
    this.roleName.set(role_name);
  }

  async handleDelete(confirmed: boolean) {
    this.showDeleteModal.set(false);
    if (!confirmed) return;

    const projectId = this.selectedProjectId();
    const userId = this.selectedCollaboratorId();
    if (!projectId || !userId) return;

    if (this.isProjectDelete()) {
      await this.addProject.deleteProject(projectId, userId, this.roleName());
    }

    await this.ngOnInit();
  }

  filterProjects() {
    const userId = this.userDataState().id;

    this.projectsData.set(
      filterProjectsUtils(this.allProjects(), this.searchQuery, this.ownerFilter(), userId)
    );
  }
  navigateToProject(id: number) {
    const project = this.projectsData().find((p) => p.id === id);

    this.router.navigate(['/dashboard/projects', id], {
      state: {
        projectName: project.name,
        projectRoleName: project.role_name,
        ownerName: project.owner_name,
      },
    });
  }

  toggleNewProjectModal() {
    if (!this.showModel()) {
      this.formData.set([...ProjectFormData]);
    }
    this.showModel.update((v) => !v);
  }

  toggleAddCollaboratorModal() {
    this.showCollaboratorModel.update((v) => !v);
    this.ownerMode = 'add';
  }

  populateEditForm(project: any) {
    this.showEditModel.set(true);
    this.selectedProject.set(project);
    this.formData.update((f) => populateEditFormUtils(project, f));
    this.roleName.set(project.role_name);
  }

  closeEditModal() {
    this.showEditModel.set(false);
    this.selectedProject.set(null);
    this.formData.update((f) => resetFormUtils(f));
  }

  async addCollaborator(form: any) {
    const project = this.allProjects().find((p) => p.name === form.project);
    const role_name = project.role_name;

    if (!project) return;
    try {
      await this.projectMembership.addProjectMembership(
        project.id,
        this.roles().find((r) => r.name === form.roles)!.id,
        form.email,
        this.user().id,
        role_name
      );

      this.showCollaboratorModel.set(false);
      await this.ngOnInit();
    } catch (error) {
      this.showCollaboratorModel.set(false);
    }
  }

  async createProject(form: any) {
    this.createProjectLoading.set(true);

    await this.addProject.addNewProject(
      form.project_name,
      form.description,
      this.userDataState().id,
      form.category
    );

    this.showModel.set(false);
    await this.ngOnInit();
    this.createProjectLoading.set(false);
  }

  async updateProject(form: any) {
    const current = this.selectedProject();
    if (!current) return;

    const normalize = (val: any) =>
      typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : val;

    const oldName = normalize(current.name);
    const oldDescription = normalize(current.description);
    const oldCategory = normalize(current.category);

    const newName = normalize(form.project_name);
    const newDescription = normalize(form.description);
    const newCategory = normalize(form.category);

    const noChange =
      oldName === newName && oldDescription === newDescription && oldCategory === newCategory;

    if (noChange) {
      this.toast.showMessage({
        id: 1,
        type: 'success',
        text: 'No changes detected.',
      });
      this.showEditModel.set(false);
      return;
    }
    try {
      await this.addProject.updateProject(
        this.userDataState().id,
        current.id,
        newName,
        newDescription,
        newCategory,
        form.created_at,
        this.roleName()
      );

      this.showEditModel.set(false);
      this.selectedProject.set(null);

      await this.ngOnInit();
    } catch (error) {
      this.showEditModel.set(false);
      this.selectedProject.set(null);
    }
  }
}

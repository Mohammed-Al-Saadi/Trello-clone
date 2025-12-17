import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LinkButton } from '../../../../components/link-button/link-button';
import { DashboardInfoPanel } from '../../../../components/dashboard-info-panel/dashboard-info-panel';
import { ReactiveForm, FormItems } from '../../../../components/reactive-form/reactive-form';
import { ModelView } from '../../../../components/model-view/model-view';
import { BoardService } from '../../../../services/board-service';
import { AuthService } from '../../../../services/auth';
import { BoardMembership } from '../../../../services/board-membership';
import { FloatingField } from '../../../../components/floating-field/floating-field';
import { ProjectCard } from '../../../../components/project-card/project-card';
import { ConfirmDelete } from '../../../../components/confirm-delete/confirm-delete';
import { ToastService } from '../../../../components/reusable-toast/toast-service';
import {
  editBoardsFormData,
  getAddMemberFormData,
  newBoardFormData,
} from '../main.project.form.data';
import { checkBoardNoChanges, getShortNameUtil } from '../../../../utils/main.projects.utils';
import { ManageRoles } from '../../../../components/manage-roles/manage-roles';
import { NgFor, TitleCasePipe } from '@angular/common';
import { LoadingSkeleton } from '../../../../components/loading-skeleton/loading-skeleton';

@Component({
  selector: 'app-project-page',
  standalone: true,
  templateUrl: './project-page.html',
  styleUrls: ['./project-page.css', '../main.projects.css'],
  imports: [
    LinkButton,
    DashboardInfoPanel,
    ModelView,
    ReactiveForm,
    FloatingField,
    ProjectCard,
    ConfirmDelete,
    ManageRoles,
    TitleCasePipe,
    LoadingSkeleton,
    NgFor,
  ],
})
export class ProjectPage {
  route = inject(ActivatedRoute);
  projectId = this.route.snapshot.params['project_id'];
  projectRole = history.state.projectRoleName;
  ownerName = history.state.ownerName;

  auth = inject(AuthService);
  user = this.auth.user;
  roles = this.auth.roles;
  boardRoles = signal<any[]>([]);

  boardService = inject(BoardService);
  memberMembership = inject(BoardMembership);
  router = inject(Router);
  toast = inject(ToastService);

  projectName = history.state.projectName;
  loadingBoards = signal<boolean>(false);
  showModel = signal(false);
  showAddMemberModel = signal(false);
  showEditBoardState = signal(false);
  showDeleteModal = signal(false);
  showEditBoardMembershipState = signal(false);
  selectedRole = signal('');

  boardsData = signal<any[]>([]);
  selectedBoard = signal<any>(null);
  selectedBoardId = signal<number | null>(null);
  selectedRoleDescription = signal('');

  searchQuery = signal('');
  addMemberformData = signal<FormItems[]>(getAddMemberFormData(this.roles()));
  editBoards = signal<FormItems[]>(editBoardsFormData);
  formData = signal<FormItems[]>(newBoardFormData);
  setMemberData = signal<any[]>([]);
  filteredBoards = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.boardsData();

    return this.boardsData().filter((board) => board.name.toLowerCase().includes(query));
  });

  getShortName(name: string): string {
    return getShortNameUtil(name);
  }
  onChangeSelect(event: any) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value.startsWith('board_')) return;
    this.selectedRole.set(value);
    this.selectedRoleDescription.set(this.roleDescriptions[value] || '');
  }
  roleDescriptions: Record<string, string> = {
    board_admin:
      'Full control of the board—can manage lists, tasks, and board members, but cannot delete the board.',

    board_member:
      'Task-level access. Can add, edit, move, and delete tasks, but cannot delete the board or manage board settings or members.',
  };

  onNewRole(event: any) {
    console.log(event);
    const board_id = event.entityId;
    const user_id = event.memberId;
    const role_name = event.newRole;
    const role_id = this.roles().find((r) => r.name === role_name).id;
    this.memberMembership.updateBoardMembership(board_id, user_id, role_id, this.projectRole);
  }
  openManageBoardRoles() {
    this.showEditBoardMembershipState.update((v) => !v);
  }
  async deleteMemberShip(event: any) {
    const board_id = event.entityId;
    const user_id = event.memberId;
    try {
      await this.memberMembership.deleteBoardMembership(board_id, user_id, this.projectRole);

      this.ngOnInit();
    } catch (err) {
      console.error(err);
    }
  }

  ngOnInit() {
    this.boardRoles.set(this.roles().filter((r) => r.name.startsWith('board')));
    this.loadBoards();
  }

  async loadBoards() {
    this.loadingBoards.set(true);

    try {
      const result: any = await this.boardService.getBoards(this.projectId, this.user().id);
      this.boardsData.set(result);
      console.log(result);

      this.addMemberformData.update((items) => {
        const boardField = items.find((f) => f.formControlName === 'board');
        if (boardField) boardField.options = result.map((b: any) => b.name);
        return [...items];
      });
    } finally {
      this.loadingBoards.set(false);
    }
  }

  goBack() {
    history.back();
  }

  onClickOpenAddBoard() {
    this.showModel.update((v) => !v);
  }

  onClickOpenAddMember() {
    this.showAddMemberModel.update((v) => !v);
  }

  onClickCloseEditBoard() {
    this.showEditBoardState.update((v) => !v);
  }

  async onSubmiteNewBoard(formData: any) {
    await this.boardService.addNewBoard(
      this.projectId,
      formData.board_name,
      0,
      formData.category,
      this.projectRole
    );

    this.showModel.set(false);
    this.loadBoards();
  }

  openEditBoard(board: any) {
    this.selectedBoard.set(board);
    this.showEditBoardState.set(true);

    this.editBoards.update((fields) =>
      fields.map((f) => {
        if (f.formControlName === 'name') return { ...f, value: board.name };
        if (f.formControlName === 'category') return { ...f, value: board.category };
        return f;
      })
    );
  }

  async onSubmitEditBoard(editFormData: any) {
    const oldBoard = this.selectedBoard();
    const { noChange, currentName, currentCategory } = checkBoardNoChanges(oldBoard, editFormData);

    if (noChange) {
      this.toast.showMessage({
        id: 1,
        type: 'success',
        text: 'No changes detected.',
      });
      this.showEditBoardState.set(false);
      return;
    }

    await this.boardService.editBoard(oldBoard.id, currentName, currentCategory, this.projectRole);
    this.showEditBoardState.set(false);
    this.loadBoards();
  }
  async onSubmiteNewMember(formData: any) {
    try {
      const selectedBoardName = formData.board;
      const selectedRoleName = formData.roles;

      const board = this.boardsData().find((b) => b.name === selectedBoardName);
      const board_id = board.id;
      const role_id = this.roles().find((r) => r.name === selectedRoleName).id;

      await this.memberMembership.addBoardMembership(
        board_id,
        role_id,
        formData.email,
        this.user().id,
        this.projectRole
      );

      this.showAddMemberModel.set(false);
      this.ngOnInit();
    } catch (e) {
      console.log(e);
      this.showAddMemberModel.set(false);
    }
  }

  async handleDelete(confirmed: boolean) {
    this.showDeleteModal.set(false);
    if (!confirmed) return;

    const boardId = this.selectedBoardId();
    if (!boardId) return;

    await this.boardService.deleteBoard(this.projectId, boardId, this.projectRole);
    this.loadBoards();
  }

  openDeleteBoard(event: { id: number }) {
    this.selectedBoardId.set(event.id);
    this.showDeleteModal.set(true);
  }

  goToBoard(boardId: number) {
    const projectNAme = this.projectName;
    const board = this.boardsData().find((n) => n.id === boardId);
    this.router.navigate(['/dashboard/projects', this.projectId, 'boards', boardId], {
      state: {
        projectName: this.projectName,
        boardName: board.name,
        role_name: board.role_name,
        ownerName: this.ownerName,
      },
    });
  }
}

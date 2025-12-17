import { Component, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';

import { LinkButton } from '../../../../components/link-button/link-button';
import { DashboardInfoPanel } from '../../../../components/dashboard-info-panel/dashboard-info-panel';
import { ReactiveForm, FormItems } from '../../../../components/reactive-form/reactive-form';
import { ModelView } from '../../../../components/model-view/model-view';
import { ManageRoles } from '../../../../components/manage-roles/manage-roles';
import { ConfirmDelete } from '../../../../components/confirm-delete/confirm-delete';
import { BoardListsComponent } from '../../../../components/board-lists-component/board-lists-component';

import { AuthService } from '../../../../services/auth';
import { BoardListService } from '../../../../services/board-list';
import { BoardMembership } from '../../../../services/board-membership';
import { TasksService } from '../../../../services/tasks';

import { getShortNameUtil } from '../../../../utils/main.projects.utils';
import { createAddListFormItems, createAddMemberFormItems } from '../main.project.form.data';
import { BOARD_ROLE_DESCRIPTIONS } from '../../../../utils/boards';

@Component({
  selector: 'app-board-page',
  standalone: true,
  templateUrl: './board-page.html',
  styleUrls: ['./board-page.css', '../project-page/project-page.css'],
  imports: [
    LinkButton,
    DashboardInfoPanel,
    ReactiveForm,
    ModelView,
    ManageRoles,
    ConfirmDelete,
    BoardListsComponent,
    FormsModule,
    TitleCasePipe,
  ],
})
export class BoardPage {
  route = inject(ActivatedRoute);
  auth = inject(AuthService);
  boardListService = inject(BoardListService);
  boardMembership = inject(BoardMembership);
  tasksService = inject(TasksService);

  projectId = this.route.snapshot.params['project_id'];
  boardId = this.route.snapshot.params['board_id'];
  ownerName = history.state.ownerName;

  projectName = history.state.projectName;
  boardName = history.state.boardName;
  boardRoleName = history.state.role_name;

  lists = signal<any[]>([]);
  allBoardMembers = signal<any[]>([]);
  boardRoles = signal<any[]>([]);
  manageRolesData = signal<any[]>([]);

  showAddMemberModel = signal(false);
  showManageMemberModel = signal(false);
  showaddListModel = signal(false);
  showDeleteModal = signal(false);
  showDeleteCardModal = signal(false);

  selectedListId = signal<number | null>(null);
  selectedCardToDelete = signal<number>(0);
  selectedRole = signal('');
  selectedRoleDescription = signal('');

  listFormData = signal<FormItems[]>(createAddListFormItems());
  formData = signal<FormItems[]>(
    createAddMemberFormItems(
      this.auth
        .roles()
        .filter((r) => r.name.startsWith('board'))
        .map((r) => r.name)
    )
  );

  @ViewChild(ReactiveForm) addMemberForm!: ReactiveForm;
  @ViewChild(BoardListsComponent) boardListsComp!: BoardListsComponent;
  private savedScrollLeft = 0;

  ngOnInit() {
    this.loadBoardLists();
    this.boardRoles.set(this.auth.roles().filter((r) => r.name.startsWith('board')));
  }

  async loadBoardLists() {
    const data: any = await this.boardListService.getBoardList(this.boardId);
    console.log(data);

    this.lists.set([...data.lists]);
    this.allBoardMembers.set([...data.members]);

    this.manageRolesData.set([{ id: this.boardId, name: this.boardName, members: data.members }]);
  }

  getShortName(name: string) {
    return getShortNameUtil(name);
  }

  goBack() {
    history.back();
  }

  onClickOpenAddMember() {
    this.showAddMemberModel.update((v) => !v);
  }

  openManageMembers() {
    this.showManageMemberModel.update((v) => !v);
  }

  onClickOpenAddList() {
    this.showaddListModel.update((v) => !v);
  }

  onChangeSelect(event: any) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value.startsWith('board_')) return;
    this.selectedRole.set(value);
    this.selectedRoleDescription.set(BOARD_ROLE_DESCRIPTIONS[value] || '');
  }

  async addNewList(event: any) {
    const name = event.list_name;
    await this.boardListService.addNewBoardList(this.boardId, name, this.boardRoleName);
    this.showaddListModel.set(false);
    this.loadBoardLists();
  }

  addBoardMember(formData: any) {
    try {
      const email = formData.email;
      const roleName = formData.roles;
      const addedBy = this.auth.user().id;
      const role = this.auth.roles().find((r) => r.name === roleName);
      if (!role) return;
      this.boardMembership.addBoardMembership(
        this.boardId,
        role.id,
        email,
        addedBy,
        this.boardRoleName
      );
      this.showAddMemberModel.set(false);
      this.addMemberForm.form.reset();
    } catch (error) {
      console.log(error);
    }
  }

  async deleteMemberShip(event: any) {
    const boardId = event.entityId;
    const userId = event.memberId;
    await this.boardMembership.deleteBoardMembership(boardId, userId, this.boardRoleName);
    this.loadBoardLists();
  }

  async onNewRole(event: any) {
    const boardId = event.entityId;
    const userId = event.memberId;
    const roleName = event.newRole;
    const role = this.auth.roles().find((r) => r.name === roleName);
    if (!role) return;
    await this.boardMembership.updateBoardMembership(boardId, userId, role.id, this.boardRoleName);
    this.loadBoardLists();
  }

  onClickOpenDeleteList(listId: number) {
    this.selectedListId.set(listId);
    this.showDeleteModal.set(true);
  }

  onClickOpenDeleteCard(cardId: number) {
    this.selectedCardToDelete.set(cardId);
    this.showDeleteCardModal.set(true);
  }

  async handleDeleteCard(confirm: boolean) {
    if (!confirm) {
      this.showDeleteCardModal.set(false);
      return;
    }
    await this.tasksService.deleteTask(this.selectedCardToDelete(), this.boardRoleName);
    this.showDeleteCardModal.set(false);
    this.loadBoardLists();
  }

  async handleDelete(confirm: boolean) {
    this.showDeleteModal.set(false);
    if (!confirm) return;
    const listId = this.selectedListId();
    if (!listId) return;
    await this.boardListService.deleteBoardList(listId, this.boardRoleName);
    this.selectedListId.set(null);
    this.loadBoardLists();
  }
}

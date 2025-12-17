import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FloatingField } from '../floating-field/floating-field';
import { NgFor, NgIf } from '@angular/common';
import { ConfirmDelete } from '../confirm-delete/confirm-delete';
import { ManageEntity, ManageMember } from './manage-roles.models';

@Component({
  selector: 'app-manage-roles',
  standalone: true,
  imports: [FloatingField, FormsModule, NgFor, ConfirmDelete],
  templateUrl: './manage-roles.html',
  styleUrls: ['./manage-roles.css'],
})
export class ManageRoles {
  @Input() manageRolesData: any[] = [];
  @Input() roles: any[] = [];
  @Input() headerTitle: string = 'Manage Roles';
  @Input() headerDescription: string = '';
  @Input() searchPlaceholder: string = 'Search...';
  @Input() context: 'project' | 'board' = 'project';
  @Input() label: string = '';

  @Output() saveRole = new EventEmitter<{
    entityId: number;
    memberId: number;
    newRole: string;
    entityRoleName: string;
  }>();

  @Output() deleteMember = new EventEmitter<{
    entityId: number;
    memberId: number;
    entityRoleName: string;
  }>();

  get noMembersAvailable() {
    const boards = this.manageRolesData;
    return boards.length === 0 || boards.every((b) => b.members.length === 0);
  }

  searchQuery = '';
  selectedMember = signal<number | null>(null);
  selectedBoard = signal<number | null>(null);
  originalRole = signal<string>('');
  showDeleteModal = signal<boolean>(false);
  memberToDelete: {
    entityId: number;
    memberId: number;
    entityRoleName: string;
  } | null = null;

  filteredBoards() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.manageRolesData;

    return this.manageRolesData
      .map((board) => {
        const filteredMembers = board.members.filter(
          (m: any) => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        );

        if (board.name.toLowerCase().includes(q)) {
          return { ...board, members: board.members };
        }

        return { ...board, members: filteredMembers };
      })
      .filter((b) => b.members.length > 0);
  }

  toggleEditMember(entity: ManageEntity, member: ManageMember) {
    if (this.selectedMember() === member.user_id && this.selectedBoard() === entity.id) {
      this.selectedMember.set(null);
      this.selectedBoard.set(null);
      return;
    }
    this.originalRole.set(member.role_name);
    this.selectedBoard.set(entity.id);
    this.selectedMember.set(member.user_id);
    console.log(entity);
  }

  onSaveRole(entity: ManageEntity, member: ManageMember) {
    if (this.originalRole() === member.role_name) {
      this.selectedMember.set(null);
      this.selectedBoard.set(null);
      return;
    }

    this.saveRole.emit({
      entityId: entity.id,
      memberId: member.user_id,
      newRole: member.role_name,
      entityRoleName: entity.role_name,
    });

    this.selectedMember.set(null);
    this.selectedBoard.set(null);
  }

  onCancelEdit() {
    this.selectedMember.set(null);
    this.selectedBoard.set(null);
  }

  handleDelete(confirm: boolean) {
    if (!confirm) {
      this.showDeleteModal.set(false);
      return;
    }

    if (this.memberToDelete) {
      this.deleteMember.emit({
        entityId: this.memberToDelete.entityId,
        memberId: this.memberToDelete.memberId,
        entityRoleName: this.memberToDelete.entityRoleName,
      });
    }

    this.showDeleteModal.set(false);
    this.memberToDelete = null;
  }

  onDeleteMember(entity: ManageEntity, member: ManageMember) {
    this.memberToDelete = {
      entityId: entity.id,
      memberId: member.user_id,
      entityRoleName: entity.role_name,
    };

    this.showDeleteModal.set(true);
  }
}

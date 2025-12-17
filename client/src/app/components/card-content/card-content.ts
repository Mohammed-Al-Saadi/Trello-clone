import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { getShortNameUtil } from '../../utils/main.projects.utils';
import { FormsModule } from '@angular/forms';
import { LinkButton } from '../link-button/link-button';
import { NgxHtmlEditor } from '../ngx-html-editor/ngx-html-editor';
import { CardContentService } from '../../services/card_content';
import { CardMembershipService } from '../../services/cards-memberships';
import { TasksService } from '../../services/tasks';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-card-content',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, NgxHtmlEditor],
  templateUrl: './card-content.html',
  styleUrl: './card-content.css',
})
export class CardContent {
  @Input() SelectedCard: any = null;
  @Input() boardMembers: any[] = [];
  @Output() close = new EventEmitter<void>();

  isEditingHeader = false;

  tempTitle = '';
  tempPriority = '';
  comment = '';
  cardContentService = inject(CardContentService);
  cardMembershipService = inject(CardMembershipService);
  tasksService = inject(TasksService);
  auth = inject(AuthService);

  showAssignSection = signal(false);
  selectedToAssign = signal<number[]>([]);

  isEditingDescription = signal(false);
  cardDescription = signal<string>('');
  isLoadingContent = signal(false);
  hasDescription = signal(false);
  isEditingDueDate = false;
  tempDueDate: string = '';
  dueDate = signal<string | null>(null);
  cardComments = signal<any[]>([]);
  user_id = this.auth.user();

  startEditHeader() {
    this.tempTitle = this.SelectedCard?.title || '';

    const raw = (this.SelectedCard?.priority || '').toLowerCase();

    if (raw.includes('high')) this.tempPriority = 'high';
    else if (raw.includes('medium')) this.tempPriority = 'medium';
    else if (raw.includes('low')) this.tempPriority = 'low';
    else this.tempPriority = '';

    this.isEditingHeader = true;
  }

  async saveHeader() {
    const card_id = this.SelectedCard.id;
    const updates: any = {};
    if (this.tempTitle.trim() && this.tempTitle !== this.SelectedCard.title) {
      updates.title = this.tempTitle;
    }

    if (this.tempPriority.trim()) {
      const normalized = this.tempPriority.toLowerCase();

      if (normalized !== this.SelectedCard.priority?.toLowerCase()) {
        updates.priority = normalized;
      }
    }

    try {
      await this.tasksService.updateTaskDetails(card_id, updates.title, updates.priority);

      if (updates.title) {
        this.SelectedCard.title = updates.title;
      }
      if (updates.priority) {
        this.SelectedCard.priority = updates.priority;
      }
    } catch (err) {
      console.error('Header update failed', err);
    }

    this.isEditingHeader = false;
  }

  cancelHeader() {
    this.isEditingHeader = false;
  }

  openEditDescription() {
    this.isEditingDescription.set(true);
  }

  cancelDescriptionEdit() {
    this.isEditingDescription.set(false);
  }
  async loadCardContent() {
    const data = await this.cardContentService.getCardContent(this.SelectedCard.id);

    if (data?.content?.content_html) {
      this.cardDescription.set(data.content.content_html);
      this.hasDescription.set(true);
    } else {
      this.cardDescription.set('');
      this.hasDescription.set(false);
    }
  }
  async addComment() {
    console.log(this.comment);
    const data = await this.cardContentService.addCardComment(
      this.SelectedCard.id,
      this.auth.user().id,
      this.comment
    );
    this.comment = '';
    this.ngOnInit();
  }
  async deleteComment(comment_id: number) {
    await this.cardContentService.deleteCardComment(comment_id);
    this.ngOnInit();
  }
  async toggleAnimatedComplete() {
    this.SelectedCard.status = !this.SelectedCard.status;
    // update status
    const data = await this.cardContentService.addCardContent(
      this.SelectedCard.id,
      undefined,
      undefined,
      this.SelectedCard.status
    );
  }

  async ngOnInit() {
    const data = await this.cardContentService.getCardContent(this.SelectedCard.id);
    if (data?.content?.content_html) {
      this.cardDescription.set(data.content.content_html);
      this.hasDescription.set(true);
    } else {
      this.cardDescription.set('');
      this.hasDescription.set(false);
    }
    console.log(data);
    this.dueDate.set(data.content.due_date);
    this.SelectedCard.status = data.content.status === true;
    this.cardComments.set(data.comments);
    console.log(this.auth.user());
  }

  async saveDescription(html: string) {
    this.cardDescription.set(html);
    this.hasDescription.set(!!html.trim());
    this.isEditingDescription.set(false);
    await this.cardContentService.addCardContent(
      this.SelectedCard.id,
      this.cardDescription(),
      undefined,
      undefined
    );
  }
  getShortName(name: string) {
    return getShortNameUtil(name);
  }

  get unassignedMembers() {
    const assignedIds = this.SelectedCard?.members?.map((m: any) => m.user_id) || [];
    return this.boardMembers.filter((m) => !assignedIds.includes(m.user_id));
  }

  openAssignMember() {
    this.showAssignSection.set(!this.showAssignSection());
  }

  toggleAssign(member: any, checked: boolean) {
    const current = this.selectedToAssign();

    if (checked) {
      this.selectedToAssign.set([...current, member.user_id]);
    } else {
      this.selectedToAssign.set(current.filter((id) => id !== member.user_id));
    }
  }

  async assignSelected() {
    const toAdd = this.selectedToAssign();

    if (!toAdd.length) return;
    await this.cardMembershipService.addCardMembers(this.SelectedCard.id, toAdd);
    const newMembers = this.boardMembers.filter((bm: any) => toAdd.includes(bm.user_id));
    this.SelectedCard.members = [...this.SelectedCard.members, ...newMembers];
    this.selectedToAssign.set([]);
    this.showAssignSection.set(false);
  }

  async removeAssigned(member: any) {
    await this.cardMembershipService.deleteCardMember(this.SelectedCard.id, member.user_id);
    this.SelectedCard.members = this.SelectedCard.members.filter(
      (m: any) => m.user_id !== member.user_id
    );
  }
  startEditDueDate() {
    this.isEditingDueDate = true;

    const current = this.dueDate();

    this.tempDueDate = current ? new Date(current).toISOString().slice(0, 16) : '';
  }

  cancelEditDueDate() {
    this.isEditingDueDate = false;
  }
  async saveDueDate() {
    if (!this.tempDueDate) {
      this.SelectedCard.due_date = null;
      this.dueDate.set(null);

      this.isEditingDueDate = false;

      await this.cardContentService.addCardContent(
        this.SelectedCard.id,
        undefined,
        null,
        undefined
      );

      return;
    }

    this.SelectedCard.due_date = this.tempDueDate;
    this.dueDate.set(this.tempDueDate);

    this.isEditingDueDate = false;
    await this.cardContentService.addCardContent(
      this.SelectedCard.id,
      undefined,
      this.tempDueDate,
      undefined
    );
  }
  getPriorityClass(priority: string) {
    return priority?.split(' ')[0]?.toLowerCase() ?? '';
  }
}

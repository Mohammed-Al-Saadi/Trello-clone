import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard-info-panel',
  imports: [DatePipe],
  templateUrl: './dashboard-info-panel.html',
  styleUrl: './dashboard-info-panel.css',
})
export class DashboardInfoPanel {
  title = input<string>('');
  today = new Date();

  auth = inject(AuthService);
  workspaceOwnerName = input<string>('');

  // Extract first name
  ownerFirstName = computed(() => {
    const name = (this.workspaceOwnerName() || '').trim();
    return name ? name.split(/\s+/)[0] : '';
  });

  isMine = computed(() => {
    const user = this.auth.user();
    const currentUserName = (user?.full_name || '').trim().toLowerCase();
    const owner = (this.workspaceOwnerName() || '').trim().toLowerCase();

    return (
      currentUserName.split(' ')[0] &&
      owner.split(' ')[0] &&
      currentUserName.split(' ')[0] === owner.split(' ')[0]
    );
  });

  projectOwnerLabel = computed(() => {
    if (!this.workspaceOwnerName()) return '';
    return this.isMine() ? 'My workspace' : `${this.ownerFirstName()}'s workspace`;
  });
}

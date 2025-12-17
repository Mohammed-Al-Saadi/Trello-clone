import { DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [UpperCasePipe, TitleCasePipe, DatePipe],
  templateUrl: './project-card.html',
  styleUrls: ['./project-card.css'],
})
export class ProjectCard {
  @Input() projectsData: any[] = [];

  @Input() tooltipLabels: string[] = [];

  @Output() goToProject = new EventEmitter<number>();
  @Output() editProject = new EventEmitter<any>();
  @Output() deleteProject = new EventEmitter<{ id: number; owner: number; role_name: string }>();
}

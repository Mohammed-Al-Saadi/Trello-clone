import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
  standalone: true,
})
export class Header {
  title = input<string>('');
  p = input<string>('');
  strong = input<string>('');
  headerClass = input<string>('');
}

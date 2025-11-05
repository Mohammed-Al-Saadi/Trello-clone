import { Component, input } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface CardModel {
  title: string;
  p: string;
  icon: string;
  type?: 'material' | 'image';
  iconColor?: string;
  iconBgColor?: string;
  cardBgColor?: string;
}

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, NgFor, MatIconModule],
  templateUrl: './card.html',
  styleUrls: ['./card.css'],
})
export class Card {
  CardData = input<CardModel[]>([]);
  buttonClass = input<string>('');
}

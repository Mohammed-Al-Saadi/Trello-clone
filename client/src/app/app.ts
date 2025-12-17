import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReusableToast } from './components/reusable-toast/reusable-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReusableToast],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App {}

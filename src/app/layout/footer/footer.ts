import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Language } from '../../core/services/language';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly currentYear = new Date().getFullYear();

  constructor(public language: Language) {}
}


import { Component, OnDestroy, OnInit } from '@angular/core';
import { WORKSHOP } from '../../config/workshop.config';
import { RouterLink } from '@angular/router';
import { TranslatePipe,TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})


export class Landing implements OnInit, OnDestroy {
  workshop = WORKSHOP;

  days = '00';
  hours = '00';
  minutes = '00';
  seconds = '00';

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.updateCountdown();
    this.timer = setInterval(() => this.updateCountdown(), 1000);
  }
  constructor(private translate: TranslateService) {}

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
  
  get currentLanguage(): string {
  return this.translate.currentLang() ?? 'en';
}

  private updateCountdown(): void {
    const diff = Math.max(
      0,
      this.workshop.startsAt.getTime() - Date.now()
    );

    this.days = String(Math.floor(diff / 86400000)).padStart(2, '0');
    this.hours = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    this.minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    this.seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  }
}

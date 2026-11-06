import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe],
  template: `
    <header class="site-header">
      <div class="brand">
        {{ 'HEADER.BRAND' | translate }}
      </div>

      <div class="language-switch">
        <span>{{ 'HEADER.LANGUAGE' | translate }}:</span>

        <button
          type="button"
          [class.active]="currentLanguage === 'en'"
          (click)="changeLanguage('en')">
          English
        </button>

        <button
          type="button"
          [class.active]="currentLanguage === 'ta'"
            [disabled]="isRegisterPage"
          (click)="changeLanguage('ta')">
          தமிழ்
        </button>
      </div>
    </header>

    <router-outlet />
  `,
  styles: [`
    .site-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 5%;
      background: #ffffff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      gap: 15px;
      flex-wrap: wrap;
    }

    .brand {
      font-size: 20px;
      font-weight: 700;
      color: #1760ed;
    }

    .language-switch {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .language-switch button {
      padding: 8px 14px;
      border: 1px solid #1760ed;
      border-radius: 20px;
      background: white;
      color: #1760ed;
      cursor: pointer;
      font-weight: 600;
    }

    .language-switch button.active {
      background: #1760ed;
      color: white;
    }
    .language-switch button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

    @media (max-width: 480px) {
      .site-header {
        justify-content: center;
      }
    }
  `]
})
export class AppComponent {
  currentLanguage: 'en' | 'ta' = 'en';
  isRegisterPage = false;

  constructor(
    private translate: TranslateService,
    private router: Router
  ) {
    const savedLanguage = localStorage.getItem('tgs-language');
    this.currentLanguage = savedLanguage === 'ta' ? 'ta' : 'en';

    this.isRegisterPage = this.router.url.includes('/register');

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isRegisterPage = event.urlAfterRedirects.includes('/register');
      });
  }

  changeLanguage(language: 'en' | 'ta'): void {
    this.translate.use(language).subscribe(() => {
      this.currentLanguage = language;

      localStorage.setItem('tgs-language', language);

      document.documentElement.lang = language;
    });
  }
}

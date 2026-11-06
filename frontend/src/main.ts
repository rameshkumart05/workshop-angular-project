
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  provideAppInitializer,
  inject
} from '@angular/core';

import {
  provideTranslateService,
  TranslateService
} from '@ngx-translate/core';

import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),

    provideHttpClient(),

    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en',
      lang: 'en'
    }),

    provideAppInitializer(() => {
      const translate = inject(TranslateService);

      translate.addLangs(['en', 'ta']);

      const savedLanguage =
        localStorage.getItem('tgs-language') || 'en';

      const selectedLanguage =
        savedLanguage === 'ta' ? 'ta' : 'en';

      return translate.use(selectedLanguage);
    })
  ]
}).catch(err => console.error(err));

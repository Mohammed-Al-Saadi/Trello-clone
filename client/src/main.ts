import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig, httpReq } from './app/app.config';

bootstrapApplication(App, {
  providers: [...appConfig.providers, ...httpReq.providers],
}).catch((err) => console.error(err));

import { inject, InjectionToken } from '@angular/core';
import { AppConfig } from './app-config.model';
import { AppConfigLoader } from './app-config.loader';

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => inject(AppConfigLoader).get(),
});

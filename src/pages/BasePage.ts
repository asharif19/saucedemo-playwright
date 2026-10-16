import type { Page } from '@playwright/test';
import { HeaderComponent } from '@components/HeaderComponent';

/** Shared chrome for every authenticated page. */
export abstract class BasePage {
  readonly header: HeaderComponent;

  protected constructor(protected readonly page: Page) {
    this.header = new HeaderComponent(page);
  }
}

import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object class with common functionality
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }
}

/**
 * Home Page Object
 */
export class HomePage extends BasePage {
  readonly navigation: Locator;
  readonly searchInput: Locator;
  readonly uploadButton: Locator;
  readonly recentDocuments: Locator;
  readonly trendingSection: Locator;

  constructor(page: Page) {
    super(page);
    this.navigation = this.page.locator('[data-testid="main-navigation"]');
    this.searchInput = this.page.locator('[data-testid="search-input"]');
    this.uploadButton = this.page.locator('[data-testid="upload-button"]');
    this.recentDocuments = this.page.locator('[data-testid="recent-documents"]');
    this.trendingSection = this.page.locator('[data-testid="trending-section"]');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async navigateTo(section: 'home' | 'browse' | 'collections' | 'search' | 'favorites') {
    const sectionMap = {
      home: 'Home',
      browse: 'Browse',
      collections: 'Collections',
      search: 'Search',
      favorites: 'Favorites',
    };

    await this.page.click(`text=${sectionMap[section]}`);
  }

  async uploadDocument() {
    await this.uploadButton.click();
  }
}

/**
 * Browse Page Object
 */
export class BrowsePage extends BasePage {
  readonly categoryFilters: Locator;
  readonly documentGrid: Locator;
  readonly sortOptions: Locator;

  constructor(page: Page) {
    super(page);
    this.categoryFilters = this.page.locator('[data-testid="category-filters"]');
    this.documentGrid = this.page.locator('[data-testid="document-grid"]');
    this.sortOptions = this.page.locator('[data-testid="sort-options"]');
  }

  async filterByCategory(category: string) {
    await this.categoryFilters.locator(`text=${category}`).click();
  }

  async sortBy(option: string) {
    await this.sortOptions.selectOption(option);
  }
}

/**
 * Search Page Object
 */
export class SearchPage extends BasePage {
  readonly searchInput: Locator;
  readonly resultsContainer: Locator;
  readonly filters: Locator;
  readonly noResults: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = this.page.locator('[data-testid="search-input"]');
    this.resultsContainer = this.page.locator('[data-testid="search-results"]');
    this.filters = this.page.locator('[data-testid="search-filters"]');
    this.noResults = this.page.locator('[data-testid="no-results"]');
  }

  async performSearch(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async applyFilter(filterType: string, value: string) {
    await this.filters.locator(`[data-filter="${filterType}"]`).selectOption(value);
  }
}

/**
 * Document Detail Page Object
 */
export class DocumentDetailPage extends BasePage {
  readonly documentTitle: Locator;
  readonly documentContent: Locator;
  readonly downloadButton: Locator;
  readonly favoriteButton: Locator;
  readonly shareButton: Locator;

  constructor(page: Page) {
    super(page);
    this.documentTitle = this.page.locator('[data-testid="document-title"]');
    this.documentContent = this.page.locator('[data-testid="document-content"]');
    this.downloadButton = this.page.locator('[data-testid="download-button"]');
    this.favoriteButton = this.page.locator('[data-testid="favorite-button"]');
    this.shareButton = this.page.locator('[data-testid="share-button"]');
  }

  async downloadDocument() {
    await this.downloadButton.click();
  }

  async addToFavorites() {
    await this.favoriteButton.click();
  }

  async shareDocument() {
    await this.shareButton.click();
  }
}

/**
 * Collections Page Object
 */
export class CollectionsPage extends BasePage {
  readonly createCollectionButton: Locator;
  readonly collectionGrid: Locator;
  readonly searchCollections: Locator;

  constructor(page: Page) {
    super(page);
    this.createCollectionButton = this.page.locator('[data-testid="create-collection"]');
    this.collectionGrid = this.page.locator('[data-testid="collection-grid"]');
    this.searchCollections = this.page.locator('[data-testid="search-collections"]');
  }

  async createNewCollection(name: string, description?: string) {
    await this.createCollectionButton.click();

    const nameInput = this.page.locator('[data-testid="collection-name-input"]');
    await nameInput.fill(name);

    if (description) {
      const descInput = this.page.locator('[data-testid="collection-description-input"]');
      await descInput.fill(description);
    }

    await this.page.locator('[data-testid="save-collection"]').click();
  }
}

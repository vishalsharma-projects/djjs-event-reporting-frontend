import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { UserPreferencesService, ColumnPreferences } from './user-preferences.service';

export interface ColumnConfig {
  key: string; // Unique key for this table's preferences
  defaultOrder: string[]; // Default column order
  displayNames: Record<string, string>; // Column display names
}

export interface TableColumnState {
  columnOrder: string[];
  hiddenColumns: string[];
  draggedColumn: string | null;
  dragOverColumn: string | null;
  visibilityMenuOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ColumnPreferencesHelperService {
  private stateCache = new Map<string, BehaviorSubject<TableColumnState>>();

  constructor(private userPreferencesService: UserPreferencesService) {}

  /**
   * Initialize column preferences for a table
   * Returns immediately with default state, then loads saved preferences asynchronously
   */
  initializeTable(config: ColumnConfig): Observable<TableColumnState> {
    // Initialize with default state immediately (synchronous)
    const initialState: TableColumnState = {
      columnOrder: [...config.defaultOrder],
      hiddenColumns: [],
      draggedColumn: null,
      dragOverColumn: null,
      visibilityMenuOpen: false
    };

    const stateSubject = new BehaviorSubject<TableColumnState>(initialState);
    this.stateCache.set(config.key, stateSubject);

    // Load saved preferences asynchronously and update state
    this.loadPreferences(config.key, config.defaultOrder).pipe(
      tap(preferences => {
        if (preferences) {
          stateSubject.next({
            ...initialState,
            columnOrder: preferences.column_order || config.defaultOrder,
            hiddenColumns: preferences.hidden_columns || []
          });
        }
      }),
      catchError(error => {
        console.error(`Error loading preferences for ${config.key}:`, error);
        return of(null);
      })
    ).subscribe();

    // Return the initial state immediately (synchronous)
    return of(initialState);
  }

  /**
   * Get current state for a table
   */
  getState(key: string): TableColumnState | null {
    const subject = this.stateCache.get(key);
    return subject ? subject.value : null;
  }

  /**
   * Get state observable for a table
   */
  getStateObservable(key: string): Observable<TableColumnState> | null {
    const subject = this.stateCache.get(key);
    return subject ? subject.asObservable() : null;
  }

  /**
   * Update column order
   */
  updateColumnOrder(key: string, newOrder: string[]): void {
    const subject = this.stateCache.get(key);
    if (subject) {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        columnOrder: newOrder
      });
      // Save asynchronously without blocking
      this.savePreferencesAsync(key, {
        column_order: newOrder,
        hidden_columns: currentState.hiddenColumns
      });
    }
  }

  /**
   * Toggle column visibility
   */
  toggleColumnVisibility(key: string, column: string): void {
    const subject = this.stateCache.get(key);
    if (subject) {
      const currentState = subject.value;
      const hiddenColumns = [...currentState.hiddenColumns];
      const index = hiddenColumns.indexOf(column);

      if (index > -1) {
        hiddenColumns.splice(index, 1);
      } else {
        hiddenColumns.push(column);
      }

      subject.next({
        ...currentState,
        hiddenColumns
      });

      // Save asynchronously without blocking
      this.savePreferencesAsync(key, {
        column_order: currentState.columnOrder,
        hidden_columns: hiddenColumns
      });
    }
  }

  /**
   * Show all columns
   */
  showAllColumns(key: string): void {
    const subject = this.stateCache.get(key);
    if (subject) {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        hiddenColumns: []
      });

      // Save asynchronously without blocking
      this.savePreferencesAsync(key, {
        column_order: currentState.columnOrder,
        hidden_columns: []
      });
    }
  }

  /**
   * Toggle visibility menu
   */
  toggleVisibilityMenu(key: string): void {
    const subject = this.stateCache.get(key);
    if (subject) {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        visibilityMenuOpen: !currentState.visibilityMenuOpen
      });
    }
  }

  /**
   * Close visibility menu
   */
  closeVisibilityMenu(key: string): void {
    const subject = this.stateCache.get(key);
    if (subject) {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        visibilityMenuOpen: false
      });
    }
  }

  /**
   * Set dragged column
   */
  setDraggedColumn(key: string, column: string | null): void {
    const subject = this.stateCache.get(key);
    if (subject) {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        draggedColumn: column
      });
    }
  }

  /**
   * Set drag over column
   */
  setDragOverColumn(key: string, column: string | null): void {
    const subject = this.stateCache.get(key);
    if (subject) {
      const currentState = subject.value;
      subject.next({
        ...currentState,
        dragOverColumn: column
      });
    }
  }

  /**
   * Check if column is hidden
   */
  isColumnHidden(key: string, column: string): boolean {
    const state = this.getState(key);
    return state ? state.hiddenColumns.includes(column) : false;
  }

  /**
   * Get visible column count
   */
  getVisibleColumnCount(key: string): number {
    const state = this.getState(key);
    if (!state) return 0;
    return state.columnOrder.filter(c => !state.hiddenColumns.includes(c)).length;
  }

  /**
   * Clean up state for a table
   */
  cleanup(key: string): void {
    this.stateCache.delete(key);
  }

  /**
   * Clean up all states
   */
  cleanupAll(): void {
    this.stateCache.clear();
  }

  /**
   * Load preferences from backend
   */
  private loadPreferences(key: string, defaultOrder: string[]): Observable<ColumnPreferences | null> {
    return this.userPreferencesService.getColumnPreferences(key).pipe(
      map(preferences => {
        if (!preferences) return null;

        // Validate and merge with default order
        const validOrder = preferences.column_order?.filter(col => defaultOrder.includes(col)) || [];
        const missingColumns = defaultOrder.filter(col => !validOrder.includes(col));
        
        return {
          column_order: [...validOrder, ...missingColumns],
          hidden_columns: preferences.hidden_columns || []
        };
      }),
      catchError(error => {
        console.error(`Error loading column preferences for ${key}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Save preferences to backend (async, non-blocking)
   */
  private savePreferencesAsync(key: string, preferences: ColumnPreferences): void {
    this.userPreferencesService.saveColumnPreferences(key, preferences).pipe(
      catchError(error => {
        console.error(`Error saving column preferences for ${key}:`, error);
        return of(null);
      })
    ).subscribe({
      next: () => {
        // Silent success - preferences saved
      },
      error: (error) => {
        // Error already handled in catchError
        console.error(`Failed to save preferences for ${key}:`, error);
      }
    });
  }
}


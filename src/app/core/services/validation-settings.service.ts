import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ValidationSettings {
  enabled: boolean;
  showFieldErrors: boolean;
  showToastErrors: boolean;
  strictMode: boolean; // If true, blocks form submission on validation errors
}

@Injectable({
  providedIn: 'root'
})
export class ValidationSettingsService {
  private readonly STORAGE_KEY = 'event-form-validation-settings';
  private settingsSubject: BehaviorSubject<ValidationSettings>;
  public settings$: Observable<ValidationSettings>;

  constructor() {
    // Load settings from localStorage or use defaults
    const savedSettings = this.loadSettings();
    this.settingsSubject = new BehaviorSubject<ValidationSettings>(savedSettings);
    this.settings$ = this.settingsSubject.asObservable();
  }

  /**
   * Get current validation settings
   */
  getSettings(): ValidationSettings {
    return this.settingsSubject.value;
  }

  /**
   * Check if validation is enabled
   */
  isValidationEnabled(): boolean {
    return this.settingsSubject.value.enabled;
  }

  /**
   * Check if field errors should be shown
   */
  shouldShowFieldErrors(): boolean {
    return this.settingsSubject.value.enabled && this.settingsSubject.value.showFieldErrors;
  }

  /**
   * Check if toast errors should be shown
   */
  shouldShowToastErrors(): boolean {
    return this.settingsSubject.value.enabled && this.settingsSubject.value.showToastErrors;
  }

  /**
   * Check if strict mode is enabled (blocks submission on errors)
   */
  isStrictMode(): boolean {
    return this.settingsSubject.value.enabled && this.settingsSubject.value.strictMode;
  }

  /**
   * Update validation settings
   */
  updateSettings(settings: Partial<ValidationSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings: ValidationSettings = {
      ...currentSettings,
      ...settings
    };
    this.saveSettings(newSettings);
    this.settingsSubject.next(newSettings);
  }

  /**
   * Enable validation
   */
  enableValidation(): void {
    this.updateSettings({ enabled: true });
  }

  /**
   * Disable validation
   */
  disableValidation(): void {
    this.updateSettings({ enabled: false });
  }

  /**
   * Toggle validation on/off
   */
  toggleValidation(): void {
    this.updateSettings({ enabled: !this.settingsSubject.value.enabled });
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    const defaultSettings: ValidationSettings = {
      enabled: true,
      showFieldErrors: true,
      showToastErrors: true,
      strictMode: true
    };
    this.saveSettings(defaultSettings);
    this.settingsSubject.next(defaultSettings);
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): ValidationSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all properties exist
        return {
          enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          showFieldErrors: parsed.showFieldErrors !== undefined ? parsed.showFieldErrors : true,
          showToastErrors: parsed.showToastErrors !== undefined ? parsed.showToastErrors : true,
          strictMode: parsed.strictMode !== undefined ? parsed.strictMode : true
        };
      }
    } catch (error) {
      console.error('Error loading validation settings:', error);
    }

    // Return defaults
    return {
      enabled: true,
      showFieldErrors: true,
      showToastErrors: true,
      strictMode: true
    };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(settings: ValidationSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving validation settings:', error);
    }
  }
}





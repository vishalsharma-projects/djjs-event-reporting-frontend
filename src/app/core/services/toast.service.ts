import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface ToastConfig {
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail: string;
  life?: number;
  closable?: boolean;
  sticky?: boolean;
  data?: any; // For passing custom data
  onClick?: () => void; // Click handler
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private messageService: MessageService) {}

  /**
   * Show success toast with green color
   */
  success(message: string, title: string = 'Success', duration: number = 3000, onClick?: () => void): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: duration,
      closable: true,
      sticky: false,
      data: { onClick }
    });
  }

  /**
   * Show info toast with blue color
   */
  info(message: string, title: string = 'Info', duration: number = 3000, onClick?: () => void): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: duration,
      closable: true,
      sticky: false,
      data: { onClick }
    });
  }

  /**
   * Show warning toast with orange/yellow color
   */
  warning(message: string, title: string = 'Warning', duration: number = 4000, onClick?: () => void): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: duration,
      closable: true,
      sticky: false,
      data: { onClick }
    });
  }

  /**
   * Show error toast with red color
   */
  error(message: string, title: string = 'Error', duration: number = 5000, onClick?: () => void): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: duration,
      closable: true,
      sticky: false, // Changed to false so it auto-hides
      data: { onClick }
    });
  }

  /**
   * Show validation error toast with red color
   */
  validationError(message: string, errors?: string[]): void {
    const detail = errors && errors.length > 0
      ? `${message}\n• ${errors.slice(0, 5).join('\n• ')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`
      : message;

    this.messageService.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: detail,
      life: 6000, // Longer duration for validation errors but still auto-hide
      closable: true,
      sticky: false // Changed to false so it auto-hides
    });
  }

  /**
   * Show custom toast with full configuration
   */
  custom(config: ToastConfig): void {
    this.messageService.add({
      severity: config.severity || 'info',
      summary: config.summary || 'Notification',
      detail: config.detail,
      life: config.life || 3000,
      closable: config.closable !== false,
      sticky: config.sticky || false,
      data: config.data || (config.onClick ? { onClick: config.onClick } : undefined)
    });
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.messageService.clear();
  }
}


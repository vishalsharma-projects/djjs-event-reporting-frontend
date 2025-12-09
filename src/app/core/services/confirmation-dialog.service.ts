import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

export interface ConfirmationDialogOptions {
  title?: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  showCancelButton?: boolean;
  showSuccessMessage?: boolean;
  successTitle?: string;
  successText?: string;
  showCancelMessage?: boolean;
  cancelTitle?: string;
  cancelText?: string;
  useBootstrapButtons?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {

  private readonly defaultOptions: ConfirmationDialogOptions = {
    title: 'Are you sure?',
    text: 'You won\'t be able to revert this!',
    icon: 'warning',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'No, cancel!',
    confirmButtonColor: '#34c38f',
    cancelButtonColor: '#f46a6a',
    showCancelButton: true,
    showSuccessMessage: false,
    successTitle: 'Deleted!',
    successText: 'Your file has been deleted.',
    showCancelMessage: false,
    cancelTitle: 'Cancelled',
    cancelText: 'Your imaginary file is safe :)',
    useBootstrapButtons: false
  };

  constructor() { }

  /**
   * Show a confirmation dialog
   * @param options Configuration options for the dialog
   * @returns Promise that resolves with the user's choice
   */
  confirm(options: ConfirmationDialogOptions = {}): Promise<SweetAlertResult> {
    const config = { ...this.defaultOptions, ...options };

    if (config.useBootstrapButtons) {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: 'btn btn-success',
          cancelButton: 'btn btn-danger ms-2'
        },
        buttonsStyling: false
      });

      return swalWithBootstrapButtons.fire({
        title: config.title,
        text: config.text,
        icon: config.icon,
        showCancelButton: config.showCancelButton,
        confirmButtonText: config.confirmButtonText,
        cancelButtonText: config.cancelButtonText,
      }).then((result) => {
        if (result.value && config.showSuccessMessage) {
          swalWithBootstrapButtons.fire(
            config.successTitle,
            config.successText,
            'success'
          );
        } else if (result.dismiss === Swal.DismissReason.cancel && config.showCancelMessage) {
          swalWithBootstrapButtons.fire(
            config.cancelTitle,
            config.cancelText,
            'error'
          );
        }
        return result;
      });
    } else {
      return Swal.fire({
        title: config.title,
        text: config.text,
        icon: config.icon,
        showCancelButton: config.showCancelButton,
        confirmButtonColor: config.confirmButtonColor,
        cancelButtonColor: config.cancelButtonColor,
        confirmButtonText: config.confirmButtonText,
        cancelButtonText: config.cancelButtonText,
      }).then((result) => {
        if (result.value && config.showSuccessMessage) {
          Swal.fire(
            config.successTitle,
            config.successText,
            'success'
          );
        }
        return result;
      });
    }
  }

  /**
   * Show a delete confirmation dialog with default delete messaging
   * @param options Optional configuration to override defaults
   * @returns Promise that resolves with the user's choice
   */
  confirmDelete(options: Partial<ConfirmationDialogOptions> = {}): Promise<SweetAlertResult> {
    return this.confirm({
      ...options,
      showSuccessMessage: options.showSuccessMessage !== undefined ? options.showSuccessMessage : true,
      successTitle: options.successTitle || 'Deleted!',
      successText: options.successText || 'Item has been deleted.',
    });
  }

  /**
   * Show a confirmation dialog for a custom action
   * @param actionName The name of the action (e.g., 'submit', 'publish', 'archive')
   * @param options Optional configuration to override defaults
   * @returns Promise that resolves with the user's choice
   */
  confirmAction(actionName: string, options: Partial<ConfirmationDialogOptions> = {}): Promise<SweetAlertResult> {
    return this.confirm({
      title: `Are you sure you want to ${actionName}?`,
      text: options.text || 'This action cannot be undone.',
      confirmButtonText: options.confirmButtonText || `Yes, ${actionName} it!`,
      ...options
    });
  }
}


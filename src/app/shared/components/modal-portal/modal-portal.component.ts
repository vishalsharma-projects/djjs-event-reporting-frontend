import { Component, OnInit, AfterViewInit, ViewContainerRef, ChangeDetectorRef, OnDestroy, ElementRef, QueryList, ViewChildren, Injector, ComponentRef, ViewChild, TemplateRef } from '@angular/core';
import { ModalPortalService, ModalInstance } from '../../../core/services/modal-portal.service';
import { FocusManagerService } from '../../../core/services/focus-manager.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Modal Portal Component
 * Renders all modals at the body level, outside layout containers.
 * This ensures modals are never clipped by overflow or transform contexts.
 */
@Component({
  selector: 'app-modal-portal',
  templateUrl: './modal-portal.component.html',
  styleUrls: ['./modal-portal.component.scss']
})
export class ModalPortalComponent implements OnInit, AfterViewInit, OnDestroy {
  activeModals: ModalInstance[] = [];
  private destroy$ = new Subject<void>();
  private lastFocusedModalId: string | null = null;
  private focusTrapListener: ((event: KeyboardEvent) => void) | null = null;
  @ViewChildren('modalElement') modalElements!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('modalBody') modalBodies!: QueryList<ElementRef<HTMLElement>>;
  private componentRefs = new Map<string, ComponentRef<any>>();

  constructor(
    private modalService: ModalPortalService,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private focusManager: FocusManagerService
  ) {}

  ngOnInit(): void {
    // Register container with service
    this.modalService.setContainer(this.viewContainerRef);

    // Subscribe to modal changes
    this.updateModals();
    
    // TEMPORARY: Add click logger for debugging
    this.setupClickLogger();
    
    // Listen for modal open events to update UI
    this.modalService.onModalOpened()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateModals();
      });

    // Listen for modal close events to update UI
    this.modalService.onModalClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const wasOpen = this.activeModals.length > 0;
        this.updateModals();
        
        // If modal was closed and no modals remain, restore focus and cleanup
        if (wasOpen && this.activeModals.length === 0) {
          this.cleanupFocusTrap();
          this.focusManager.restoreFocus();
          this.lastFocusedModalId = null;
        }
      });
  }

  /**
   * TEMPORARY: Setup click logger to debug click events
   */
  private clickLogger?: (event: MouseEvent) => void;
  
  private setupClickLogger(): void {
    this.clickLogger = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const path = event.composedPath();
      
      // Helper function to safely get className as string
      const getClassNameString = (element: any): string => {
        if (!element) return '';
        // Handle both string and DOMTokenList (SVG elements)
        if (typeof element.className === 'string') {
          return element.className;
        } else if (element.className && typeof element.className.baseVal === 'string') {
          // SVG elements have className.baseVal
          return element.className.baseVal;
        } else if (element.classList && element.classList.toString) {
          // Fallback to classList if available
          return element.classList.toString();
        }
        return '';
      };
      
      const targetClassName = getClassNameString(target);
      const targetClassStr = targetClassName ? '.' + targetClassName.split(' ').join('.') : '';
      
      console.log('🔍 Click Debug:', {
        target: target.tagName + targetClassStr,
        targetId: target.id,
        pointerEvents: window.getComputedStyle(target).pointerEvents,
        zIndex: window.getComputedStyle(target).zIndex,
        path: Array.from(path).slice(0, 5).map((el: any) => {
          const elClassName = getClassNameString(el);
          const elClassStr = elClassName ? '.' + elClassName.split(' ').slice(0, 2).join('.') : '';
          return el.tagName + elClassStr;
        }),
        isModal: target.closest('.modal'),
        isBackdrop: target.closest('.modal-backdrop'),
        isModalContent: target.closest('.modal-content'),
        isButton: target.tagName === 'BUTTON' || target.closest('button')
      });
    };
    
    document.addEventListener('click', this.clickLogger, true);
  }
  
  private removeClickLogger(): void {
    if (this.clickLogger) {
      document.removeEventListener('click', this.clickLogger, true);
      this.clickLogger = undefined;
    }
  }

  ngAfterViewInit(): void {
    // Watch for QueryList changes to handle new modals (after ViewChildren is available)
    this.modalElements.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleModalListChange();
        // Create components for any modals that don't have components yet
        this.activeModals.forEach(modal => {
          if (modal.componentType && !this.componentRefs.has(modal.id)) {
            setTimeout(() => {
              this.createComponentForModal(modal);
            }, 0);
          }
        });
      });
    
    // Initial check in case modals are already rendered
    if (this.modalElements.length > 0) {
      this.handleModalListChange();
      // Create components for any modals that don't have components yet
      this.activeModals.forEach(modal => {
        if (modal.componentType && !this.componentRefs.has(modal.id)) {
          setTimeout(() => {
            this.createComponentForModal(modal);
          }, 0);
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Destroy all component refs
    this.componentRefs.forEach((ref, modalId) => {
      ref.destroy();
    });
    this.componentRefs.clear();
    
    this.cleanupFocusTrap();
    this.removeClickLogger();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update active modals list
   */
  updateModals(): void {
    const wasEmpty = this.activeModals.length === 0;
    const previousTopModalId = this.activeModals.length > 0 ? this.activeModals[this.activeModals.length - 1].id : null;
    
    const previousModalIds = new Set(this.activeModals.map(m => m.id));
    this.activeModals = this.modalService.getModalsForRendering();
    const currentModalIds = new Set(this.activeModals.map(m => m.id));
    
    // Destroy components for modals that were closed
    previousModalIds.forEach(modalId => {
      if (!currentModalIds.has(modalId)) {
        this.destroyComponent(modalId);
      }
    });
    
    // Create components for new modals
    this.activeModals.forEach(modal => {
      if (!previousModalIds.has(modal.id) && modal.componentType) {
        // New modal with component - will be created in ngAfterViewChecked or after view init
        setTimeout(() => {
          this.createComponentForModal(modal);
        }, 0);
      }
    });
    
    // Store active element when first modal opens
    if (wasEmpty && this.activeModals.length > 0) {
      this.focusManager.storeActiveElement();
      this.setupFocusTrap();
    }
    
    // Handle focus when new modal becomes topmost (focus once per newly-opened modal)
    const currentTopModalId = this.activeModals.length > 0 ? this.activeModals[this.activeModals.length - 1].id : null;
    if (currentTopModalId && currentTopModalId !== previousTopModalId && currentTopModalId !== this.lastFocusedModalId) {
      // New modal opened - focus it once
      setTimeout(() => {
        this.focusTopmostModal();
      }, 0);
    }
    
    this.cdr.detectChanges();
    
    // Setup focus trap listener after view updates
    if (this.activeModals.length > 0) {
      setTimeout(() => {
        this.setupFocusTrap();
      }, 0);
    }
  }
  
  /**
   * Create component for a modal
   */
  private createComponentForModal(modal: ModalInstance): void {
    if (!modal.componentType || this.componentRefs.has(modal.id)) {
      return;
    }
    
    // Find the modal body element for this modal
    const modalElement = this.modalElements?.find(el => {
      const modalId = el.nativeElement.getAttribute('data-modal-id');
      return modalId === modal.id;
    });
    
    if (!modalElement) {
      console.warn(`Modal element not found for modal ${modal.id}`);
      return;
    }
    
    // Find the modal body container
    const modalBody = modalElement.nativeElement.querySelector(`[data-modal-body="${modal.id}"]`) as HTMLElement;
    if (!modalBody) {
      console.warn(`Modal body container not found for modal ${modal.id}`);
      return;
    }
    
    // Create an injector with the modal data
    const injector = this.getComponentInjector(modal);
    
    try {
      // Create a container element in the modal body
      // This ensures the component is properly attached to the DOM tree
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      modalBody.appendChild(container);
      
      // Create a ViewContainerRef from the container element
      // We'll use the main viewContainerRef but attach to our container
      const componentRef = this.viewContainerRef.createComponent(modal.componentType, {
        injector: injector,
        projectableNodes: []
      });
      
      // Set inputs if data is provided
      if (modal.config.data) {
        Object.keys(modal.config.data).forEach(key => {
          if (componentRef.instance && key in componentRef.instance) {
            (componentRef.instance as any)[key] = modal.config.data[key];
          }
        });
        
        // Also set data input if component has it
        if ('data' in componentRef.instance) {
          (componentRef.instance as any).data = modal.config.data;
        }
      }
      
      // Get the component's host element
      const hostElement = componentRef.location.nativeElement;
      
      // Move the component to our container
      // The component is initially attached to viewContainerRef, we need to move it
      if (hostElement.parentNode) {
        hostElement.parentNode.removeChild(hostElement);
      }
      container.appendChild(hostElement);
      
      // Store component ref in modal instance and our map
      modal.componentRef = componentRef;
      this.componentRefs.set(modal.id, componentRef);
      
      // Ensure component is properly initialized
      // The component's ngOnInit should have been called by Angular
      // But we need to ensure change detection runs after moving the element
      setTimeout(() => {
        // Trigger change detection on the component
        componentRef.changeDetectorRef.detectChanges();
        
        // Trigger change detection on the modal portal
        this.cdr.detectChanges();
        
        // Verify component is visible and in the DOM
        const isVisible = window.getComputedStyle(hostElement).display !== 'none';
        const isInDOM = document.body.contains(hostElement) || modalBody.contains(hostElement);
        
        console.log(`Component created for modal ${modal.id}`, {
          componentInstance: componentRef.instance,
          hasInstance: !!componentRef.instance,
          hostElement: hostElement,
          hostElementTag: hostElement.tagName,
          modalBody: modalBody,
          isVisible: isVisible,
          isInDOM: isInDOM,
          componentDisplay: window.getComputedStyle(hostElement).display,
          componentVisibility: window.getComputedStyle(hostElement).visibility,
          componentWidth: window.getComputedStyle(hostElement).width,
          componentHeight: window.getComputedStyle(hostElement).height,
          parentElement: hostElement.parentElement?.tagName,
          modalBodyChildren: modalBody.children.length
        });
        
        // If component is not visible, try to force it
        if (!isVisible || !isInDOM) {
          console.warn(`Component for modal ${modal.id} may not be visible. Attempting to fix...`);
          hostElement.style.display = 'block';
          hostElement.style.visibility = 'visible';
          componentRef.changeDetectorRef.detectChanges();
        }
      }, 100);
    } catch (error) {
      console.error(`Error creating component for modal ${modal.id}:`, error);
    }
  }
  
  /**
   * Destroy component for a modal
   */
  private destroyComponent(modalId: string): void {
    const componentRef = this.componentRefs.get(modalId);
    if (componentRef) {
      componentRef.destroy();
      this.componentRefs.delete(modalId);
      console.log(`Component destroyed for modal ${modalId}`);
    }
  }

  /**
   * Handle QueryList changes (when modals are added/removed)
   */
  private handleModalListChange(): void {
    if (this.activeModals.length > 0) {
      const topModal = this.activeModals[this.activeModals.length - 1];
      if (topModal && topModal.id !== this.lastFocusedModalId) {
        // New modal in DOM - focus it once
        setTimeout(() => {
          this.focusTopmostModal();
        }, 0);
      }
    }
  }

  /**
   * Focus the topmost modal (only once per modal)
   */
  private focusTopmostModal(): void {
    if (!this.modalElements || this.activeModals.length === 0) {
      return;
    }

    const topModal = this.modalElements.last;
    if (!topModal?.nativeElement) {
      return;
    }

    const topModalInstance = this.activeModals[this.activeModals.length - 1];
    if (topModalInstance.id === this.lastFocusedModalId) {
      // Already focused this modal
      return;
    }

    // Try to focus first focusable element
    const focused = this.focusManager.moveFocusToFirst(topModal.nativeElement);
    
    if (focused) {
      this.lastFocusedModalId = topModalInstance.id;
    } else {
      // Fallback: focus close button or modal container
      const closeButton = topModal.nativeElement.querySelector('.btn-close') as HTMLElement;
      if (closeButton) {
        closeButton.focus();
        this.lastFocusedModalId = topModalInstance.id;
      } else {
        // Last resort: focus modal container
        topModal.nativeElement.focus();
        this.lastFocusedModalId = topModalInstance.id;
      }
    }
  }

  /**
   * Setup document-level focus trap listener
   */
  private setupFocusTrap(): void {
    if (this.focusTrapListener || this.activeModals.length === 0) {
      return;
    }

    this.focusTrapListener = (event: KeyboardEvent) => {
      if (this.activeModals.length === 0) {
        return;
      }

      // Handle ESC key - close topmost modal only (if no overlay is open)
      if (event.key === 'Escape') {
        // Check if any PrimeNG overlay is currently visible/open
        if (this.isAnyOverlayOpen()) {
          // Overlay is open - don't close modal, let overlay handle ESC
          return;
        }

        const topModal = this.activeModals[this.activeModals.length - 1];
        if (topModal && topModal.config.keyboard !== false) {
          event.preventDefault();
          event.stopPropagation();
          this.closeModal(topModal.id);
          return;
        }
      }

      // Handle Tab key - trap focus within topmost modal
      if (event.key === 'Tab' && this.modalElements) {
        const topModal = this.modalElements.last;
        if (topModal?.nativeElement) {
          this.focusManager.trapFocus(event, topModal.nativeElement);
        }
      }
    };

    document.addEventListener('keydown', this.focusTrapListener, true);
  }

  /**
   * Cleanup focus trap listener
   */
  private cleanupFocusTrap(): void {
    if (this.focusTrapListener) {
      document.removeEventListener('keydown', this.focusTrapListener, true);
      this.focusTrapListener = null;
    }
  }

  /**
   * Check if there are active modals
   */
  hasActiveModals(): boolean {
    return this.activeModals.length > 0;
  }

  /**
   * Get modal dialog classes based on config
   */
  getModalDialogClasses(config: any): string {
    const classes: string[] = [];

    if (config.centered) {
      classes.push('modal-dialog-centered');
    }

    if (config.scrollable) {
      classes.push('modal-dialog-scrollable');
    }

    if (config.size) {
      if (config.size === 'fullscreen') {
        classes.push('modal-fullscreen');
      } else {
        classes.push(`modal-${config.size}`);
      }
    }

    if (config.class) {
      classes.push(config.class);
    }

    return classes.join(' ');
  }

  /**
   * Check if value is a template
   */
  isTemplate(value: any): boolean {
    return value && value.createEmbeddedView;
  }

  /**
   * Get injector for component with modal data
   */
  getComponentInjector(modal: ModalInstance): Injector {
    return Injector.create({
      providers: [
        { provide: 'MODAL_DATA', useValue: modal.config.data || {} },
        { provide: 'MODAL_CONFIG', useValue: modal.config }
      ],
      parent: this.viewContainerRef.injector
    });
  }

  /**
   * Handle backdrop click - only close topmost modal
   */
  onBackdropClick(event: MouseEvent): void {
    // Check if click is inside a PrimeNG overlay (dropdown, calendar, etc.)
    const target = event.target as HTMLElement;
    if (this.isClickInsideOverlay(target)) {
      // Don't close modal if clicking inside overlay
      return;
    }

    // Close topmost modal if backdrop click is enabled
    const topModal = this.activeModals[this.activeModals.length - 1];
    if (topModal && topModal.config.closeOnBackdropClick !== false && topModal.config.backdrop !== 'static') {
      this.closeModal(topModal.id);
    }
  }

  /**
   * Handle modal container click (to prevent backdrop click when clicking modal content)
   */
  onModalClick(event: MouseEvent, modal: ModalInstance): void {
    const target = event.target as HTMLElement;
    
    // If clicking the modal element itself (not content), treat as backdrop click
    if (target.classList.contains('modal') && modal.config.closeOnBackdropClick !== false) {
      // Check if click is inside overlay
      if (!this.isClickInsideOverlay(target)) {
        this.closeModal(modal.id);
      }
      // Stop propagation for backdrop clicks
      event.stopPropagation();
      return;
    }
    
    // For clicks inside modal-content, allow them to propagate normally
    // Don't stop propagation here - let buttons handle their own clicks
    // Only stop if we're actually closing the modal
  }

  /**
   * Check if click target is inside a PrimeNG overlay
   */
  private isClickInsideOverlay(target: HTMLElement): boolean {
    // Check for PrimeNG overlay containers (whitelist + generic selector)
    const overlaySelectors = [
      // Specific overlay panels
      '.p-dropdown-panel',
      '.p-dropdown-items-wrapper',
      '.p-calendar-panel',
      '.p-datepicker',
      '.p-datepicker-panel',
      '.p-overlaypanel',
      '.p-menu',
      '.p-menu-list',
      '.p-tooltip',
      '.p-tooltip-text',
      '.p-toast',
      '.p-toast-message',
      // Generic PrimeNG overlay container (if available)
      '[class*="p-component-overlay"]',
      '[class*="p-overlay"]'
    ];

    for (const selector of overlaySelectors) {
      if (target.closest(selector)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if any PrimeNG overlay is currently open/visible
   */
  private isAnyOverlayOpen(): boolean {
    // Check for visible PrimeNG overlay containers
    const overlaySelectors = [
      '.p-dropdown-panel:not([style*="display: none"])',
      '.p-calendar-panel:not([style*="display: none"])',
      '.p-datepicker:not([style*="display: none"])',
      '.p-datepicker-panel:not([style*="display: none"])',
      '.p-overlaypanel:not([style*="display: none"])',
      '.p-menu:not([style*="display: none"])',
      '.p-tooltip:not([style*="display: none"])'
    ];

    for (const selector of overlaySelectors) {
      const overlay = document.querySelector(selector);
      if (overlay) {
        // Check if overlay is actually visible (not just in DOM)
        const style = window.getComputedStyle(overlay);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Close a modal
   */
  closeModal(modalId: string): void {
    this.modalService.close(modalId);
    this.updateModals();
  }
}


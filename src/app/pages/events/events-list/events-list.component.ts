import { Component, OnInit, HostListener, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { EventApiService, EventDetails } from 'src/app/core/services/event-api.service';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';
import { UserPreferencesService } from 'src/app/core/services/user-preferences.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Bootstrap 5 Modal type declaration
declare const bootstrap: {
  Modal: {
    getOrCreateInstance: (element: HTMLElement | string, options?: { backdrop?: boolean | string; keyboard?: boolean; focus?: boolean }) => {
      show: () => void;
      hide: () => void;
      dispose: () => void;
    };
    getInstance: (element: HTMLElement | string) => {
      show: () => void;
      hide: () => void;
      dispose: () => void;
    } | null;
  };
};

interface EventData {
  id: string;
  eventType: string;
  scale: string;
  name: string;
  duration: string;
  timing: string;
  state: string;
  city: string;
  spiritualOrator: string;
  language: string;
  branch: string;
  beneficiaries: {
    total: number;
    men: number;
    women: number;
    children: number;
  };
  initiation: {
    total: number;
    men: number;
    women: number;
    children: number;
  };
  specialGuests: number;
  volunteers: number;
  // Additional properties for modals
  theme?: string;
  specialGuestsList?: Array<{
    name: string;
    phone: string;
    gender: string;
    designation: string;
    organization: string;
    email: string;
    city: string;
    state: string;
    personalNo: string;
    contactPerson: string;
    contactPhone: string;
    referencePerson: string;
    referencePhone: string;
  }>;
  volunteersList?: Array<{
    branch?: string;
    name: string;
    gender?: string;
    contact?: string;
    days: number;
    seva: string;
  }>;
  donations?: Array<{
    type: string;
    details: string;
    amount: number;
  }>;
  media?: {
    coverageType: string;
    organization: string;
    email: string;
    website: string;
    person: string;
    designation: string;
    contact: string;
    personEmail: string;
    referencePerson: string;
    photos: string;
    video: string;
    pressRelease: string;
    testimonials: string;
  };
  promotionalMaterials?: Array<{
    name: string;
    quantity: number;
    size: string;
  }>;
  status?: string;
}

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss']
})
export class EventsListComponent implements OnInit, AfterViewChecked, OnDestroy {

  // PrimeNG Table Configuration
  events: EventData[] = [];
  allEventsData: EventData[] = []; // Store all events for pagination
  filteredEventsData: EventData[] = []; // Store filtered events

  // Pagination
  first = 0;
  rows = 10;
  rowsPerPageOptions = [5, 10, 20, 50];

  // Sorting
  sortField: string = '';
  sortOrder: number = 1;

  // Filtering - using custom filter system
  filters: { [key: string]: any } = {};

  // Column pinning
  pinnedColumns: string[] = [];

  // Column visibility
  hiddenColumns: string[] = [];

  // Additional filtering methods
  activeFilter: string | null = null;

  // Status filter
  statusFilter: 'all' | 'complete' | 'incomplete' = 'all';
  loadingEvents: boolean = false;

  // Drafts management
  draftsCount: number = 0;

  // Search functionality with debouncing
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Date range for export (always filters by created_on)
  exportStartDate: Date | null = null;
  exportEndDate: Date | null = null;
  exporting: boolean = false;
  exportingVolunteers: boolean = false;
  exportingSpecialGuests: boolean = false;
  exportingMedia: boolean = false;
  isExportModalOpen: boolean = false;

  // Dropdown management
  openDropdown: string | null = null;
  openActionMenu: string | null = null; // Track which action menu is open (by event id)
 actionMenuPosition: { [key: string]: 'up' | 'down' } = {}; // Track position for each menu

  // Modal management
  selectedEvent: EventData | null = null;
  selectedMediaType: string | null = null; // Track which media type was clicked
  isMoreDetailsModalOpen: boolean = false; // Track if More Details modal was open

  // Sample data with simple events structure

  constructor(
    private router: Router,
    private messageService: MessageService,
    private eventApiService: EventApiService,
    private confirmationDialog: ConfirmationDialogService,
    private userPreferencesService: UserPreferencesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.recomputePinLeft();
    this.loadEvents();
    this.initializeFilters();
    this.setupSearchDebounce();
    this.loadColumnPreferences();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup debounced search
   */
  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only emit if value changed
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFiltersAndSearch();
    });
  }

  /**
   * Called when search input changes
   */
  onSearchChange(searchValue: string): void {
    this.searchSubject.next(searchValue);
  }

  /**
   * Load events from API
   */
  loadEvents(): void {
    this.loadingEvents = true;
    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;

    this.eventApiService.getEvents(status).subscribe({
      next: (apiEvents) => {
        // Map API events to component EventData format
        this.allEventsData = apiEvents.map(event => this.mapApiEventToEventData(event));
        this.filteredEventsData = []; // Reset filtered data
        this.updatePaginatedEvents();

        // Count drafts (incomplete events)
        this.draftsCount = this.allEventsData.filter(e => e.status === 'incomplete').length;

        this.loadingEvents = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load events. Using sample data.',
          life: 3000
        });
        // Fallback to sample data - ensure all have status
        // this.allEventsData = this.allEvents.map(e => ({
        //   ...e,
        //   status: e.status || 'incomplete'
        // }));
        this.updatePaginatedEvents();
        this.draftsCount = this.allEventsData.filter(e => e.status === 'incomplete').length;
        this.loadingEvents = false;
      }
    });
  }
  columnOrder: string[] = [
  'eventType', 'name', 'duration', 'timing', 'state', 'city', 'branch',
  'spiritualOrator', 'language', 'beneficiaries', 'initiation', 'specialGuests', 'volunteers'
];

  // Column display names mapping
  columnDisplayNames: Record<string, string> = {
    'eventType': 'Type (S)',
    'name': 'Name',
    'duration': 'Duration',
    'timing': 'Timing',
    'state': 'State',
    'city': 'City',
    'branch': 'Branch',
    'spiritualOrator': 'Orator',
    'language': 'Language',
    'beneficiaries': 'Beneficiaries',
    'initiation': 'Initiation',
    'specialGuests': 'Special Guests',
    'volunteers': 'Volunteers'
  };

  // Column visibility manager
  isColumnVisibilityMenuOpen: boolean = false;

columnWidths: Record<string, number> = {
  eventType: 160,
  name: 180,
  duration: 160,
  timing: 140,
  state: 140,
  city: 140,
  branch: 160,
  spiritualOrator: 180,
  language: 140,
  beneficiaries: 140,
  initiation: 140,
  specialGuests: 160,
  volunteers: 140
};

pinLeft: Record<string, number> = {};

private recomputePinLeft(): void {
  let left = 0;
  const map: Record<string, number> = {};

  for (const field of this.columnOrder) {
    if (this.isColumnPinned(field)) {
      map[field] = left;
      left += this.columnWidths[field] ?? 140;
    }
  }

  this.pinLeft = map;
}

getPinnedStyle(field: string): Record<string, string> {
  if (!this.isColumnPinned(field)) return {};
  return { '--pin-left': `${this.pinLeft[field] ?? 0}px` };
}


  /**
   * Update status filter and reload events
   */
  onStatusFilterChange(): void {
    this.first = 0; // Reset to first page
    this.loadEvents();
  }

  /**
   * Continue editing a draft
   */
  continueDraft(eventId: string): void {
    this.router.navigate(['/events/edit', eventId]);
  }

  /**
   * Map API EventDetails to component EventData format
   */
  mapApiEventToEventData(event: EventDetails): EventData {
    const startDate = event.start_date ? new Date(event.start_date).toLocaleDateString() : '';
    const endDate = event.end_date ? new Date(event.end_date).toLocaleDateString() : '';
    const duration = startDate && endDate ? `${startDate} - ${endDate}` : '';

    return {
      id: String(event.id),
      eventType: event.event_type?.name || '',
      scale: event.scale || '',
      name: event.event_category?.name || '',
      duration: duration,
      timing: event.daily_start_time && event.daily_end_time
        ? `${event.daily_start_time} - ${event.daily_end_time}`
        : '',
      state: event.state || '',
      city: event.city || '',
      spiritualOrator: event.spiritual_orator || '',
      language: event.language || '',
      branch: typeof event.branch === 'string' ? event.branch : (event.branch?.name || ''),
      beneficiaries: {
        total: (event.beneficiary_men || 0) + (event.beneficiary_women || 0) + (event.beneficiary_child || 0),
        men: event.beneficiary_men || 0,
        women: event.beneficiary_women || 0,
        children: event.beneficiary_child || 0
      },
      initiation: {
        total: (event.initiation_men || 0) + (event.initiation_women || 0) + (event.initiation_child || 0),
        men: event.initiation_men || 0,
        women: event.initiation_women || 0,
        children: event.initiation_child || 0
      },
      specialGuests: event.special_guests_count || 0,
      volunteers: event.volunteers_count || 0,
      theme: event.theme || '',
      status: event.status || 'incomplete'
    };
  }

  goToAddEvent() {
    this.router.navigate(['/events/add']);
  }

  // Initialize filters
  initializeFilters(): void {
    this.filters = {
      eventType: '',
      name: '',
      duration: '',
      timing: '',
      state: '',
      city: '',
      branch: '',
      spiritualOrator: '',
      language: '',
      beneficiaries: '',
      initiation: '',
      specialGuests: '',
      volunteers: ''
    };
  }

  // Sorting methods
  onSort(event: any): void {
    this.sortField = event.field;
    this.sortOrder = event.order;
  }

  // Filtering methods
  showFilter(column: string): void {
    this.activeFilter = this.activeFilter === column ? null : column;
    this.openDropdown = null; // Close dropdown when opening filter
  }

  clearFilter(column: string): void {
    if (this.filters[column]) {
      this.filters[column] = '';
      this.applyFiltersAndSearch();
    }
  }

  applyFilter(): void {
    // This method is called when filter input changes
    this.applyFiltersAndSearch();
  }

  /**
   * Apply all filters and search
   */
  applyFiltersAndSearch(): void {
    let filtered = [...this.allEventsData];

    // Apply search term (searches in branch, city, state, and name)
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(event => {
        const branchMatch = event.branch?.toLowerCase().includes(searchLower) || false;
        const cityMatch = event.city?.toLowerCase().includes(searchLower) || false;
        const stateMatch = event.state?.toLowerCase().includes(searchLower) || false;
        const nameMatch = event.name?.toLowerCase().includes(searchLower) || false;
        return branchMatch || cityMatch || stateMatch || nameMatch;
      });
    }

    // Apply column filters
    Object.keys(this.filters).forEach(key => {
      const filterValue = this.filters[key];
      if (filterValue && filterValue.toString().trim()) {
        const filterLower = filterValue.toString().toLowerCase().trim();
        filtered = filtered.filter(event => {
          const fieldValue = this.getFieldValue(event, key);
          if (fieldValue === null || fieldValue === undefined) {
            return false;
          }
          return fieldValue.toString().toLowerCase().includes(filterLower);
        });
      }
    });

    this.filteredEventsData = filtered;
    this.first = 0; // Reset to first page when filtering
    this.updatePaginatedEvents();
  }

  /**
   * Get field value from event object
   */
  private getFieldValue(event: EventData, field: string): any {
    switch (field) {
      case 'eventType':
        return `${event.eventType} (${event.scale})`;
      case 'beneficiaries':
        return event.beneficiaries?.total?.toString() || '';
      case 'initiation':
        return event.initiation?.total?.toString() || '';
      case 'specialGuests':
        return event.specialGuests?.toString() || '';
      case 'volunteers':
        return event.volunteers?.toString() || '';
      default:
        return (event as any)[field] || '';
    }
  }

  // Dropdown methods
  toggleDropdown(column: string): void {
    this.openDropdown = this.openDropdown === column ? null : column;
  }

  closeDropdown(): void {
    this.openDropdown = null;
  }

  isDropdownOpen(column: string): boolean {
    return this.openDropdown === column;
  }


  closeActionMenu(): void {
    this.openActionMenu = null;
  }

  isActionMenuOpen(eventId: string): boolean {
    return this.openActionMenu === eventId;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event | null): void {
    // Check if event exists and has target
    if (!event || !event.target) {
      return;
    }

    const target = event.target as HTMLElement;

    // Close dropdowns if clicking outside
    if (!target.closest('.dropdown-container') && !target.closest('.action-menu-container') && !target.closest('.column-visibility-manager')) {
      this.closeDropdown();
      this.closeActionMenu();
      this.closeColumnVisibilityMenu();
    }

    // Close filters if clicking outside
    if (!target.closest('.filter-overlay')) {
      this.activeFilter = null;
    }

    // Close modals if clicking outside
    if (!target.closest('.modal') && !target.closest('.modal-backdrop')) {
      this.closeAllModals();
    }
  }

  // Column pinning methods
  toggleColumnPin(column: string): void {
    const index = this.pinnedColumns.indexOf(column);
    if (index > -1) {
      this.pinnedColumns.splice(index, 1);
    } else {
      this.pinnedColumns.push(column);
    }

    // Create a new array reference to trigger change detection
    this.pinnedColumns = [...this.pinnedColumns];
    this.recomputePinLeft();
    this.closeDropdown();
    this.activeFilter = null;
    
    // Save preferences to backend
    this.saveColumnPreferences();
    
    // Force change detection to update the view
    this.cdr.detectChanges();
  }

  isColumnPinned(column: string): boolean {
    return this.pinnedColumns.includes(column);
  }

  // Column visibility methods
  toggleColumnVisibility(column: string): void {
    const index = this.hiddenColumns.indexOf(column);
    if (index > -1) {
      this.hiddenColumns.splice(index, 1);
    } else {
      this.hiddenColumns.push(column);
    }

    // Create a new array reference to trigger change detection
    this.hiddenColumns = [...this.hiddenColumns];
    this.closeDropdown();
    this.activeFilter = null;
    
    // Save preferences to backend
    this.saveColumnPreferences();
    
    // Force change detection to update the view
    this.cdr.detectChanges();
  }

  isColumnHidden(column: string): boolean {
    return this.hiddenColumns.includes(column);
  }

  // Column visibility manager methods
  toggleColumnVisibilityMenu(): void {
    this.isColumnVisibilityMenuOpen = !this.isColumnVisibilityMenuOpen;
    this.closeDropdown(); // Close any other open dropdowns
  }

  closeColumnVisibilityMenu(): void {
    this.isColumnVisibilityMenuOpen = false;
  }

  getColumnDisplayName(column: string): string {
    return this.columnDisplayNames[column] || column;
  }

  getAllColumns(): string[] {
    return this.columnOrder;
  }

  showAllColumns(): void {
    this.hiddenColumns = [];
    this.hiddenColumns = [...this.hiddenColumns];
    this.closeColumnVisibilityMenu();
    this.saveColumnPreferences();
    this.cdr.detectChanges();
  }

  // Load column preferences from backend
  private loadColumnPreferences(): void {
    this.userPreferencesService.getEventsListColumnPreferences().subscribe({
      next: (preferences) => {
        if (preferences) {
          if (preferences.hidden_columns && preferences.hidden_columns.length > 0) {
            this.hiddenColumns = [...preferences.hidden_columns];
          }
          if (preferences.pinned_columns && preferences.pinned_columns.length > 0) {
            this.pinnedColumns = [...preferences.pinned_columns];
            this.recomputePinLeft();
          }
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading column preferences:', error);
        // Silently fail - use defaults
      }
    });
  }

  // Save column preferences to backend
  private saveColumnPreferences(): void {
    const preferences = {
      hidden_columns: this.hiddenColumns,
      pinned_columns: this.pinnedColumns
    };

    this.userPreferencesService.saveEventsListColumnPreferences(preferences).subscribe({
      next: () => {
        // Preferences saved successfully
      },
      error: (error) => {
        console.error('Error saving column preferences:', error);
        // Silently fail - preferences will be lost on refresh but won't break the UI
      }
    });
  }

  // Update paginated events - with PrimeNG pagination, we pass full dataset
  updatePaginatedEvents(): void {
    // Use filteredEventsData if filters are applied, otherwise use allEventsData
    // PrimeNG will handle pagination automatically
    const sourceData = this.hasActiveFilters()
      ? this.filteredEventsData
      : this.allEventsData;
    this.events = sourceData;
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return !!this.searchTerm || Object.values(this.filters).some(v => v && v.toString().trim());
  }

  // Pagination methods
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows || this.rows; // Keep current rows if not provided
    // No need to call updatePaginatedEvents() as PrimeNG handles pagination automatically
  }

  // Get total records for pagination component
  getTotalRecords(): number {
    const sourceData = this.hasActiveFilters()
      ? this.filteredEventsData
      : this.allEventsData;
    return sourceData.length;
  }

  // Utility methods for the template
  getEventTypeDisplay(event: EventData): string {
  const short = this.extractParenPart(event.scale); // "(M)"
  return `${event.eventType}${short}`;
}

private extractParenPart(scale: string): string {
  // If scale is "Medium (M)" -> returns "(M)"
  const match = scale?.match(/\([^)]*\)/);
  return match ? match[0] : ''; // fallback: show nothing if no "(...)"
}


  getSeverity(scale: string): string {
    switch (scale) {
      case 'S': return 'success';
      case 'M': return 'warning';
      case 'L': return 'danger';
      default: return 'info';
    }
  }

  // Navigation
  addEvent(): void {
    this.router.navigate(['/events/add']);
  }

  // Modal methods
  openSpecialGuestsModal(event: EventData): void {
    this.selectedEvent = event;

    // Fetch full event data with special guests if not already loaded
    if (!event.specialGuestsList || event.specialGuestsList.length === 0) {
      this.eventApiService.getEventById(Number(event.id)).subscribe({
        next: (response) => {
          if (response.specialGuests && response.specialGuests.length > 0) {
            // Map backend format to frontend format
            this.selectedEvent!.specialGuestsList = response.specialGuests.map((sg: any) => ({
              name: `${sg.first_name || ''} ${sg.middle_name || ''} ${sg.last_name || ''}`.trim() || 'N/A',
              phone: sg.personal_number || sg.contact || 'N/A',
              gender: sg.gender || 'N/A',
              designation: sg.designation || 'N/A',
              organization: sg.organization || 'N/A',
              email: sg.email || 'N/A',
              city: sg.city || 'N/A',
              state: sg.state || 'N/A',
              personalNo: sg.personal_number || 'N/A',
              contactPerson: sg.contact_person || 'N/A',
              contactPhone: sg.contact_person_number || 'N/A',
              referencePerson: sg.reference_person_name || 'N/A',
              referencePhone: 'N/A' // Not in backend model
            }));
          } else {
            this.selectedEvent!.specialGuestsList = [];
          }
          // Force change detection before opening drawer
          this.cdr.detectChanges();
          this.openSpecialGuestsDrawer();
        },
        error: (error) => {
          console.error('Error loading special guests:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load special guests data.',
            life: 3000
          });
          this.selectedEvent!.specialGuestsList = [];
          // Force change detection before opening drawer
          this.cdr.detectChanges();
          this.openSpecialGuestsDrawer();
        }
      });
    } else {
      this.openSpecialGuestsDrawer();
    }
  }

  // Drawer States
  isVolunteerDrawerOpen: boolean = false;
  isBeneficiariesDrawerOpen: boolean = false;
  isInitiationDrawerOpen: boolean = false;
  isSpecialGuestsDrawerOpen: boolean = false;

  openVolunteersModal(event: EventData): void {
    this.selectedEvent = event;

    // Fetch full event data with volunteers if not already loaded
    if (!event.volunteersList || event.volunteersList.length === 0) {
      this.eventApiService.getEventById(Number(event.id)).subscribe({
        next: (response) => {
          if (response.volunteers && response.volunteers.length > 0) {
            // Map backend format to frontend format
            this.selectedEvent!.volunteersList = response.volunteers.map((vol: any) => ({
              branch: vol.branch?.name || 'Branch name',
              name: vol.volunteer_name || vol.name || 'N/A',
              gender: vol.gender || 'N/A', // Not in backend model, will show N/A
              contact: vol.contact || '000000000', // Not in backend model, will show default
              days: vol.number_of_days || vol.days || 0,
              seva: vol.seva_involved || vol.seva || vol.mention_seva || 'Seva involved'
            }));
            // Update volunteer count
            this.selectedEvent!.volunteers = this.selectedEvent!.volunteersList.length;
          } else {
            this.selectedEvent!.volunteersList = [];
            this.selectedEvent!.volunteers = 0;
          }
          // Force change detection before opening drawer
          this.cdr.detectChanges();
          this.openVolunteerDrawer();
        },
        error: (error) => {
          console.error('Error loading volunteers:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load volunteers data.',
            life: 3000
          });
          this.selectedEvent!.volunteersList = [];
          this.selectedEvent!.volunteers = 0;
          // Force change detection before opening drawer
          this.cdr.detectChanges();
          this.openVolunteerDrawer();
        }
      });
    } else {
      // Update volunteer count from list if available
      if (this.selectedEvent.volunteersList && this.selectedEvent.volunteersList.length > 0) {
        this.selectedEvent.volunteers = this.selectedEvent.volunteersList.length;
      }
      this.openVolunteerDrawer();
    }
  }

  // Get volunteer count for display
  getVolunteerCount(): number {
    if (this.selectedEvent?.volunteersList && this.selectedEvent.volunteersList.length > 0) {
      return this.selectedEvent.volunteersList.length;
    }
    return this.selectedEvent?.volunteers || 0;
  }

  // Open Volunteer Drawer
  openVolunteerDrawer(): void {
    // Close any other open drawers first (but not this one)
    if (this.isSpecialGuestsDrawerOpen) this.closeSpecialGuestsDrawer();
    if (this.isBeneficiariesDrawerOpen) this.closeBeneficiariesDrawer();
    if (this.isInitiationDrawerOpen) this.closeInitiationDrawer();

    this.isVolunteerDrawerOpen = true;
    this.lockBodyScroll();

    // Force change detection to render the drawer
    this.cdr.detectChanges();

    // Wait for Angular to render the drawer, then manipulate DOM
    setTimeout(() => {
      const drawers = document.querySelectorAll('.volunteer-drawer');
      const drawer = Array.from(drawers).find(d => d.querySelector('#volunteerDrawerTitle')) as HTMLElement;
      const backdrop = document.querySelector('.volunteer-drawer-backdrop') as HTMLElement;

      if (drawer && backdrop) {
        // Move to body if not already there
        if (drawer.parentElement && drawer.parentElement !== document.body) {
          document.body.appendChild(drawer);
        }
        if (backdrop.parentElement && backdrop.parentElement !== document.body) {
          document.body.appendChild(backdrop);
        }
        // Ensure show class is applied (HTML binding should handle this, but ensure it)
        drawer.classList.add('show');
        // Set accessibility attributes
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-labelledby', 'volunteerDrawerTitle');
        drawer.removeAttribute('aria-hidden');
        backdrop.classList.add('show');
      }
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Ensure drawer and backdrop are at body level when visible
    if (this.isVolunteerDrawerOpen) {
      const drawer = document.querySelector('.volunteer-drawer');
      const backdrop = document.querySelector('.volunteer-drawer-backdrop');

      if (drawer && drawer.parentElement && drawer.parentElement !== document.body) {
        document.body.appendChild(drawer);
      }
      if (backdrop && backdrop.parentElement && backdrop.parentElement !== document.body) {
        document.body.appendChild(backdrop);
      }
    }
  }

  // Close Volunteer Drawer
  closeVolunteerDrawer(): void {
    // Remove show class first to trigger slide-out animation
    const drawers = document.querySelectorAll('.volunteer-drawer');
    const backdrops = document.querySelectorAll('.volunteer-drawer-backdrop');
    const drawer = Array.from(drawers).find(d => d.querySelector('#volunteerDrawerTitle'));
    const backdrop = backdrops[0];

    if (drawer) {
      drawer.classList.remove('show');
    }
    if (backdrop) {
      backdrop.classList.remove('show');
    }

    // Wait for animation to complete before hiding
    setTimeout(() => {
      this.isVolunteerDrawerOpen = false;
      if (!this.isBeneficiariesDrawerOpen && !this.isInitiationDrawerOpen && !this.isSpecialGuestsDrawerOpen) {
        this.unlockBodyScroll();
      }

      // Remove accessibility attributes when closing
      if (drawer) {
        drawer.setAttribute('aria-hidden', 'true');
        // Remove focus from drawer when closing
        const focusedElement = drawer.querySelector(':focus');
        if (focusedElement) {
          (focusedElement as HTMLElement).blur();
        }
      }
    }, 300);
  }

  // Lock body scroll when drawer is open
  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  // Unlock body scroll when drawer is closed
  private unlockBodyScroll(): void {
    document.body.style.overflow = '';
  }

  openBeneficiariesModal(event: EventData): void {
    this.selectedEvent = event;
    this.openBeneficiariesDrawer();
  }

  openInitiationModal(event: EventData): void {
    this.selectedEvent = event;
    this.openInitiationDrawer();
  }

  // Open Beneficiaries Drawer
  openBeneficiariesDrawer(): void {
    // Close any other open drawers first
    this.closeAllDrawers();

    this.isBeneficiariesDrawerOpen = true;
    this.lockBodyScroll();
    this.cdr.detectChanges();

    setTimeout(() => {
      const drawers = document.querySelectorAll('.volunteer-drawer');
      const backdrops = document.querySelectorAll('.volunteer-drawer-backdrop');
      const drawer = Array.from(drawers).find(d => d.querySelector('#beneficiariesDrawerTitle'));
      const backdrop = backdrops[0];

      if (drawer && drawer.parentElement && drawer.parentElement !== document.body) {
        document.body.appendChild(drawer);
      }
      if (backdrop && backdrop.parentElement && backdrop.parentElement !== document.body) {
        document.body.appendChild(backdrop);
      }

      if (drawer) {
        drawer.classList.add('show');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-labelledby', 'beneficiariesDrawerTitle');
      }
      if (backdrop) {
        backdrop.classList.add('show');
      }
    }, 10);
  }

  // Close Beneficiaries Drawer
  closeBeneficiariesDrawer(): void {
    const drawers = document.querySelectorAll('.volunteer-drawer');
    const backdrops = document.querySelectorAll('.volunteer-drawer-backdrop');
    const drawer = Array.from(drawers).find(d => d.querySelector('#beneficiariesDrawerTitle'));
    const backdrop = backdrops[0];

    if (drawer) drawer.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');

    setTimeout(() => {
      this.isBeneficiariesDrawerOpen = false;
      if (!this.isVolunteerDrawerOpen && !this.isInitiationDrawerOpen && !this.isSpecialGuestsDrawerOpen) {
        this.unlockBodyScroll();
      }

      if (drawer) {
        drawer.setAttribute('aria-hidden', 'true');
        const focusedElement = drawer.querySelector(':focus');
        if (focusedElement) {
          (focusedElement as HTMLElement).blur();
        }
      }
    }, 300);
  }

  // Open Initiation Drawer
  openInitiationDrawer(): void {
    // Close any other open drawers first
    this.closeAllDrawers();

    this.isInitiationDrawerOpen = true;
    this.lockBodyScroll();
    this.cdr.detectChanges();

    setTimeout(() => {
      const drawers = document.querySelectorAll('.volunteer-drawer');
      const backdrops = document.querySelectorAll('.volunteer-drawer-backdrop');
      const drawer = Array.from(drawers).find(d => d.querySelector('#initiationDrawerTitle'));
      const backdrop = backdrops[0];

      if (drawer && drawer.parentElement && drawer.parentElement !== document.body) {
        document.body.appendChild(drawer);
      }
      if (backdrop && backdrop.parentElement && backdrop.parentElement !== document.body) {
        document.body.appendChild(backdrop);
      }

      if (drawer) {
        drawer.classList.add('show');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-labelledby', 'initiationDrawerTitle');
      }
      if (backdrop) {
        backdrop.classList.add('show');
      }
    }, 10);
  }

  // Close Initiation Drawer
  closeInitiationDrawer(): void {
    const drawers = document.querySelectorAll('.volunteer-drawer');
    const backdrops = document.querySelectorAll('.volunteer-drawer-backdrop');
    const drawer = Array.from(drawers).find(d => d.querySelector('#initiationDrawerTitle'));
    const backdrop = backdrops[0];

    if (drawer) drawer.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');

    setTimeout(() => {
      this.isInitiationDrawerOpen = false;
      if (!this.isVolunteerDrawerOpen && !this.isBeneficiariesDrawerOpen && !this.isSpecialGuestsDrawerOpen) {
        this.unlockBodyScroll();
      }

      if (drawer) {
        drawer.setAttribute('aria-hidden', 'true');
        const focusedElement = drawer.querySelector(':focus');
        if (focusedElement) {
          (focusedElement as HTMLElement).blur();
        }
      }
    }, 300);
  }

  // Open Special Guests Drawer
  openSpecialGuestsDrawer(): void {
    // Close any other open drawers first (but not this one)
    if (this.isVolunteerDrawerOpen) this.closeVolunteerDrawer();
    if (this.isBeneficiariesDrawerOpen) this.closeBeneficiariesDrawer();
    if (this.isInitiationDrawerOpen) this.closeInitiationDrawer();

    this.isSpecialGuestsDrawerOpen = true;
    this.lockBodyScroll();
    
    // Force change detection to render the drawer
    this.cdr.detectChanges();

    // Wait for Angular to render the drawer, then manipulate DOM
    setTimeout(() => {
      const drawers = document.querySelectorAll('.volunteer-drawer');
      const drawer = Array.from(drawers).find(d => d.querySelector('#specialGuestsDrawerTitle')) as HTMLElement;
      const backdrop = document.querySelector('.volunteer-drawer-backdrop') as HTMLElement;

      if (drawer && backdrop) {
        // Move to body if not already there
        if (drawer.parentElement && drawer.parentElement !== document.body) {
          document.body.appendChild(drawer);
        }
        if (backdrop.parentElement && backdrop.parentElement !== document.body) {
          document.body.appendChild(backdrop);
        }

        // Ensure show class is applied (HTML binding should handle this, but ensure it)
        drawer.classList.add('show');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-labelledby', 'specialGuestsDrawerTitle');
        drawer.removeAttribute('aria-hidden');
        backdrop.classList.add('show');
      }
    }, 100);
  }

  // Close Special Guests Drawer
  closeSpecialGuestsDrawer(): void {
    const drawers = document.querySelectorAll('.volunteer-drawer');
    const backdrops = document.querySelectorAll('.volunteer-drawer-backdrop');
    const drawer = Array.from(drawers).find(d => d.querySelector('#specialGuestsDrawerTitle'));
    const backdrop = backdrops[0];

    if (drawer) drawer.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');

    setTimeout(() => {
      this.isSpecialGuestsDrawerOpen = false;
      if (!this.isVolunteerDrawerOpen && !this.isBeneficiariesDrawerOpen && !this.isInitiationDrawerOpen) {
        this.unlockBodyScroll();
      }

      if (drawer) {
        drawer.setAttribute('aria-hidden', 'true');
        const focusedElement = drawer.querySelector(':focus');
        if (focusedElement) {
          (focusedElement as HTMLElement).blur();
        }
      }
    }, 300);
  }

  // Close all drawers (helper method)
  private closeAllDrawers(): void {
    if (this.isVolunteerDrawerOpen) this.closeVolunteerDrawer();
    if (this.isBeneficiariesDrawerOpen) this.closeBeneficiariesDrawer();
    if (this.isInitiationDrawerOpen) this.closeInitiationDrawer();
    if (this.isSpecialGuestsDrawerOpen) this.closeSpecialGuestsDrawer();
  }

  /**
   * Helper method to open Bootstrap modal (right-side slide-in)
   */
  private openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      // CRITICAL: Move modal to body level to avoid layout container issues
      // This ensures the modal is not affected by parent overflow/positioning
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }

      // Add backdrop first
      const existingBackdrop = document.querySelector('.modal-backdrop');
      if (existingBackdrop) {
        existingBackdrop.remove();
      }
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.style.zIndex = '11000'; // Match global backdrop z-index
      // Add click handler to backdrop
      backdrop.addEventListener('click', () => {
        this.closeModal(modalId);
      });
      document.body.appendChild(backdrop);

      // Then show modal
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.zIndex = '11010'; // Match global modal z-index
      // Set aria-hidden to false when modal is open and focused
      modal.removeAttribute('aria-hidden');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      // Trigger animation by forcing reflow
      setTimeout(() => {
        const modalDialog = modal.querySelector('.modal-dialog');
        if (modalDialog) {
          modalDialog.classList.add('show');
        }
      }, 10);
    }
  }

  openMoreDetailsModal(event: EventData): void {
    // Navigate to view page instead of opening modal
    this.router.navigate(['/events/view', event.id]);
  }

   openGallery(event: EventData): void {
     // Navigate to gallery with event ID
     this.router.navigate(['/events/gallery'], { queryParams: { eventId: event.id } });
  }

  // Open media content modal
  openMediaContentModal(mediaType: string): void {
    this.selectedMediaType = mediaType;
    // Close the More Details modal first
    this.closeModal('moreDetailsModal');
    // Open the media content modal
    const modal = document.getElementById('mediaContentModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      modal.setAttribute('aria-hidden', 'false');
      // Add backdrop
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // Close modal methods
  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Remove show class from modal-dialog first to trigger slide-out animation
      const modalDialog = modal.querySelector('.modal-dialog');
      if (modalDialog) {
        modalDialog.classList.remove('show');
      }

      // Wait for animation to complete before hiding modal
      setTimeout(() => {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.position = '';
        modal.style.top = '';
        modal.style.left = '';
        modal.style.width = '';
        modal.style.height = '';
        modal.style.zIndex = '';
        // Set aria-hidden to true when modal is closed
        modal.setAttribute('aria-hidden', 'true');
        // Remove focus from modal when closing
        const focusedElement = modal.querySelector(':focus');
        if (focusedElement) {
          (focusedElement as HTMLElement).blur();
        }
        document.body.classList.remove('modal-open');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      }, 300); // Match transition duration
    }
  }

  // Handle backdrop click
  onBackdropClick(event: MouseEvent, modalId: string): void {
    // Only close if clicking directly on the backdrop (modal element, not modal-content)
    const target = event.target as HTMLElement;
    if (target && target.classList.contains('modal')) {
      this.closeModal(modalId);
    }
  }

  // Close media content modal and restore More Details modal if needed
  closeMediaContentModal(): void {
    this.closeModal('mediaContentModal');
    this.selectedMediaType = null;

    // If More Details modal was open, restore it
    if (this.isMoreDetailsModalOpen && this.selectedEvent) {
      setTimeout(() => {
        this.openMoreDetailsModal(this.selectedEvent!);
      }, 100); // Small delay to ensure smooth transition
    }
  }

  // Close all modals
  closeAllModals(): void {
    this.closeBeneficiariesDrawer();
    this.closeInitiationDrawer();
    this.closeSpecialGuestsDrawer();
    this.closeVolunteerDrawer(); // Close drawer instead of modal
    this.closeModal('moreDetailsModal');
    this.closeModal('mediaContentModal');
    this.selectedMediaType = null;
    this.isMoreDetailsModalOpen = false;
  }

  editEvent(eventId: string): void {
    console.log('Edit event:', eventId);
    // Implement edit functionality
  }

  viewEventDetails(eventId: string): void {
    console.log('View event details:', eventId);
    // Implement view details functionality
  }

  downloadEvent(eventId: string): void {
    if (!eventId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Event ID is required for download',
        life: 3000
      });
      return;
    }

    // Call backend API to download event data as PDF
    this.eventApiService.downloadEvent(Number(eventId)).subscribe({
      next: (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event_${eventId}_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Event PDF downloaded successfully',
          life: 3000
        });
      },
      error: (error) => {
        console.error('Error downloading event:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.error || 'Failed to download event PDF',
          life: 5000
        });
      }
    });
  }

  /**
   * Open export modal using Bootstrap 5 Modal API
   */
  openExportModal(): void {
    this.isExportModalOpen = true;
    const modalElement = document.getElementById('exportExcelModal');
    if (!modalElement) {
      return;
    }

    // Use Bootstrap 5 Modal API
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement, { backdrop: true });
    
    // Add one-time event listener for when modal is shown
    const handleShown = () => {
      // Find the latest visible backdrop and add class
      const backdrops = document.querySelectorAll('.modal-backdrop.show');
      if (backdrops.length > 0) {
        const latestBackdrop = backdrops[backdrops.length - 1] as HTMLElement;
        latestBackdrop.classList.add('export-modal-backdrop');
      }
      // Force change detection for calendar components
      this.cdr.detectChanges();
    };
    
    modalElement.addEventListener('shown.bs.modal', handleShown, { once: true });
    modal.show();
    
    // Force change detection to ensure calendar components are initialized
    this.cdr.detectChanges();
  }

  /**
   * Close export modal using Bootstrap 5 Modal API
   */
  closeExportModal(): void {
    const modalElement = document.getElementById('exportExcelModal');
    if (!modalElement) {
      return;
    }

    // Use Bootstrap 5 Modal API to hide
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }

    this.isExportModalOpen = false;
    
    // Clean up: remove export-modal-backdrop class from any remaining backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop.export-modal-backdrop');
    backdrops.forEach(backdrop => {
      backdrop.classList.remove('export-modal-backdrop');
    });
    
    // Reset dates
    this.exportStartDate = null;
    this.exportEndDate = null;
  }

  /**
   * Set quick date range
   */
  setQuickDateRange(range: string): void {
    if (range === 'all') {
      this.exportStartDate = null;
      this.exportEndDate = null;
      this.cdr.detectChanges();
      return;
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999); // End of today
    this.exportEndDate = endDate;

    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0); // Start of day

    switch (range) {
      case 'lastWeek':
        // Subtract 7 days from today
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'lastMonth':
        // Go back 1 month from today
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'last3Months':
        // Go back 3 months from today
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'last6Months':
        // Go back 6 months from today
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'lastYear':
        // Go back 1 year from today
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'last2Years':
        // Go back 2 years from today
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      default:
        return;
    }

    this.exportStartDate = startDate;
    // Force change detection to update UI
    this.cdr.detectChanges();
  }

  /**
   * Check if export date range is valid
   */
  isExportDateRangeValid(): boolean {
    if (!this.exportStartDate && !this.exportEndDate) {
      return true; // "All Events" is valid
    }
    if (this.exportStartDate && this.exportEndDate) {
      return this.exportStartDate <= this.exportEndDate;
    }
    return true; // Partial ranges (only start or only end) are valid
  }

  /**
   * Convert Date object to YYYY-MM-DD string for native date input
   */
  getDateInputValue(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handle start date change from native date input
   */
  onStartDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (value) {
      this.exportStartDate = new Date(value + 'T00:00:00');
    } else {
      this.exportStartDate = null;
    }
    this.cdr.detectChanges();
  }

  /**
   * Handle end date change from native date input
   */
  onEndDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (value) {
      this.exportEndDate = new Date(value + 'T23:59:59');
    } else {
      this.exportEndDate = null;
    }
    this.cdr.detectChanges();
  }

  /**
   * Export events to Excel with date range filter
   */
  exportEventsToExcel(): void {
    // Validate date range
    if (!this.isExportDateRangeValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Start date must be before or equal to end date',
        life: 3000
      });
      return;
    }

    // Format dates as YYYY-MM-DD BEFORE closing modal (which resets dates)
    const formatDate = (date: Date | null): string | undefined => {
      if (!date) return undefined;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDate = formatDate(this.exportStartDate);
    const endDate = formatDate(this.exportEndDate);
    
    // Warn if no dates are selected (will export all events)
    if (!startDate && !endDate) {
      const confirmExport = confirm('No date range selected. This will export ALL events. Continue?');
      if (!confirmExport) {
        return;
      }
    }
    
    // Now close modal and set exporting flag
    this.exporting = true;
    this.closeExportModal();
    const status = this.statusFilter !== 'all' ? this.statusFilter : undefined;

    this.eventApiService.exportEventsToExcel(startDate, endDate, status).subscribe({
      next: (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename
        let filename = 'events_export';
        if (startDate && endDate) {
          filename = `events_${startDate}_to_${endDate}`;
        } else if (startDate) {
          filename = `events_from_${startDate}`;
        } else if (endDate) {
          filename = `events_until_${endDate}`;
        }
        filename += '.xlsx';
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Events exported to Excel successfully',
          life: 3000
        });
        this.exporting = false;
        // Dates are already reset in closeExportModal(), no need to reset again
      },
      error: (error) => {
        console.error('Error exporting events:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.error || 'Failed to export events to Excel',
          life: 5000
        });
        this.exporting = false;
      }
    });
  }

  deleteEvent(eventId: string): void {
    if (!eventId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Event ID is required for deletion',
        life: 3000
      });
      return;
    }

    // Show confirmation dialog
    this.confirmationDialog.confirmDelete({
      title: 'Delete Event',
      text: 'Are you sure you want to delete this event? This action cannot be undone.',
      showSuccessMessage: false // We'll use PrimeNG message service instead
    }).then((result) => {
      if (result.value) {
      this.eventApiService.deleteEvent(Number(eventId)).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Event deleted successfully',
            life: 3000
          });
          // Reload events list
          this.loadEvents();
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.error?.error || 'Failed to delete event',
            life: 5000
          });
        }
      });
    }
    });
  }

  getTooltipText(type: 'beneficiaries' | 'initiation', event: EventData): string {
    const data = event[type];
    return `${data.men} Men, ${data.women} Women, ${data.children} Children`;
  }

  // Helper methods for media content modal
  getMediaModalTitle(): string {
    switch (this.selectedMediaType) {
      case 'photos': return 'Event Photos';
      case 'video': return 'Video Coverage';
      case 'pressRelease': return 'Press Release';
      case 'testimonials': return 'Testimonials';
      default: return 'Media Content';
    }
  }

  /**
   * Export volunteers to Excel
   */
  exportVolunteersToExcel(): void {
    if (!this.selectedEvent || !this.selectedEvent.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No event selected',
        life: 3000
      });
      return;
    }

    this.exportingVolunteers = true;

    this.eventApiService.exportVolunteersToExcel(Number(this.selectedEvent.id)).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `volunteers_event_${this.selectedEvent!.id}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Volunteers exported to Excel successfully',
          life: 3000
        });
        this.exportingVolunteers = false;
      },
      error: (error) => {
        console.error('Error exporting volunteers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.error || 'Failed to export volunteers to Excel',
          life: 5000
        });
        this.exportingVolunteers = false;
      }
    });
  }

  /**
   * Export special guests to Excel
   */
  exportSpecialGuestsToExcel(): void {
    if (!this.selectedEvent || !this.selectedEvent.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No event selected',
        life: 3000
      });
      return;
    }

    this.exportingSpecialGuests = true;

    this.eventApiService.exportSpecialGuestsToExcel(Number(this.selectedEvent.id)).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `special_guests_event_${this.selectedEvent!.id}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Special guests exported to Excel successfully',
          life: 3000
        });
        this.exportingSpecialGuests = false;
      },
      error: (error) => {
        console.error('Error exporting special guests:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.error || 'Failed to export special guests to Excel',
          life: 5000
        });
        this.exportingSpecialGuests = false;
      }
    });
  }

  /**
   * Export event media to Excel
   */
  exportEventMediaToExcel(): void {
    if (!this.selectedEvent || !this.selectedEvent.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No event selected',
        life: 3000
      });
      return;
    }

    this.exportingMedia = true;

    this.eventApiService.exportEventMediaToExcel(Number(this.selectedEvent.id)).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event_media_event_${this.selectedEvent!.id}_${new Date().getTime()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Event media exported to Excel successfully',
          life: 3000
        });
        this.exportingMedia = false;
      },
      error: (error) => {
        console.error('Error exporting event media:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.error || 'Failed to export event media to Excel',
          life: 5000
        });
        this.exportingMedia = false;
      }
    });
  }

  getMediaContentDescription(): string {
    switch (this.selectedMediaType) {
      case 'photos': return 'View and download event photographs and images captured during the event.';
      case 'video': return 'Watch video recordings and coverage of the event proceedings.';
      case 'pressRelease': return 'Read the official press release and media statements about this event.';
      case 'testimonials': return 'Read testimonials and feedback from participants and attendees.';
      default: return 'View the selected media content.';
    }
  }

   toggleActionMenu(eventId: string, event?: MouseEvent): void {
    const wasOpen = this.openActionMenu === eventId;
    this.openActionMenu = wasOpen ? null : eventId;
    this.openDropdown = null; // Close column dropdowns when opening action menu
    // Calculate position if opening menu
    if (!wasOpen && event) {
      setTimeout(() => {
        this.calculateActionMenuPosition(eventId, event);
      }, 0);
    }
  }

  /**
   * Calculate if action menu should open upward or downward
   */
  calculateActionMenuPosition(eventId: string, clickEvent: MouseEvent): void {
    debugger
     const rowIndex = this.allEventsData.findIndex(
    (x: any) => String(x.id) === String(eventId)   // adjust key if different
  );
   debugger
    if (rowIndex >= 4) {
        this.actionMenuPosition[eventId] = 'up';
      } else {
        this.actionMenuPosition[eventId] = 'down';
      }
   
  }

  /**
   * Get position class for action menu
   */
  getActionMenuPosition(eventId: string): 'up' | 'down' {
    return this.actionMenuPosition[eventId] || 'down';
  }
}

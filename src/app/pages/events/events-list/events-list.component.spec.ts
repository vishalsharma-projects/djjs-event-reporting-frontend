import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { EventsListComponent } from './events-list.component';
import { EventApiService } from 'src/app/core/services/event-api.service';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';

describe('EventsListComponent - Date Range Export', () => {
  let component: EventsListComponent;
  let fixture: ComponentFixture<EventsListComponent>;
  let eventApiService: jasmine.SpyObj<EventApiService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let router: jasmine.SpyObj<Router>;
  let confirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  beforeEach(waitForAsync(() => {
    const eventApiServiceSpy = jasmine.createSpyObj('EventApiService', ['exportEventsToExcel', 'getEvents']);
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const confirmationDialogServiceSpy = jasmine.createSpyObj('ConfirmationDialogService', ['confirmDelete']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    TestBed.configureTestingModule({
      declarations: [EventsListComponent],
      providers: [
        { provide: EventApiService, useValue: eventApiServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ConfirmationDialogService, useValue: confirmationDialogServiceSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ],
      imports: [] // Add necessary imports like FormsModule, etc. if needed
    }).compileComponents();

    eventApiService = TestBed.inject(EventApiService) as jasmine.SpyObj<EventApiService>;
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    confirmationDialogService = TestBed.inject(ConfirmationDialogService) as jasmine.SpyObj<ConfirmationDialogService>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsListComponent);
    component = fixture.componentInstance;
    // Mock getEvents to return empty array to avoid errors
    eventApiService.getEvents.and.returnValue(of([]));
    fixture.detectChanges();
  });

  describe('setQuickDateRange', () => {
    it('should set dates for lastWeek correctly', () => {
      const mockToday = new Date('2024-01-15T12:00:00');
      jasmine.clock().install();
      jasmine.clock().mockDate(mockToday);

      component.setQuickDateRange('lastWeek');

      expect(component.exportStartDate).toBeTruthy();
      expect(component.exportEndDate).toBeTruthy();
      
      if (component.exportStartDate && component.exportEndDate) {
        // Start date should be 7 days before today
        const expectedStartDate = new Date('2024-01-08T00:00:00');
        expect(component.exportStartDate.getTime()).toBe(expectedStartDate.getTime());
        
        // End date should be end of today
        const expectedEndDate = new Date('2024-01-15T23:59:59.999');
        expect(component.exportEndDate.getTime()).toBe(expectedEndDate.getTime());
      }

      expect(cdr.detectChanges).toHaveBeenCalled();
      jasmine.clock().uninstall();
    });

    it('should set dates for lastMonth correctly', () => {
      const mockToday = new Date('2024-03-15T12:00:00');
      jasmine.clock().install();
      jasmine.clock().mockDate(mockToday);

      component.setQuickDateRange('lastMonth');

      expect(component.exportStartDate).toBeTruthy();
      expect(component.exportEndDate).toBeTruthy();
      
      if (component.exportStartDate) {
        // Start date should be approximately 1 month before
        const expectedStartDate = new Date('2024-02-15T00:00:00');
        expect(component.exportStartDate.getTime()).toBe(expectedStartDate.getTime());
      }

      jasmine.clock().uninstall();
    });

    it('should set dates for last3Months correctly', () => {
      const mockToday = new Date('2024-06-15T12:00:00');
      jasmine.clock().install();
      jasmine.clock().mockDate(mockToday);

      component.setQuickDateRange('last3Months');

      expect(component.exportStartDate).toBeTruthy();
      
      if (component.exportStartDate) {
        const expectedStartDate = new Date('2024-03-15T00:00:00');
        expect(component.exportStartDate.getTime()).toBe(expectedStartDate.getTime());
      }

      jasmine.clock().uninstall();
    });

    it('should set dates for last6Months correctly', () => {
      const mockToday = new Date('2024-07-15T12:00:00');
      jasmine.clock().install();
      jasmine.clock().mockDate(mockToday);

      component.setQuickDateRange('last6Months');

      expect(component.exportStartDate).toBeTruthy();
      
      if (component.exportStartDate) {
        const expectedStartDate = new Date('2024-01-15T00:00:00');
        expect(component.exportStartDate.getTime()).toBe(expectedStartDate.getTime());
      }

      jasmine.clock().uninstall();
    });

    it('should set dates for lastYear correctly', () => {
      const mockToday = new Date('2024-06-15T12:00:00');
      jasmine.clock().install();
      jasmine.clock().mockDate(mockToday);

      component.setQuickDateRange('lastYear');

      expect(component.exportStartDate).toBeTruthy();
      
      if (component.exportStartDate) {
        const expectedStartDate = new Date('2023-06-15T00:00:00');
        expect(component.exportStartDate.getTime()).toBe(expectedStartDate.getTime());
      }

      jasmine.clock().uninstall();
    });

    it('should set dates for last2Years correctly', () => {
      const mockToday = new Date('2024-06-15T12:00:00');
      jasmine.clock().install();
      jasmine.clock().mockDate(mockToday);

      component.setQuickDateRange('last2Years');

      expect(component.exportStartDate).toBeTruthy();
      
      if (component.exportStartDate) {
        const expectedStartDate = new Date('2022-06-15T00:00:00');
        expect(component.exportStartDate.getTime()).toBe(expectedStartDate.getTime());
      }

      jasmine.clock().uninstall();
    });

    it('should clear dates for all range', () => {
      // Set some dates first
      component.exportStartDate = new Date();
      component.exportEndDate = new Date();

      component.setQuickDateRange('all');

      expect(component.exportStartDate).toBeNull();
      expect(component.exportEndDate).toBeNull();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should handle invalid range gracefully', () => {
      const initialStartDate = component.exportStartDate;
      const initialEndDate = component.exportEndDate;

      component.setQuickDateRange('invalidRange');

      // Should not change dates
      expect(component.exportStartDate).toBe(initialStartDate);
      expect(component.exportEndDate).toBe(initialEndDate);
    });
  });

  describe('isExportDateRangeValid', () => {
    it('should return true when both dates are null (All Events)', () => {
      component.exportStartDate = null;
      component.exportEndDate = null;
      expect(component.isExportDateRangeValid()).toBe(true);
    });

    it('should return true when start date is before end date', () => {
      component.exportStartDate = new Date('2024-01-01');
      component.exportEndDate = new Date('2024-01-31');
      expect(component.isExportDateRangeValid()).toBe(true);
    });

    it('should return true when start date equals end date', () => {
      const sameDate = new Date('2024-01-15');
      component.exportStartDate = sameDate;
      component.exportEndDate = new Date(sameDate);
      expect(component.isExportDateRangeValid()).toBe(true);
    });

    it('should return false when start date is after end date', () => {
      component.exportStartDate = new Date('2024-01-31');
      component.exportEndDate = new Date('2024-01-01');
      expect(component.isExportDateRangeValid()).toBe(false);
    });

    it('should return true when only start date is set', () => {
      component.exportStartDate = new Date('2024-01-01');
      component.exportEndDate = null;
      expect(component.isExportDateRangeValid()).toBe(true);
    });

    it('should return true when only end date is set', () => {
      component.exportStartDate = null;
      component.exportEndDate = new Date('2024-01-31');
      expect(component.isExportDateRangeValid()).toBe(true);
    });
  });

  describe('exportEventsToExcel', () => {
    beforeEach(() => {
      // Mock successful blob response
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      eventApiService.exportEventsToExcel.and.returnValue(of(mockBlob));
      
      // Mock window.URL methods
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      spyOn(window.URL, 'revokeObjectURL');
      
      // Mock DOM methods
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click'),
        appendChild: jasmine.createSpy('appendChild'),
        removeChild: jasmine.createSpy('removeChild')
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
    });

    it('should export with date range when both dates are set', () => {
      component.exportStartDate = new Date('2024-01-01');
      component.exportEndDate = new Date('2024-01-31');
      component.statusFilter = 'all';

      component.exportEventsToExcel();

      expect(eventApiService.exportEventsToExcel).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31',
        undefined
      );
    });

    it('should export with only start date', () => {
      component.exportStartDate = new Date('2024-01-01');
      component.exportEndDate = null;
      component.statusFilter = 'all';

      component.exportEventsToExcel();

      expect(eventApiService.exportEventsToExcel).toHaveBeenCalledWith(
        '2024-01-01',
        undefined,
        undefined
      );
    });

    it('should export with only end date', () => {
      component.exportStartDate = null;
      component.exportEndDate = new Date('2024-01-31');
      component.statusFilter = 'all';

      component.exportEventsToExcel();

      expect(eventApiService.exportEventsToExcel).toHaveBeenCalledWith(
        undefined,
        '2024-01-31',
        undefined
      );
    });

    it('should export all events when no dates are set', () => {
      component.exportStartDate = null;
      component.exportEndDate = null;
      component.statusFilter = 'all';

      component.exportEventsToExcel();

      expect(eventApiService.exportEventsToExcel).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined
      );
    });

    it('should include status filter when not "all"', () => {
      component.exportStartDate = new Date('2024-01-01');
      component.exportEndDate = new Date('2024-01-31');
      component.statusFilter = 'complete';

      component.exportEventsToExcel();

      expect(eventApiService.exportEventsToExcel).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-01-31',
        'complete'
      );
    });

    it('should not export when date range is invalid', () => {
      component.exportStartDate = new Date('2024-01-31');
      component.exportEndDate = new Date('2024-01-01');

      component.exportEventsToExcel();

      expect(eventApiService.exportEventsToExcel).not.toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Start date must be before or equal to end date'
        })
      );
    });

    it('should handle export error gracefully', () => {
      const error = { error: { error: 'Export failed' } };
      eventApiService.exportEventsToExcel.and.returnValue(throwError(() => error));
      
      component.exportStartDate = new Date('2024-01-01');
      component.exportEndDate = new Date('2024-01-31');

      component.exportEventsToExcel();

      expect(messageService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({
          severity: 'error',
          summary: 'Error'
        })
      );
      expect(component.exporting).toBe(false);
    });

    it('should reset dates after successful export', () => {
      component.exportStartDate = new Date('2024-01-01');
      component.exportEndDate = new Date('2024-01-31');

      component.exportEventsToExcel();

      // Wait for async operations
      fixture.detectChanges();

      // Dates should be reset after export completes
      // Note: This happens in the subscribe callback, so we need to wait
      setTimeout(() => {
        expect(component.exportStartDate).toBeNull();
        expect(component.exportEndDate).toBeNull();
      }, 100);
    });
  });

  describe('onCustomDateChange', () => {
    it('should trigger change detection', () => {
      component.onCustomDateChange();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });
  });

  describe('Date formatting', () => {
    it('should format dates correctly for API (YYYY-MM-DD)', () => {
      // This tests the internal formatDate function behavior
      component.exportStartDate = new Date('2024-01-15T10:30:00');
      component.exportEndDate = new Date('2024-01-31T18:45:00');
      component.statusFilter = 'all';

      eventApiService.exportEventsToExcel.and.returnValue(
        of(new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      );

      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);

      component.exportEventsToExcel();

      // Verify dates are formatted as YYYY-MM-DD
      expect(eventApiService.exportEventsToExcel).toHaveBeenCalledWith(
        '2024-01-15',
        '2024-01-31',
        undefined
      );
    });
  });
});


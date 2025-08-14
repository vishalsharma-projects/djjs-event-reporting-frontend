import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

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
}

interface BranchData {
  id: string;
  branchName: string;
  branchManagerName: string;
  assistantBranchManagerName: string;
  events: EventData[];
}

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss']
})
export class EventsListComponent implements OnInit {

  // PrimeNG Table Configuration
  expandedRows: { [key: string]: boolean } = {};
  
  // Pagination
  first = 0;
  rows = 10;
  rowsPerPageOptions = [5, 10, 20, 50];
  
  // Sorting
  sortField: string = '';
  sortOrder: number = 1;
  
  // Filtering
  filters: { [key: string]: any } = {};
  globalFilterValue: string = '';
  
  // Column pinning
  pinnedColumns: string[] = [];
  
  // Sample data with new branch structure
  branches: BranchData[] = [
    {
      id: '1',
      branchName: 'Bangalore Central Branch',
      branchManagerName: 'Rajesh Kumar',
      assistantBranchManagerName: 'Priya Sharma',
      events: [
        {
          id: '1',
          eventType: 'Katha',
          scale: 'S',
          name: 'Bhagwat Katha',
          duration: '5 May 2024 - 16 May 2024',
          timing: '5:30pm - 7:30pm',
          state: 'Karnataka',
          city: 'Bangalore',
          spiritualOrator: 'Dr. Anya Sharma',
          language: 'English',
          beneficiaries: { total: 50, men: 30, women: 15, children: 5 },
          initiation: { total: 50, men: 30, women: 15, children: 5 },
          specialGuests: 3,
          volunteers: 32
        },
        {
          id: '2',
          eventType: 'Katha',
          scale: 'M',
          name: 'Bhagwat Katha',
          duration: '5 May 2024 - 16 May 2024',
          timing: '5:30pm - 7:30pm',
          state: 'Karnataka',
          city: 'Bangalore',
          spiritualOrator: 'Mr. Rohan Verma',
          language: 'Hindi',
          beneficiaries: { total: 100, men: 60, women: 30, children: 10 },
          initiation: { total: 100, men: 60, women: 30, children: 10 },
          specialGuests: 3,
          volunteers: 32
        },
        {
          id: '3',
          eventType: 'Cultural',
          scale: 'M',
          name: 'Festivals: Mahashivratri',
          duration: '8 Mar 2024 - 8 Mar 2024',
          timing: '6:00pm - 9:00pm',
          state: 'Karnataka',
          city: 'Bangalore',
          spiritualOrator: '',
          language: 'Hindi',
          beneficiaries: { total: 150, men: 80, women: 60, children: 10 },
          initiation: { total: 150, men: 80, women: 60, children: 10 },
          specialGuests: 5,
          volunteers: 45
        },
        {
          id: '4',
          eventType: 'Peace Procession',
          scale: 'L',
          name: 'Peace Procession',
          duration: '15 Jan 2024 - 15 Jan 2024',
          timing: '4:00pm - 6:00pm',
          state: 'Karnataka',
          city: 'Bangalore',
          spiritualOrator: '',
          language: 'Hindi',
          beneficiaries: { total: 120, men: 70, women: 45, children: 5 },
          initiation: { total: 120, men: 70, women: 45, children: 5 },
          specialGuests: 8,
          volunteers: 60
        }
      ]
    },
    {
      id: '2',
      branchName: 'Mumbai Western Branch',
      branchManagerName: 'Amit Patel',
      assistantBranchManagerName: 'Neha Singh',
      events: [
        {
          id: '5',
          eventType: 'Katha',
          scale: 'S',
          name: 'Ram Katha',
          duration: '10 May 2024 - 20 May 2024',
          timing: '6:00pm - 8:00pm',
          state: 'Maharashtra',
          city: 'Mumbai',
          spiritualOrator: 'Swami Ji',
          language: 'Hindi',
          beneficiaries: { total: 80, men: 45, women: 30, children: 5 },
          initiation: { total: 80, men: 45, women: 30, children: 5 },
          specialGuests: 2,
          volunteers: 25
        },
        {
          id: '6',
          eventType: 'Cultural',
          scale: 'L',
          name: 'Ganesh Chaturthi',
          duration: '15 Sep 2024 - 25 Sep 2024',
          timing: '7:00am - 9:00pm',
          state: 'Maharashtra',
          city: 'Mumbai',
          spiritualOrator: 'Pandit Sharma',
          language: 'Marathi',
          beneficiaries: { total: 200, men: 100, women: 80, children: 20 },
          initiation: { total: 200, men: 100, women: 80, children: 20 },
          specialGuests: 10,
          volunteers: 75
        }
      ]
    },
    {
      id: '3',
      branchName: 'Delhi North Branch',
      branchManagerName: 'Suresh Verma',
      assistantBranchManagerName: 'Kavita Gupta',
      events: [
        {
          id: '7',
          eventType: 'Katha',
          scale: 'M',
          name: 'Mahabharat Katha',
          duration: '20 Jun 2024 - 30 Jun 2024',
          timing: '6:30pm - 8:30pm',
          state: 'Delhi',
          city: 'New Delhi',
          spiritualOrator: 'Dr. Rajesh Kumar',
          language: 'Hindi',
          beneficiaries: { total: 120, men: 70, women: 40, children: 10 },
          initiation: { total: 120, men: 70, women: 40, children: 10 },
          specialGuests: 6,
          volunteers: 50
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // Don't expand any branch by default
    this.expandedRows = {};
    console.log('Initial expandedRows:', this.expandedRows);
  }

  // PrimeNG Table Methods
  onRowExpand(event: any): void {
    console.log('Row expanded:', event.data);
    console.log('Event object:', event);
    // Update the expandedRows object to reflect the expanded state
    this.expandedRows = { ...this.expandedRows, [event.data.id]: true };
    console.log('Updated expandedRows after expand:', this.expandedRows);
  }

  onRowCollapse(event: any): void {
    console.log('Row collapsed:', event.data);
    console.log('Event object:', event);
    // Update the expandedRows object to reflect the collapsed state
    // this.expandedRows = { ...this.expandedRows, [event.data.id]: false };
    console.log('Updated expandedRows after collapse:', this.expandedRows);
  }

  // Method to check if a row is expanded
  isRowExpanded(branch: BranchData): boolean {
    const isExpanded = this.expandedRows[branch.id] === true;
    console.log(`Branch ${branch.id} expanded:`, isExpanded);
    return isExpanded;
  }

  // Sorting methods
  onSort(event: any): void {
    this.sortField = event.field;
    this.sortOrder = event.order;
  }

  // Filtering methods
  onGlobalFilterChange(event: any): void {
    this.globalFilterValue = event.target.value;
  }

  clearFilter(column: string): void {
    if (this.filters[column]) {
      delete this.filters[column];
    }
  }

  // Additional filtering methods
  activeFilter: string | null = null;

  showFilter(column: string): void {
    this.activeFilter = this.activeFilter === column ? null : column;
  }

  applyFilter(): void {
    // This method will be called when filter input changes
    // The filtering is handled automatically by PrimeNG
  }

  // Column pinning methods
  toggleColumnPin(column: string): void {
    const index = this.pinnedColumns.indexOf(column);
    if (index > -1) {
      this.pinnedColumns.splice(index, 1);
    } else {
      this.pinnedColumns.push(column);
    }
  }

  isColumnPinned(column: string): boolean {
    return this.pinnedColumns.includes(column);
  }

  // Pagination methods
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
  }

  // Expand/Collapse All methods
  expandAll(): void {
    this.branches.forEach(branch => {
      this.expandedRows[branch.id] = true;
    });
    this.expandedRows = { ...this.expandedRows };
  }

  collapseAll(): void {
    this.expandedRows = {};
  }

  // Utility methods for the template
  getEventTypeDisplay(event: EventData): string {
    return `${event.eventType}(${event.scale})`;
  }

  getSeverity(scale: string): string {
    switch (scale) {
      case 'S': return 'success';
      case 'M': return 'warning';
      case 'L': return 'danger';
      default: return 'info';
    }
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'info';
    }
  }

  // Navigation
  addEvent(): void {
    this.router.navigate(['/events/add']);
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
    console.log('Download event:', eventId);
    // Implement download functionality
  }

  getTooltipText(type: 'beneficiaries' | 'initiation', event: EventData): string {
    const data = event[type];
    return `${data.men} Men, ${data.women} Women, ${data.children} Children`;
  }
}

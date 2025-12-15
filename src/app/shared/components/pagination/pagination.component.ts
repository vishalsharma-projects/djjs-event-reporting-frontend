import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  @Input() first: number = 0;
  @Input() rows: number = 10;
  @Input() totalRecords: number = 0;
  @Output() pageChange = new EventEmitter<any>();

  // Get pagination info for display
  getPaginationInfo(): string {
    const start = this.first + 1;
    const end = Math.min(this.first + this.rows, this.totalRecords);
    const total = this.totalRecords;
    return `Showing ${start} to ${end} of ${total} results`;
  }

  // Get current page number
  getCurrentPage(): number {
    return Math.floor(this.first / this.rows) + 1;
  }

  // Get total pages
  getTotalPages(): number {
    return Math.ceil(this.totalRecords / this.rows);
  }

  // Go to previous page
  goToPreviousPage(): void {
    if (this.first > 0) {
      const newFirst = Math.max(0, this.first - this.rows);
      this.pageChange.emit({ first: newFirst, rows: this.rows });
    }
  }

  // Go to next page
  goToNextPage(): void {
    if (this.first + this.rows < this.totalRecords) {
      const newFirst = this.first + this.rows;
      this.pageChange.emit({ first: newFirst, rows: this.rows });
    }
  }

  // Go to specific page
  goToPage(page: number): void {
    const newFirst = (page - 1) * this.rows;
    this.pageChange.emit({ first: newFirst, rows: this.rows });
  }

  // Check if previous is disabled
  isPreviousDisabled(): boolean {
    return this.first === 0;
  }

  // Check if next is disabled
  isNextDisabled(): boolean {
    return this.first + this.rows >= this.totalRecords;
  }

  // Get page numbers to display
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.getCurrentPage();
    const pages: number[] = [];

    // Show max 5 pages at a time
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}





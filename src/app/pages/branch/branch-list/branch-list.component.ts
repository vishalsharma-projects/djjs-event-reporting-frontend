import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BranchService } from 'src/app/core/services/branch.service';

interface BranchData {
  id: string;
  branchName: string;
  branchManagerName: string;
  state: string;
  city: string;
  establishedOn: Date;
  ashramArea: string;
  members: any[];  // Add appropriate members interface
}

@Component({
  selector: 'app-branch-list',
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss']
})
export class BranchListComponent implements OnInit {

  expandedRows: { [key: string]: boolean } = {};
  first = 0;
  rows = 10;
  rowsPerPageOptions = [5, 10, 20, 50];
  globalFilterValue = '';
  branches: BranchData[] = [];

  constructor(private router: Router, private branchService: BranchService, private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadBranches();
  }

  // Load branches with pagination, filter, and sorting
  loadBranches() {
    this.branchService.getBranches(this.first, this.rows, this.globalFilterValue).subscribe(data => {
      this.branches = data.branches;  // Adjust the response structure according to your API response
    });
  }

  // Handle page change
  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.loadBranches();
  }

  // Handle sorting
  onSort(event: any) {
    const { field, order } = event;
    this.branchService.getBranches(this.first, this.rows, this.globalFilterValue, field, order).subscribe(data => {
      this.branches = data.branches;  // Adjust response according to your API
    });
  }

  // Handle global filter
  onGlobalFilterChange(event: any) {
    this.globalFilterValue = event.target.value;
    this.loadBranches();
  }

  // Handle row expand
  onRowExpand(event: any) {
    this.expandedRows[event.data.id] = true;
  }

  // Handle row collapse
  onRowCollapse(event: any) {
    this.expandedRows[event.data.id] = false;
  }

  // Add new branch
  addBranch() {
    this.router.navigate(['/branch/add']);
  }

  // Edit branch
  editBranch(branchId: string) {
    console.log('Edit branch:', branchId);
  }

  // Delete branch
  deleteBranch(branchId: string) {
    this.branchService.deleteBranch(branchId).subscribe(() => {
      this.loadBranches();  // Refresh the list after deletion
    });
  }
}

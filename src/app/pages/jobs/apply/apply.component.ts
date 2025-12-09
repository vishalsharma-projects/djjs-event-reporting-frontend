import { Component, QueryList, ViewChildren, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';
// store
import { Store } from '@ngrx/store';
import { fetchJobApplyData } from 'src/app/store/Job/job.action';
import { selecDatapply } from 'src/app/store/Job/job-selector';

@Component({
  selector: 'app-apply',
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss']
})

/**
 * Apply Component
 */
export class ApplyComponent implements OnInit {
  endItem: any
  // bread crumb items
  breadCrumbItems: Array<{}>;
  jobApplyForm!: UntypedFormGroup;
  submitted: boolean = false;
  page: number = 1
  // Table data
  content?: any;
  applies?: any;
  applyjob: any
  total: Observable<number>;

  constructor(
    private modalService: BsModalService,
    private formBuilder: UntypedFormBuilder,
    public store: Store,
    private confirmationDialog: ConfirmationDialogService
  ) { }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Jobs' }, { label: 'Job Apply', active: true }];

    /**
* fetches data
*/
    this.store.dispatch(fetchJobApplyData());
    this.store.select(selecDatapply).subscribe(data => {
      this.applies = data;
      this.applyjob = data;
      this.applies = this.applyjob.slice(0, 8)
    });
  }

  // Delete Data
  delete(event: any) {
    this.confirmationDialog.confirmDelete({
      useBootstrapButtons: true,
      showCancelMessage: true
    }).then(result => {
      if (result.value) {
        event.target.closest('tr')?.remove();
      }
    });
  }

  // pagination
  pagechanged(event: any) {
    const startItem = (event.page - 1) * event.itemsPerPage
    this.endItem = event.page * event.itemsPerPage
    this.applies = this.applyjob(startItem, this.endItem)
  }
}

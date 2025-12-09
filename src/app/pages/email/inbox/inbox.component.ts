import { Component, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';
import { Store } from '@ngrx/store';
import { fetchmailData } from 'src/app/store/Email/email.action';
import { selectData } from 'src/app/store/Email/email.selector';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})

/**
 * Email Inbox component
 */
export class InboxComponent implements OnInit {

  modalRef?: BsModalRef;

  public Editor = ClassicEditor;
  // bread crumb items
  breadCrumbItems: Array<{}>;

  emailIds: number[] = [];
  emailData: any;
  // page number
  page: number = 1;
  // default page size
  pageSize: number = 15;
  // total number of records
  totalRecords: number = 0;
  returnedArray: any
  // start and end index
  startIndex: number = 1;
  endIndex: number = 15;

  constructor(
    private modalService: BsModalService,
    public store: Store,
    private confirmationDialog: ConfirmationDialogService
  ) {
  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Email' }, { label: 'Inbox', active: true }];
    // this.emailData = emailData;

    // Fetch data
    this.store.dispatch(fetchmailData());
    this.store.select(selectData).subscribe(data => {
      this.emailData = data
      this.returnedArray = data
      // this.customersData = this.returnedArray.slice(0, 8)
    })
    this.totalRecords = this.emailData.length;
  }

  open(content) {
    this.modalRef = this.modalService.show(content);
  }

  markUnread() {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.emailIds.length; i++) {
      const obj = this.emailData.find(o => o.id === this.emailIds[i]);
      const index = this.emailData.indexOf(obj);
      this.emailData[index].unread = true;
    }
    this.emailIds = [];
  }

  selectMail(event, id) {
    if (event.target.checked) {
      this.emailIds.push(id);
    } else {
      this.emailIds.splice(this.emailIds.indexOf(id), 1);
    }
  }

  deleteMail() {
    const found = this.emailData.some(r => this.emailIds.indexOf(r.id) >= 0);
    if (found) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.emailIds.length; i++) {
        const obj = this.emailData.find(o => o.id === this.emailIds[i]);
        this.emailData.splice(this.emailData.indexOf(obj), 1);
      }
    }
    this.emailIds = [];
  }

  confirm() {
    this.confirmationDialog.confirmDelete({
      successTitle: 'Deleted!',
      successText: 'Mail has been deleted.'
    }).then(result => {
      if (result.value) {
        this.deleteMail();
      }
    });
  }

  /**
   * Handle on page click event
   */
  onPageChange(page: any): void {
    this.startIndex = (page - 1) * this.pageSize + 1;
    this.endIndex = (page - 1) * this.pageSize + this.pageSize;
    if (this.endIndex > this.totalRecords) {
      this.endIndex = this.totalRecords;
    }
    this.emailData = this.returnedArray.slice(this.startIndex - 1, this.endIndex - 1);
  }

  /**
   * Category Filtering
   */
  categoryFilter(e: any, name: any) {
    var removeClass = document.querySelectorAll('.mail-list a');
    removeClass.forEach((element: any) => {
      element.classList.remove('active');
    });
    e.target.closest('.mail-list a').classList.add('active')
    if (name == 'all') {
      this.emailData = this.returnedArray
    }
    else {
      this.emailData = this.returnedArray.filter((email: any) => {
        return email.category === name;
      });
    }
  }

}

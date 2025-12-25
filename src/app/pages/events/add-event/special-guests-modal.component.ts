import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-special-guests-modal',
  templateUrl: './special-guests-modal.component.html',
  styleUrls: ['./special-guests-modal.component.scss']
})
export class SpecialGuestsModalComponent implements OnInit {
  // Properties will be set via initialState from BsModalService
  specialGuestsForm!: FormGroup;
  specialGuests: any[] = [];
  filteredCities: any[] = [];
  states: string[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() addSpecialGuest = new EventEmitter<void>();
  @Output() removeSpecialGuest = new EventEmitter<number>();

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    // Properties are set via initialState from BsModalService.show()
    // No initialization needed here - ngx-bootstrap sets them automatically
  }

  onClose(): void {
    this.close.emit();
    this.bsModalRef.hide();
  }

  onAddSpecialGuest(): void {
    this.addSpecialGuest.emit();
  }

  onRemoveSpecialGuest(index: number): void {
    this.removeSpecialGuest.emit(index);
  }
}



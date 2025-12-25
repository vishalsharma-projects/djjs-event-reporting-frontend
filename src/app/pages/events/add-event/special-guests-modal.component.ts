import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-special-guests-modal',
  templateUrl: './special-guests-modal.component.html',
  styleUrls: ['./special-guests-modal.component.scss']
})
export class SpecialGuestsModalComponent implements OnInit {
  @Input() specialGuestsForm!: FormGroup;
  @Input() specialGuests: any[] = [];
  @Input() filteredCities: any[] = [];
  @Input() states: string[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() addSpecialGuest = new EventEmitter<void>();
  @Output() removeSpecialGuest = new EventEmitter<number>();

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {}

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



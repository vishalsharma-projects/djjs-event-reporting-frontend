import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Volunteer } from 'src/app/core/services/event-api.service';

@Component({
  selector: 'app-volunteers-modal',
  templateUrl: './volunteers-modal.component.html',
  styleUrls: ['./volunteers-modal.component.scss']
})
export class VolunteersModalComponent implements OnInit {
  @Input() volunteersForm!: FormGroup;
  @Input() volunteers: any[] = [];
  @Input() volunteerSuggestions: Volunteer[] = [];
  @Input() showVolunteerSuggestions: boolean = false;
  @Input() searchingVolunteers: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() addVolunteer = new EventEmitter<void>();
  @Output() removeVolunteer = new EventEmitter<number>();
  @Output() searchVolunteers = new EventEmitter<string>();
  @Output() selectVolunteer = new EventEmitter<Volunteer>();
  @Output() hideVolunteerSuggestions = new EventEmitter<void>();

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {}

  onClose(): void {
    this.close.emit();
    this.bsModalRef.hide();
  }

  onAddVolunteer(): void {
    this.addVolunteer.emit();
  }

  onRemoveVolunteer(index: number): void {
    this.removeVolunteer.emit(index);
  }

  onSearchVolunteers(searchTerm: string): void {
    this.searchVolunteers.emit(searchTerm);
  }

  onSelectVolunteer(volunteer: Volunteer): void {
    this.selectVolunteer.emit(volunteer);
  }

  onHideVolunteerSuggestions(): void {
    this.hideVolunteerSuggestions.emit();
  }
}



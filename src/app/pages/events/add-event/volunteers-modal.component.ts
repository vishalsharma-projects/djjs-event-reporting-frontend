import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Volunteer } from 'src/app/core/services/event-api.service';

@Component({
  selector: 'app-volunteers-modal',
  templateUrl: './volunteers-modal.component.html',
  styleUrls: ['./volunteers-modal.component.scss']
})
export class VolunteersModalComponent implements OnInit {
  // Properties will be set via initialState from BsModalService
  volunteersForm!: FormGroup;
  volunteers: any[] = [];
  volunteerSuggestions: Volunteer[] = [];
  showVolunteerSuggestions: boolean = false;
  searchingVolunteers: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() addVolunteer = new EventEmitter<void>();
  @Output() removeVolunteer = new EventEmitter<number>();
  @Output() searchVolunteers = new EventEmitter<string>();
  @Output() selectVolunteer = new EventEmitter<Volunteer>();
  @Output() hideVolunteerSuggestions = new EventEmitter<void>();

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    // Properties are set via initialState from BsModalService.show()
    // No initialization needed here - ngx-bootstrap sets them automatically
  }

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

  onSearchFieldFocus(): void {
    // Show dropdown if there are suggestions, searching, or if there's text in the field
    const searchValue = this.volunteersForm?.get('volSearchMember')?.value || '';
    if (this.volunteerSuggestions.length > 0 || this.searchingVolunteers || searchValue.length >= 2) {
      this.showVolunteerSuggestions = true;
    }
  }

  onSearchVolunteers(searchTerm: string): void {
    // Show dropdown when user starts typing
    if (searchTerm && searchTerm.length >= 2) {
      this.showVolunteerSuggestions = true;
    }
    this.searchVolunteers.emit(searchTerm);
  }

  onSelectVolunteer(volunteer: Volunteer): void {
    this.selectVolunteer.emit(volunteer);
  }

  onHideVolunteerSuggestions(): void {
    this.hideVolunteerSuggestions.emit();
  }
}



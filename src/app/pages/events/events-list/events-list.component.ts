import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss']
})
export class EventsListComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  addEvent(): void {
    this.router.navigate(['/events/add']);
  }
}

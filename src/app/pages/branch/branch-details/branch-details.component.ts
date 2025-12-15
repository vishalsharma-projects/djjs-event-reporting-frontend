import { Component, Input, OnInit } from '@angular/core';
import { Branch } from 'src/app/core/services/location.service';

@Component({
  selector: 'app-branch-details',
  templateUrl: './branch-details.component.html',
  styleUrls: ['./branch-details.component.scss']
})
export class BranchDetailsComponent implements OnInit {
  @Input() branch: Branch | null = null;

  constructor() { }

  ngOnInit(): void {
  }
}





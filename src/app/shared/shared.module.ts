import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UIModule } from './ui/ui.module';

import { WidgetModule } from './widget/widget.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FormModule } from '../pages/form/form.module';
import { PaginationComponent } from './components/pagination/pagination.component';

@NgModule({
  declarations: [PaginationComponent],
  imports: [
    CommonModule,
    UIModule,
    WidgetModule ,
    ReactiveFormsModule ,
    FormModule
  ],
  exports :[
    CommonModule,
    UIModule,
    WidgetModule ,
    ReactiveFormsModule ,
    FormModule,
    PaginationComponent
  ]
})

export class SharedModule { }

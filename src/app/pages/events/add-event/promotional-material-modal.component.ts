import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-promotional-material-modal',
  templateUrl: './promotional-material-modal.component.html',
  styleUrls: ['./promotional-material-modal.component.scss']
})
export class PromotionalMaterialModalComponent implements OnInit {
  // Properties will be set via initialState from BsModalService
  materialTypes: any[] = [];
  materialTypeOptions: string[] = [];
  loadingMaterialTypes: boolean = false;
  
  // Form array for material types
  materialTypesForm!: FormGroup;
  materialTypesFormArray!: FormArray;

  @Output() close = new EventEmitter<void>();
  @Output() addMaterialType = new EventEmitter<void>();
  @Output() removeMaterialType = new EventEmitter<number>();

  constructor(public bsModalRef: BsModalRef, private fb: FormBuilder) {}

  ngOnInit(): void {
    // Properties are set via initialState from BsModalService.show()
    // Initialize form array
    this.materialTypesFormArray = this.fb.array([]);
    this.materialTypesForm = this.fb.group({
      materials: this.materialTypesFormArray
    });
    
    // Ensure at least one material type entry exists
    if (this.materialTypes.length === 0) {
      this.materialTypes.push({ materialType: '', quantity: '', size: '', customHeight: '', customWidth: '' });
    }
    
    // Create form controls for each material type
    this.materialTypes.forEach(material => {
      this.addMaterialTypeFormControl(material);
    });
  }

  addMaterialTypeFormControl(material: any): void {
    const materialGroup = this.fb.group({
      materialType: [material.materialType || '', Validators.required],
      quantity: [material.quantity || '', Validators.required],
      size: [material.size || ''],
      customHeight: [material.customHeight || ''],
      customWidth: [material.customWidth || '']
    });
    this.materialTypesFormArray.push(materialGroup);
  }

  getMaterialFormGroup(index: number): FormGroup {
    return this.materialTypesFormArray.at(index) as FormGroup;
  }

  isFieldInvalid(index: number, fieldName: string): boolean {
    const formGroup = this.getMaterialFormGroup(index);
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(index: number, fieldName: string): string {
    const formGroup = this.getMaterialFormGroup(index);
    const field = formGroup.get(fieldName);
    if (field?.errors?.['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'materialType': 'Material type',
      'quantity': 'Quantity',
      'size': 'Size',
      'customHeight': 'Height',
      'customWidth': 'Width'
    };
    return labels[fieldName] || fieldName;
  }

  onClose(): void {
    // Mark all fields as touched to show validation errors
    this.materialTypesFormArray.controls.forEach(control => {
      control.markAllAsTouched();
    });
    
    // Sync form values back to materialTypes array before closing
    this.syncFormToMaterialTypes();
    this.close.emit();
    this.bsModalRef.hide();
  }

  onAddMaterialType(): void {
    const newMaterial = { materialType: '', quantity: '', size: '', customHeight: '', customWidth: '' };
    this.materialTypes.push(newMaterial);
    this.addMaterialTypeFormControl(newMaterial);
    this.addMaterialType.emit();
  }

  onRemoveMaterialType(index: number): void {
    if (this.materialTypes.length > 1) {
      this.materialTypes.splice(index, 1);
      this.materialTypesFormArray.removeAt(index);
      this.removeMaterialType.emit(index);
    }
  }

  syncFormToMaterialTypes(): void {
    this.materialTypesFormArray.controls.forEach((control, index) => {
      if (this.materialTypes[index]) {
        this.materialTypes[index].materialType = control.get('materialType')?.value || '';
        this.materialTypes[index].quantity = control.get('quantity')?.value || '';
        this.materialTypes[index].size = control.get('size')?.value || '';
        this.materialTypes[index].customHeight = control.get('customHeight')?.value || '';
        this.materialTypes[index].customWidth = control.get('customWidth')?.value || '';
      }
    });
  }
}


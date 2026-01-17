import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-media-promotion-modal',
  templateUrl: './media-promotion-modal.component.html',
  styleUrls: ['./media-promotion-modal.component.scss']
})
export class MediaPromotionModalComponent implements OnInit {
  // Properties will be set via initialState from BsModalService
  mediaPromotionForm!: FormGroup;
  eventMediaList: any[] = [];
  materialTypes: any[] = [];
  fileMetadata: any = {};
  uploadedFiles: any = {};
  mediaTypes: string[] = [];
  materialTypeOptions: string[] = [];
  loadingMaterialTypes: boolean = false;
  isEditing: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() addEventMedia = new EventEmitter<void>();
  @Output() removeEventMedia = new EventEmitter<number>();
  @Output() addMaterialType = new EventEmitter<void>();
  @Output() removeMaterialType = new EventEmitter<number>();
  @Output() onFileInputChange = new EventEmitter<{event: any, fileType: string}>();
  @Output() removeFile = new EventEmitter<{fileType: string, index?: number}>();
  @Output() formatFileSize = new EventEmitter<number>();

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    // Properties are set via initialState from BsModalService.show()
    // No initialization needed here
  }

  onClose(): void {
    this.close.emit();
    this.bsModalRef.hide();
  }

  onAddEventMedia(): void {
    this.addEventMedia.emit();
  }

  onRemoveEventMedia(index: number): void {
    this.removeEventMedia.emit(index);
  }

  onAddMaterialType(): void {
    this.addMaterialType.emit();
  }

  onRemoveMaterialType(index: number): void {
    this.removeMaterialType.emit(index);
  }

  onFileChange(event: any, fileType: string): void {
    // Emit to parent component to handle file storage
    this.onFileInputChange.emit({event, fileType});
  }

  onRemoveFile(fileType: string, index?: number): void {
    this.removeFile.emit({fileType, index});
  }

  formatFileSizeMethod(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}



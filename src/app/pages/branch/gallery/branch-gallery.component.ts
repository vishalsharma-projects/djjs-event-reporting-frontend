import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchGalleryService } from 'src/app/core/services/branch-gallery.service';
import { MessageService } from 'primeng/api';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';

interface GalleryItem {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  category: string;
  date: Date;
  id?: number;
  branchId?: number;
}

@Component({
  selector: 'app-branch-gallery',
  templateUrl: './branch-gallery.component.html',
  styleUrls: ['./branch-gallery.component.scss']
})
export class BranchGalleryComponent implements OnInit, OnDestroy {
  types = ['All', 'image', 'video', 'audio', 'file'];
  categories = ['All', 'Branch Photos', 'Video Coverage', 'Documents', 'Other'];

  selectedType = 'All';
  selectedCategory = 'All';
  selectedItem: GalleryItem | null = null;
  isPopupOpen = false;
  branchId: number | null = null;
  isChildBranch: boolean = false;
  loading = false;
  uploading = false;
  uploadProgress = 0;
  currentUploadFile = '';
  imageErrors: { [key: number]: boolean } = {};
  videoErrors: { [key: number]: boolean } = {};
  audioErrors: { [key: number]: boolean } = {};

  items: GalleryItem[] = [];

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private branchGalleryService: BranchGalleryService,
    private messageService: MessageService,
    private confirmationDialog: ConfirmationDialogService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const branchIdParam = params['branchId'];
      this.isChildBranch = params['isChildBranch'] === 'true';

      if (branchIdParam) {
        this.branchId = Number(branchIdParam);
        this.loadGalleryItems();
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'No branch ID provided',
          life: 3000
        });
      }
    });
  }

  loadGalleryItems(): void {
    if (!this.branchId) return;

    this.loading = true;
    this.branchGalleryService.getBranchMedia(this.branchId, this.isChildBranch).subscribe({
      next: (response: any) => {
        const mediaList = response.data || response || [];

        this.items = mediaList.map((media: any) => {
          if (media.id) {
            if (this.imageErrors[media.id]) delete this.imageErrors[media.id];
            if (this.videoErrors[media.id]) delete this.videoErrors[media.id];
            if (this.audioErrors[media.id]) delete this.audioErrors[media.id];
          }

          let fileType: 'image' | 'video' | 'audio' | 'file' = 'file';
          if (media.file_type) {
            const ft = media.file_type.toLowerCase();
            if (ft === 'image') fileType = 'image';
            else if (ft === 'video') fileType = 'video';
            else if (ft === 'audio') fileType = 'audio';
            else fileType = 'file';
          }

          let category = 'Branch Photos';
          if (media.file_url) {
            const ft = (media.file_type || '').toLowerCase();
            if (ft === 'video' || media.file_url.includes('/videos/')) {
              category = 'Video Coverage';
            } else if (media.file_url.includes('/files/') || media.file_url.includes('/documents/')) {
              category = 'Documents';
            } else {
              category = 'Branch Photos';
            }
          }

          const name = media.name || media.file_name || `Media ${media.id}`;
          const date = media.created_on ? new Date(media.created_on) : new Date();
          const url = media.file_url || media.url || '';

          return {
            type: fileType,
            url: url,
            name: name,
            category: category,
            date: date,
            id: media.id,
            branchId: media.branch_id || this.branchId
          } as GalleryItem;
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading gallery items:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load gallery items. Please try again.',
          life: 3000
        });
        this.loading = false;
        this.items = [];
      }
    });
  }

  downloadItem(item: GalleryItem, event: Event): void {
    event.stopPropagation();
    if (!item.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Item ID not available',
        life: 3000
      });
      return;
    }

    this.branchGalleryService.getDownloadUrl(item.id).subscribe({
      next: async (response: any) => {
        const downloadUrl = response.download_url || response.data?.download_url || item.url;
        const fileName = response.file_name || response.data?.file_name || item.name || `download_${item.id}`;

        try {
          const fileResponse = await fetch(downloadUrl);
          if (!fileResponse.ok) throw new Error('Failed to fetch file');
          const blob = await fileResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'File downloaded successfully',
            life: 3000
          });
        } catch (error) {
          console.error('Error downloading file:', error);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      error: (error) => {
        console.error('Error getting download URL:', error);
        if (item.url) {
          const link = document.createElement('a');
          link.href = item.url;
          link.download = item.name || `download_${item.id}`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to get download URL',
            life: 3000
          });
        }
      }
    });
  }

  deleteItem(item: GalleryItem, event: Event): void {
    event.stopPropagation();
    if (!item.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Item ID not available',
        life: 3000
      });
      return;
    }

    this.confirmationDialog.confirmDelete({
      title: 'Delete Item',
      text: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      showSuccessMessage: false
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.branchGalleryService.deleteFile(item.id, this.branchId || undefined, this.isChildBranch, true).subscribe({
          next: () => {
            this.items = this.items.filter(i => i.id !== item.id);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Item deleted successfully',
              life: 3000
            });
            if (this.selectedItem?.id === item.id) {
              this.closePopup();
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Error deleting gallery item:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error?.error?.error || 'Failed to delete item. Please try again.',
              life: 3000
            });
            this.loading = false;
          }
        });
      }
    });
  }

  get filteredItemsByMonth() {
    const filtered = this.items.filter(item => {
      const matchBranch = !this.branchId || item.branchId === this.branchId;
      const matchType = this.selectedType === 'All' || item.type === this.selectedType;
      const matchCategory = this.selectedCategory === 'All' || item.category === this.selectedCategory;
      return matchBranch && matchType && matchCategory;
    });

    const groups: { [key: string]: GalleryItem[] } = {};
    filtered.forEach(item => {
      const key = item.date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }

  getMonthYearKeys() {
    return Object.keys(this.filteredItemsByMonth)
      .sort((a, b) => {
        // Parse month-year strings like "January 2024" to dates for proper sorting
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });
  }

  selectType(type: string) {
    this.selectedType = type;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  openPopup(item: GalleryItem) {
    this.selectedItem = item;
    this.isPopupOpen = true;
  }

  closePopup() {
    this.isPopupOpen = false;
    this.selectedItem = null;
  }

  onImageError(event: any, item: GalleryItem): void {
    if (item.id) {
      this.imageErrors[item.id] = true;
      this.branchGalleryService.getDownloadUrl(item.id).subscribe({
        next: (response: any) => {
          const presignedUrl = response.download_url || response.data?.download_url;
          if (presignedUrl) {
            const imgElement = event.target as HTMLImageElement;
            imgElement.src = presignedUrl;
            item.url = presignedUrl;
            delete this.imageErrors[item.id];
          }
        },
        error: () => {}
      });
    }
  }

  onVideoError(event: any, item: GalleryItem): void {
    if (item.id) {
      this.videoErrors[item.id] = true;
      this.branchGalleryService.getDownloadUrl(item.id).subscribe({
        next: (response: any) => {
          const presignedUrl = response.download_url || response.data?.download_url;
          if (presignedUrl) {
            const videoElement = event.target as HTMLVideoElement;
            videoElement.src = presignedUrl;
            item.url = presignedUrl;
            delete this.videoErrors[item.id];
          }
        },
        error: () => {}
      });
    }
  }

  onAudioError(event: any, item: GalleryItem): void {
    if (item.id) {
      this.audioErrors[item.id] = true;
      this.branchGalleryService.getDownloadUrl(item.id).subscribe({
        next: (response: any) => {
          const presignedUrl = response.download_url || response.data?.download_url;
          if (presignedUrl) {
            const audioElement = event.target as HTMLAudioElement;
            audioElement.src = presignedUrl;
            item.url = presignedUrl;
            delete this.audioErrors[item.id];
          }
        },
        error: () => {}
      });
    }
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.branchId) {
      return;
    }

    const files = Array.from(input.files);
    this.uploadFiles(files);
    input.value = '';
  }

  uploadFiles(files: File[]): void {
    if (!this.branchId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Branch ID is required',
        life: 3000
      });
      return;
    }

    if (files.length === 0) return;

    this.uploading = true;
    this.uploadProgress = 0;
    this.currentUploadFile = `Uploading ${files.length} file(s)...`;

    let category = 'Branch Photos';
    const firstFile = files[0];
    if (firstFile.type.startsWith('video/')) {
      category = 'Video Coverage';
    } else if (firstFile.type.startsWith('audio/')) {
      category = 'Other';
    } else if (firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().includes('doc')) {
      category = 'Documents';
    }

    this.branchGalleryService.uploadMultipleFiles(files, this.branchId, this.isChildBranch, category).subscribe({
      next: (response: any) => {
        this.uploading = false;
        this.uploadProgress = 0;
        this.currentUploadFile = '';

        const successCount = response.success || response.results?.length || 0;
        const failedCount = response.failed || 0;

        if (successCount > 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Upload Complete',
            detail: `Successfully uploaded ${successCount} file(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
            life: 5000
          });
        }

        if (failedCount > 0 && response.errors) {
          response.errors.forEach((error: string) => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Upload Warning',
              detail: error,
              life: 5000
            });
          });
        }

        this.loadGalleryItems();
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploading = false;
        this.uploadProgress = 0;
        this.currentUploadFile = '';

        let errorMessage = 'Unknown error';
        if (error?.error?.error) {
          errorMessage = error.error.error;
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: `Failed to upload files: ${errorMessage}`,
          life: 5000
        });
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}

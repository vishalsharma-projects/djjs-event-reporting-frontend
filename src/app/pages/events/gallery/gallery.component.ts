import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventApiService } from 'src/app/core/services/event-api.service';
import { MessageService } from 'primeng/api';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';

interface GalleryItem {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  category: string;
  date: Date;
  id?: number; // For deletion
  eventId?: number; // Associated event ID
}
@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  // File type filter tabs
  types = ['All', 'image', 'video', 'audio', 'file'];

  // Category filter tabs
  categories = ['All', 'Event Photos', 'Video Coverage', 'Testimonials','Press Release'];

  // Current selections
  selectedType = 'All';
  selectedCategory = 'All';
  selectedItem: GalleryItem | null = null;
  isPopupOpen = false;
  eventId: number | null = null;
  loading = false;
  uploading = false;
  uploadProgress = 0;
  currentUploadFile = '';

  // Data with dates - will be loaded from backend
  items: GalleryItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private eventApiService: EventApiService,
    private messageService: MessageService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    // Get event ID from route params or query params
    this.route.params.subscribe(params => {
      if (params['eventId']) {
        this.eventId = Number(params['eventId']);
        this.loadGalleryItems();
      } else {
        // Check query params
        this.route.queryParams.subscribe(queryParams => {
          if (queryParams['eventId']) {
            this.eventId = Number(queryParams['eventId']);
            this.loadGalleryItems();
          } else {
            // Load all gallery items if no event ID
            this.loadGalleryItems();
          }
        });
      }
    });
  }

  /**
   * Load gallery items from backend
   */
  loadGalleryItems(): void {
    this.loading = true;

    this.eventApiService.getEventMedia(this.eventId || undefined).subscribe({
      next: (response: any) => {
        // Handle response structure: { message: string, data: EventMedia[] }
        const mediaList = response.data || response || [];

        // Map backend EventMedia to GalleryItem format
        this.items = mediaList.map((media: any) => {
          // Use file_type from backend if available, otherwise infer from media coverage type
          let fileType: 'image' | 'video' | 'audio' | 'file' = 'file';

          if (media.file_type) {
            // Use file_type directly from backend (image, video, audio, file)
            const ft = media.file_type.toLowerCase();
            if (ft === 'image') fileType = 'image';
            else if (ft === 'video') fileType = 'video';
            else if (ft === 'audio') fileType = 'audio';
            else fileType = 'file';
          } else {
            // Fallback: infer from media coverage type
            const mediaType = media.media_coverage_type?.media_type?.toLowerCase() || '';
            if (mediaType.includes('photo') || mediaType.includes('image')) {
              fileType = 'image';
            } else if (mediaType.includes('video')) {
              fileType = 'video';
            } else if (mediaType.includes('audio')) {
              fileType = 'audio';
            }
          }

          // Map category - prefer file_type based category, fallback to media coverage type
          let category = 'Event Photos';

          // If file_url exists, try to determine category from file_type or URL
          if (media.file_url) {
            const ft = (media.file_type || '').toLowerCase();
            if (ft === 'video' || media.file_url.includes('/videos/')) {
              category = 'Video Coverage';
            } else if (ft === 'audio' || media.file_url.includes('/audio/')) {
              category = 'Testimonials';
            } else if (media.file_url.includes('/files/') || media.file_url.includes('press')) {
              category = 'Press Release';
            } else {
              category = 'Event Photos';
            }
          } else {
            // Fallback to media coverage type
            const mediaType = media.media_coverage_type?.media_type?.toLowerCase() || '';
            if (mediaType.includes('video')) {
              category = 'Video Coverage';
            } else if (mediaType.includes('testimonial')) {
              category = 'Testimonials';
            } else if (mediaType.includes('press') || mediaType.includes('release')) {
              category = 'Press Release';
            }
          }

          // Create name from company or person details
          const name = media.company_name ||
                      `${media.first_name || ''} ${media.last_name || ''}`.trim() ||
                      `Media ${media.id}`;

          // Use created date or current date
          const date = media.created_on ? new Date(media.created_on) : new Date();

          // Note: URL will be empty if files aren't stored yet
          // This can be extended when file upload is implemented
          const url = media.file_url || media.url || '';

          return {
            type: fileType,
            url: url,
            name: name,
            category: category,
            date: date,
            id: media.id,
            eventId: media.event_id
          } as GalleryItem;
        });

        this.loading = false;

        if (this.items.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'No Media Found',
            detail: this.eventId
              ? 'No media files found for this event.'
              : 'No media files found.',
            life: 3000
          });
        }
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
        // Fallback to empty array
        this.items = [];
      }
    });
  }

  /**
   * Download gallery item
   */
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

    // Get presigned download URL from backend
    this.eventApiService.getDownloadUrl(item.id).subscribe({
      next: (response: any) => {
        const downloadUrl = response.download_url || response.data?.download_url || item.url;
        const fileName = response.file_name || response.data?.file_name || item.name || `download_${item.id}`;

        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank'; // Open in new tab for presigned URLs
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'File downloaded successfully',
          life: 3000
        });
      },
      error: (error) => {
        console.error('Error getting download URL:', error);
        // Fallback to direct URL if presigned URL fails
        if (item.url) {
          const link = document.createElement('a');
          link.href = item.url;
          link.download = item.name || `download_${item.id}`;
          link.target = '_blank';
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

  /**
   * Delete gallery item
   */
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
      showSuccessMessage: false // We'll use PrimeNG message service instead
    }).then((result) => {
      if (result.value) {
      if (!item.id) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Cannot delete: Item ID not available',
          life: 3000
        });
        return;
      }

      this.loading = true;
      // Delete from S3 and database
      this.eventApiService.deleteFile(item.id, true).subscribe({
        next: () => {
          // Remove from local array
          this.items = this.items.filter(i => i.id !== item.id);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Item deleted successfully',
            life: 3000
          });

          // Close popup if deleted item was selected
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

  // Grouped and filtered items by Month-Year
  get filteredItemsByMonth() {
    const filtered = this.items.filter(item => {
      const matchType = this.selectedType === 'All' || item.type === this.selectedType;
      const matchCategory = this.selectedCategory === 'All' || item.category === this.selectedCategory;
      return matchType && matchCategory;
    });

    // Group by Month-Year
    const groups: { [key: string]: GalleryItem[] } = {};
    filtered.forEach(item => {
      const key = item.date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }

  // Month-Year keys sorted (latest first)
  getMonthYearKeys() {
    return Object.keys(this.filteredItemsByMonth)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
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

  /**
   * Handle file selection for manual upload
   */
  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.eventId) {
      return;
    }

    const files = Array.from(input.files);
    this.uploadFiles(files);

    // Reset input
    input.value = '';
  }

  /**
   * Upload files to S3
   */
  uploadFiles(files: File[]): void {
    if (!this.eventId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select an event first',
        life: 3000
      });
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    let uploadedCount = 0;
    const totalFiles = files.length;

    files.forEach((file, index) => {
      this.currentUploadFile = file.name;

      // Determine category based on file type
      let category = 'Event Photos';
      if (file.type.startsWith('video/')) {
        category = 'Video Coverage';
      } else if (file.type.startsWith('audio/')) {
        category = 'Testimonials';
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().includes('press')) {
        category = 'Press Release';
      }

      this.eventApiService.uploadFile(file, this.eventId!, undefined, category).subscribe({
        next: (response) => {
          uploadedCount++;
          this.uploadProgress = Math.round((uploadedCount / totalFiles) * 100);

          if (uploadedCount === totalFiles) {
            this.uploading = false;
            this.uploadProgress = 0;
            this.currentUploadFile = '';

            this.messageService.add({
              severity: 'success',
              summary: 'Upload Complete',
              detail: `Successfully uploaded ${uploadedCount} file(s)`,
              life: 3000
            });

            // Reload gallery items
            this.loadGalleryItems();
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          uploadedCount++;

          if (uploadedCount === totalFiles) {
            this.uploading = false;
            this.uploadProgress = 0;
            this.currentUploadFile = '';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: `Failed to upload ${file.name}: ${error?.error?.error || 'Unknown error'}`,
            life: 5000
          });
        }
      });
    });
  }
}

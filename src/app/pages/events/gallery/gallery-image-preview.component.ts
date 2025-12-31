import { Component, Input, OnInit, OnDestroy, Inject, Optional, OnChanges, SimpleChanges } from '@angular/core';
import { EventApiService } from 'src/app/core/services/event-api.service';
import { Subject, of, EMPTY, Observable } from 'rxjs';
import { switchMap, distinctUntilChanged, tap, finalize, catchError, takeUntil } from 'rxjs/operators';

export interface GalleryItem {
  id?: number;
  name: string;
  url?: string;
  type: 'image' | 'video' | 'audio' | 'file';
  category?: string;
  date?: string;
  eventId?: number;
}

interface PresignedUrlCache {
  url: string;
  expiresAt: number;
}

@Component({
  selector: 'app-gallery-image-preview',
  templateUrl: './gallery-image-preview.component.html',
  styleUrls: ['./gallery-image-preview.component.scss']
})
export class GalleryImagePreviewComponent implements OnInit, OnDestroy, OnChanges {
  // Primitive inputs - stable references
  @Input() mediaId?: number;
  @Input() items: GalleryItem[] = [];
  @Input() currentIndex: number = 0;
  @Input() data?: { 
    item?: GalleryItem; 
    items?: GalleryItem[];
    currentIndex?: number;
    onDownload?: (item: GalleryItem) => void; 
    onDelete?: (item: GalleryItem) => void; 
    onClose?: () => void;
  };
  
  // Display state
  item: GalleryItem | null = null;
  imageError = false;
  videoError = false;
  audioError = false;
  imageLoading = false;
  errorMessage = '';
  
  // Image URL for display
  imageUrl: string | null = null;
  
  // Active index for carousel (ensures first slide is active)
  activeIndex: number = 0;
  
  // Reactive pipeline
  private mediaId$ = new Subject<number | null>();
  private destroy$ = new Subject<void>();
  
  // URL cache for presigned URLs (15 min expiration)
  private urlCache = new Map<number, PresignedUrlCache>();
  private readonly CACHE_DURATION_MS = 15 * 60 * 1000;
  
  // Track last loaded URL to prevent duplicate loads
  private lastLoadedUrl: string | null = null;
  private currentImageLoadTimeout: any = null;

  constructor(
    @Optional() @Inject('MODAL_DATA') private modalData?: any,
    @Optional() private eventApiService?: EventApiService
  ) {
    this.setupKeyboardNavigation();
    this.setupImageLoadPipeline();
  }

  ngOnInit(): void {
    // Initialize from @Input() properties (set directly by modal portal)
    // Also support injector pattern for backward compatibility
    const data = this.data || this.modalData;
    
    if (data) {
      console.log('GalleryImagePreviewComponent: Initializing with data:', {
        hasItems: !!data.items,
        itemsLength: data.items?.length,
        currentIndex: data.currentIndex,
        activeIndex: data.activeIndex,
        mediaId: data.mediaId,
        hasItem: !!data.item
      });
      
      if (data.items && Array.isArray(data.items)) {
        this.items = data.items;
      }
      if (data.currentIndex !== undefined && data.currentIndex !== null) {
        this.currentIndex = data.currentIndex;
        this.activeIndex = data.currentIndex; // Set activeIndex from currentIndex
      }
      if (data.activeIndex !== undefined && data.activeIndex !== null) {
        this.activeIndex = data.activeIndex;
        this.currentIndex = data.activeIndex; // Sync currentIndex with activeIndex
      }
      if (data.item) {
        this.item = data.item;
        // Extract mediaId from item (backward compatibility)
        if (data.item.id && !this.mediaId) {
          this.mediaId = data.item.id;
        }
      }
      // Use mediaId from data if provided (new pattern)
      if (data.mediaId && !this.mediaId) {
        this.mediaId = data.mediaId;
      }
    }
    
    // Also check if inputs were set directly (from modal portal createComponent)
    if (this.items && this.items.length > 0 && !this.item && this.activeIndex >= 0 && this.activeIndex < this.items.length) {
      this.item = this.items[this.activeIndex];
      if (this.item.id && !this.mediaId) {
        this.mediaId = this.item.id;
      }
    }
    
    // Ensure activeIndex is always valid (0 if items exist, otherwise 0)
    if (this.items && this.items.length > 0) {
      // Validate and fix activeIndex
      if (this.activeIndex < 0 || this.activeIndex >= this.items.length) {
        console.warn(`Invalid activeIndex ${this.activeIndex}, resetting to 0. Items length: ${this.items.length}`);
        this.activeIndex = 0;
        this.currentIndex = 0;
      }
      
      // Ensure item is set from items array if not already set
      if (!this.item && this.items[this.activeIndex]) {
        this.item = this.items[this.activeIndex];
        if (this.item.id && !this.mediaId) {
          this.mediaId = this.item.id;
        }
      }
      
      // If item is set but doesn't match activeIndex, update to match
      if (this.item && this.items[this.activeIndex] && this.item.id !== this.items[this.activeIndex].id) {
        console.log(`Item ID mismatch. Updating item from index ${this.activeIndex}`);
        this.item = this.items[this.activeIndex];
        if (this.item.id && !this.mediaId) {
          this.mediaId = this.item.id;
        }
      }
      
      // If we have mediaId but no item, try to find it in items array
      if (this.mediaId && !this.item) {
        const foundItem = this.items.find(i => i.id === this.mediaId);
        if (foundItem) {
          this.item = foundItem;
          const foundIndex = this.items.findIndex(i => i.id === this.mediaId);
          if (foundIndex >= 0) {
            this.activeIndex = foundIndex;
            this.currentIndex = foundIndex;
          }
        }
      }
    } else {
      console.warn('GalleryImagePreviewComponent: No items provided or items array is empty');
      if (this.item && this.item.id) {
        // If we have an item but no items array, use the item directly
        this.mediaId = this.item.id;
      }
    }
    
    console.log('GalleryImagePreviewComponent: Initialized state:', {
      itemsLength: this.items?.length || 0,
      activeIndex: this.activeIndex,
      currentIndex: this.currentIndex,
      mediaId: this.mediaId,
      itemId: this.item?.id,
      itemType: this.item?.type
    });
    
    // Start loading if we have a mediaId
    if (this.mediaId) {
      // If item already has a URL, use it directly (faster)
      if (this.item && this.item.url && this.item.type === 'image') {
        console.log(`Using item URL directly for mediaId ${this.mediaId}`);
        this.imageUrl = this.item.url;
        this.imageLoading = false;
        // Cache the URL
        this.urlCache.set(this.mediaId, {
          url: this.item.url,
          expiresAt: Date.now() + this.CACHE_DURATION_MS
        });
      } else {
        // Use setTimeout to ensure component is fully initialized
        setTimeout(() => {
          this.mediaId$.next(this.mediaId!);
        }, 100); // Increased delay to avoid race conditions
      }
    } else {
      console.warn('GalleryImagePreviewComponent: No mediaId available to load');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle data input changes (backward compatibility)
    if (changes['data'] && !changes['data'].firstChange) {
      const newData = changes['data'].currentValue;
      const oldData = changes['data'].previousValue;
      
      if (newData?.items) {
        this.items = newData.items;
      }
      if (newData?.currentIndex !== undefined) {
        this.currentIndex = newData.currentIndex;
      }
      if (newData?.item) {
        this.item = newData.item;
        const newMediaId = newData.item.id;
        const oldMediaId = oldData?.item?.id;
        
        // Only trigger load if mediaId actually changed
        if (newMediaId && newMediaId !== oldMediaId) {
          this.mediaId = newMediaId;
          this.mediaId$.next(newMediaId);
        }
      }
      return;
    }
    
    // Handle primitive input changes
    if (changes['mediaId'] && !changes['mediaId'].firstChange) {
      const newMediaId = changes['mediaId'].currentValue;
      const oldMediaId = changes['mediaId'].previousValue;
      
      // Only trigger load if mediaId actually changed
      if (newMediaId !== oldMediaId) {
        this.mediaId$.next(newMediaId || null);
      }
    }
    
    if (changes['currentIndex'] && !changes['currentIndex'].firstChange) {
      const newIndex = changes['currentIndex'].currentValue;
      const oldIndex = changes['currentIndex'].previousValue;
      
      // Update item from items array if index changed
      if (newIndex !== oldIndex && this.items && this.items[newIndex]) {
        this.item = this.items[newIndex];
        const newMediaId = this.items[newIndex].id;
        if (newMediaId && newMediaId !== this.mediaId) {
          this.mediaId = newMediaId;
          this.mediaId$.next(newMediaId);
        }
      }
    }
  }

  /**
   * Setup reactive pipeline for image loading
   * Uses switchMap to cancel in-flight requests when mediaId changes
   */
  private setupImageLoadPipeline(): void {
    this.mediaId$.pipe(
      distinctUntilChanged(), // Only proceed if mediaId actually changed
      tap(() => {
        // Reset state when starting new load
        this.imageLoading = true;
        this.imageError = false;
        this.errorMessage = '';
        this.imageUrl = null;
      }),
      switchMap((mediaId) => {
        if (!mediaId) {
          return EMPTY;
        }
        
        // Find item from items array
        const item = this.items.find(i => i.id === mediaId) || this.item;
        if (!item || item.type !== 'image') {
          this.imageLoading = false;
          return EMPTY;
        }
        
        // Check cache first
        const cached = this.urlCache.get(mediaId);
        if (cached && cached.expiresAt > Date.now()) {
          // Use cached URL
          const cachedUrl = cached.url;
          
          // Guard: Don't reload if URL is same as last loaded
          if (cachedUrl === this.lastLoadedUrl && this.imageUrl === cachedUrl) {
            this.imageLoading = false;
            return EMPTY;
          }
          
          this.lastLoadedUrl = cachedUrl;
          return of(cachedUrl);
        }
        
        // Check if item already has a valid presigned URL
        if (item.url && this.isPresignedUrl(item.url)) {
          console.log(`Using item URL directly for mediaId ${mediaId}:`, item.url.substring(0, 100) + '...');
          
          // Cache it
          this.urlCache.set(mediaId, {
            url: item.url,
            expiresAt: Date.now() + this.CACHE_DURATION_MS
          });
          
          // Guard: Don't reload if URL is same as last loaded
          if (item.url === this.lastLoadedUrl && this.imageUrl === item.url) {
            console.log(`URL already loaded for mediaId ${mediaId}, skipping`);
            this.imageLoading = false;
            return EMPTY;
          }
          
          this.lastLoadedUrl = item.url;
          return of(item.url);
        } else if (item.url) {
          console.warn(`Item has URL but it's not a valid presigned URL for mediaId ${mediaId}:`, item.url.substring(0, 100));
        }
        
        // Need to fetch presigned URL
        if (!this.eventApiService) {
          this.imageError = true;
          this.imageLoading = false;
          this.errorMessage = 'Service not available';
          return EMPTY;
        }
        
        return this.eventApiService.getDownloadUrl(mediaId).pipe(
          distinctUntilChanged((prev, curr) => {
            const prevUrl = prev?.download_url || prev?.data?.download_url;
            const currUrl = curr?.download_url || curr?.data?.download_url;
            return prevUrl === currUrl;
          }),
          switchMap((response: any) => {
            const presignedUrl = response.download_url || response.data?.download_url;
            
            if (!presignedUrl) {
              // Fallback to blob fetch
              return this.eventApiService!.getFileBlob(mediaId).pipe(
                switchMap((blob: Blob) => {
                  if (blob && blob.size > 0) {
                    const blobUrl = URL.createObjectURL(blob);
                    return of(blobUrl);
                  }
                  throw new Error('Empty blob received');
                })
              );
            }
            
            // Cache the presigned URL
            this.urlCache.set(mediaId, {
              url: presignedUrl,
              expiresAt: Date.now() + this.CACHE_DURATION_MS
            });
            
            // Guard: Don't reload if URL is same as last loaded
            if (presignedUrl === this.lastLoadedUrl && this.imageUrl === presignedUrl) {
              return EMPTY;
            }
            
            this.lastLoadedUrl = presignedUrl;
            return of(presignedUrl);
          }),
          catchError((error) => {
            // Only log actual errors, not expected failures
            if (error.status !== 404) {
              console.error('Error fetching presigned URL:', error);
            }
            this.imageError = true;
            this.errorMessage = this.getErrorMessage(error);
            return EMPTY;
          })
        );
      }),
      // Load the image element - set URL and let browser handle loading
      // The template's (load) event will handle completion
      tap((url: string) => {
        if (!url) {
          console.warn('Image URL is empty, cannot load image');
          return;
        }
        
        console.log(`Setting imageUrl for mediaId ${this.mediaId}:`, url.substring(0, 100) + '...');
        
        // Set the URL - browser will load it
        this.imageUrl = url;
        
        // Set timeout for loading
        if (this.currentImageLoadTimeout) {
          clearTimeout(this.currentImageLoadTimeout);
        }
        this.currentImageLoadTimeout = setTimeout(() => {
          if (this.imageLoading) {
            console.warn('Image loading timeout after 30s for mediaId:', this.mediaId);
            this.imageError = true;
            this.imageLoading = false;
            this.errorMessage = 'Image loading timed out';
          }
        }, 30000);
      }),
      // Return the URL for the subscription
      switchMap((url: string) => {
        return of(url);
      }),
      finalize(() => {
        this.imageLoading = false;
      }),
      catchError((error) => {
        // Only log if it's not a timeout (timeout is handled in tap)
        if (!error.message || !error.message.includes('timeout')) {
          console.error('Error loading image:', error);
        }
        this.imageError = true;
        this.errorMessage = error.message || 'Failed to load image';
        this.imageLoading = false;
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe((url: string) => {
      // URL is already set in tap above
      // Image load/error handlers will update loading state
    });
  }

  /**
   * Check if URL is a presigned URL
   */
  private isPresignedUrl(url: string): boolean {
    if (!url) return false;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    // Presigned URLs contain signature parameters
    // Check for AWS presigned URL signatures (X-Amz-* parameters or Signature=)
    if (url.includes('.amazonaws.com/')) {
      // AWS S3 presigned URLs must have signature parameters
      if (!url.includes('X-Amz-') && !url.includes('Signature=') && !url.includes('AWSAccessKeyId=')) {
        return false;
      }
    }
    // For non-AWS URLs, assume they're valid if they're HTTP/HTTPS
    return true;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Authentication required. Please log in again.';
    } else if (error.status === 403) {
      return 'You do not have permission to view this image.';
    } else if (error.status === 404) {
      return 'Image not found.';
    } else if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return `Failed to load image (status: ${error.status || 'unknown'})`;
  }

  /**
   * Retry loading the current image
   */
  retryLoad(): void {
    if (this.mediaId) {
      // Clear cache and reload
      this.urlCache.delete(this.mediaId);
      this.lastLoadedUrl = null;
      this.mediaId$.next(this.mediaId);
    }
  }

  ngOnDestroy(): void {
    // Clean up keyboard listener
    this.removeKeyboardNavigation();
    
    // Clear timeout
    if (this.currentImageLoadTimeout) {
      clearTimeout(this.currentImageLoadTimeout);
    }
    
    // Revoke ObjectURL to prevent memory leaks
    if (this.imageUrl && this.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.imageUrl);
    }
    
    // Complete subjects
    this.mediaId$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clear cache
    this.urlCache.clear();
  }

  /**
   * Setup keyboard navigation (arrow keys, ESC)
   */
  private keyboardHandler?: (event: KeyboardEvent) => void;
  
  setupKeyboardNavigation(): void {
    this.keyboardHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.handleClose(new Event('keydown'));
      }
    };
    document.addEventListener('keydown', this.keyboardHandler);
  }

  removeKeyboardNavigation(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }
  }


  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const failedUrl = img.src;
    
    // Log error for debugging
    console.error('Image load error:', {
      url: failedUrl,
      mediaId: this.mediaId,
      itemName: this.item?.name,
      imageUrl: this.imageUrl,
      matches: this.imageUrl && img.src === this.imageUrl
    });
    
    // Only update error state if this is for the current image
    if (this.imageUrl && img.src === this.imageUrl) {
      // Clear timeout
      if (this.currentImageLoadTimeout) {
        clearTimeout(this.currentImageLoadTimeout);
        this.currentImageLoadTimeout = null;
      }
      this.imageError = true;
      this.imageLoading = false;
      this.errorMessage = `Failed to load image: ${this.item?.name || 'Unknown'}. URL may be expired, invalid, or require authentication.`;
      
      // Log the failing URL (truncated for security)
      console.error('Failed URL (truncated):', failedUrl.substring(0, 200));
    }
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Only update loading state if this is for the current image
    if (this.imageUrl && img.src === this.imageUrl) {
      // Clear timeout
      if (this.currentImageLoadTimeout) {
        clearTimeout(this.currentImageLoadTimeout);
        this.currentImageLoadTimeout = null;
      }
      this.imageLoading = false;
      this.imageError = false;
      this.errorMessage = '';
    }
  }

  onVideoError(event: Event): void {
    this.videoError = true;
  }

  onAudioError(event: Event): void {
    this.audioError = true;
  }

  handleDownload(event: Event): void {
    event.stopPropagation();
    if (!this.item) return;
    const data = this.data || this.modalData;
    if (data?.onDownload) {
      data.onDownload(this.item);
    }
  }

  handleDelete(event: Event): void {
    event.stopPropagation();
    if (!this.item) return;
    const data = this.data || this.modalData;
    if (data?.onDelete) {
      data.onDelete(this.item);
    }
  }

  handleClose(event: Event): void {
    event.stopPropagation();
    const data = this.data || this.modalData;
    if (data?.onClose) {
      data.onClose();
    }
  }

  getFullFilename(item: GalleryItem | null): string {
    if (!item) return 'Untitled';
    return item.name || 'Untitled';
  }

  truncateFilename(filename: string, maxLength: number = 50): string {
    if (!filename) return '';
    if (filename.length <= maxLength) return filename;
    return filename.substring(0, maxLength - 3) + '...';
  }

}

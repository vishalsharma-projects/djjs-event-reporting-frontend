import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BranchGalleryService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get branch media
   * @param branchId Branch ID (optional - if not provided, returns all)
   * @param isChildBranch Whether this is a child branch
   */
  getBranchMedia(branchId?: number, isChildBranch: boolean = false): Observable<any> {
    if (branchId) {
      const endpoint = isChildBranch
        ? `${this.apiBaseUrl}/api/child-branch-media/branch/${branchId}`
        : `${this.apiBaseUrl}/api/branch-media/branch/${branchId}`;
      return this.http.get(endpoint);
    } else {
      return this.http.get(`${this.apiBaseUrl}/api/branch-media`);
    }
  }

  /**
   * Get presigned download URL for a file
   * @param mediaId Media ID
   */
  getDownloadUrl(mediaId: number): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/api/files/${mediaId}/download`);
  }

  /**
   * Upload multiple files to S3
   * @param files Array of files to upload
   * @param branchId Branch ID
   * @param isChildBranch Whether this is a child branch
   * @param category File category
   */
  uploadMultipleFiles(files: File[], branchId: number, isChildBranch: boolean = false, category?: string): Observable<any> {
    const formData = new FormData();

    // Append all files
    files.forEach(file => {
      formData.append('files', file);
    });

    formData.append('branch_id', branchId.toString());
    formData.append('is_child_branch', isChildBranch.toString());
    if (category) {
      formData.append('category', category);
    }

    return this.http.post(`${this.apiBaseUrl}/api/files/upload-branch`, formData);
  }

  /**
   * Delete file from S3
   * @param mediaId Media ID
   * @param branchId Optional branch ID for validation
   * @param isChildBranch Whether this is a child branch
   * @param deleteRecord Whether to delete the media record (default: true)
   */
  deleteFile(mediaId: number, branchId?: number, isChildBranch: boolean = false, deleteRecord: boolean = true): Observable<any> {
    let params = new HttpParams().set('delete_record', deleteRecord.toString());
    if (branchId) {
      params = params.set('branch_id', branchId.toString());
      params = params.set('is_child_branch', isChildBranch.toString());
    }
    return this.http.delete(`${this.apiBaseUrl}/api/files/${mediaId}`, { params });
  }
}




import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';  // Adjust the environment path as necessary

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private apiUrl = `${environment.apiBaseUrl}/branches`;  // Replace with actual API endpoint

  constructor(private http: HttpClient) { }

  // Get branches with pagination, sorting, and global filtering
  getBranches(first: number, rows: number, globalFilter: string, sortField?: string, sortOrder?: number): Observable<any> {
    let params = new HttpParams()
      .set('start', first.toString())
      .set('limit', rows.toString())
      .set('filter', globalFilter);

    if (sortField) {
      params = params.set('sortField', sortField);
      params = params.set('sortOrder', sortOrder ? sortOrder.toString() : '1');
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  deleteBranch(branchId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${branchId}`);
  }
}

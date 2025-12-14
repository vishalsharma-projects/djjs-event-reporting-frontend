import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChildBranch {
  id?: number;
  parent_branch_id: number;
  name: string;
  email?: string;
  coordinator_name?: string;
  contact_number: string;
  established_on?: string;
  aashram_area?: number;
  country_id?: number;
  state_id?: number;
  district_id?: number;
  city_id?: number;
  country?: { id: number; name: string };
  state?: { id: number; name: string };
  district?: { id: number; name: string };
  city?: { id: number; name: string };
  address?: string;
  pincode?: string;
  post_office?: string;
  police_station?: string;
  open_days?: string;
  daily_start_time?: string;
  daily_end_time?: string;
  status?: boolean;
  ncr?: boolean;
  region_id?: number;
  branch_code?: string;
  infrastructure?: ChildBranchInfrastructure[];
  members?: ChildBranchMember[];
  created_on?: string;
  updated_on?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ChildBranchInfrastructure {
  id?: number;
  child_branch_id: number;
  type: string;
  count: number;
  created_on?: string;
  updated_on?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ChildBranchMember {
  id?: number;
  child_branch_id: number;
  member_type: string;
  name: string;
  branch_role?: string;
  responsibility?: string;
  age?: number;
  date_of_samarpan?: string;
  qualification?: string;
  date_of_birth?: string;
  created_on?: string;
  updated_on?: string;
  created_by?: string;
  updated_by?: string;
}

export interface ChildBranchPayload {
  parent_branch_id: number;
  name: string;
  email?: string;
  coordinator_name?: string;
  contact_number: string;
  established_on?: string;
  aashram_area?: number;
  country_id?: number;
  state_id?: number;
  district_id?: number;
  city_id?: number;
  address?: string;
  pincode?: string;
  post_office?: string;
  police_station?: string;
  open_days?: string;
  daily_start_time?: string;
  daily_end_time?: string;
  status?: boolean;
  ncr?: boolean;
  region_id?: number;
  branch_code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChildBranchService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all child branches
   */
  getAllChildBranches(): Observable<ChildBranch[]> {
    return this.http.get<ChildBranch[]>(`${this.apiBaseUrl}/api/child-branches`);
  }

  /**
   * Get child branch by ID
   */
  getChildBranchById(childBranchId: number): Observable<ChildBranch> {
    return this.http.get<ChildBranch>(`${this.apiBaseUrl}/api/child-branches/${childBranchId}`);
  }

  /**
   * Get child branches by parent branch ID
   */
  getChildBranchesByParent(parentBranchId: number): Observable<ChildBranch[]> {
    return this.http.get<ChildBranch[]>(`${this.apiBaseUrl}/api/child-branches/parent/${parentBranchId}`);
  }

  /**
   * Create a new child branch
   */
  createChildBranch(childBranch: ChildBranchPayload): Observable<ChildBranch> {
    return this.http.post<ChildBranch>(`${this.apiBaseUrl}/api/child-branches`, childBranch);
  }

  /**
   * Update an existing child branch
   */
  updateChildBranch(childBranchId: number, childBranchData: Partial<ChildBranchPayload> | any): Observable<ChildBranch> {
    return this.http.put<ChildBranch>(`${this.apiBaseUrl}/api/child-branches/${childBranchId}`, childBranchData);
  }

  /**
   * Delete a child branch by ID
   */
  deleteChildBranch(childBranchId: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/api/child-branches/${childBranchId}`);
  }

  /**
   * Get infrastructure for a child branch
   */
  getChildBranchInfrastructure(childBranchId: number): Observable<ChildBranchInfrastructure[]> {
    return this.http.get<ChildBranchInfrastructure[]>(`${this.apiBaseUrl}/api/child-branches/${childBranchId}/infrastructure`);
  }

  /**
   * Create infrastructure for a child branch
   */
  createChildBranchInfrastructure(childBranchId: number, infrastructure: Omit<ChildBranchInfrastructure, 'id' | 'child_branch_id'>): Observable<ChildBranchInfrastructure> {
    return this.http.post<ChildBranchInfrastructure>(`${this.apiBaseUrl}/api/child-branches/${childBranchId}/infrastructure`, {
      ...infrastructure,
      child_branch_id: childBranchId
    });
  }

  /**
   * Get members for a child branch
   */
  getChildBranchMembers(childBranchId: number): Observable<ChildBranchMember[]> {
    return this.http.get<ChildBranchMember[]>(`${this.apiBaseUrl}/api/child-branches/${childBranchId}/members`);
  }

  /**
   * Create a member for a child branch
   */
  createChildBranchMember(childBranchId: number, member: Omit<ChildBranchMember, 'id' | 'child_branch_id'>): Observable<ChildBranchMember> {
    return this.http.post<ChildBranchMember>(`${this.apiBaseUrl}/api/child-branches/${childBranchId}/members`, {
      ...member,
      child_branch_id: childBranchId
    });
  }

  /**
   * Update a child branch member
   */
  updateChildBranchMember(memberId: number, memberData: Partial<ChildBranchMember>): Observable<ChildBranchMember> {
    return this.http.put<ChildBranchMember>(`${this.apiBaseUrl}/api/child-branch-members/${memberId}`, memberData);
  }

  /**
   * Delete a child branch member
   */
  deleteChildBranchMember(memberId: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/api/child-branch-members/${memberId}`);
  }
}



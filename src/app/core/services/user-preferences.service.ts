import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiConfigService } from './api-config.service';

export interface UserPreference {
  id: number;
  user_email: string;
  preference_type: string;
  preference_data: any;
  created_on?: string;
  updated_on?: string;
}

export interface EventsListColumnPreferences {
  hidden_columns: string[];
  pinned_columns: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private apiBaseUrl: string;

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    this.apiBaseUrl = this.apiConfig.getApiBaseUrl();
  }

  /**
   * Save user preferences
   */
  savePreference(preferenceType: string, preferenceData: any): Observable<UserPreference> {
    const url = this.apiConfig.buildApiUrl('/user-preferences');
    return this.http.post<UserPreference>(url, {
      preference_type: preferenceType,
      preference_data: preferenceData
    });
  }

  /**
   * Get user preferences by type
   */
  getPreference(preferenceType: string): Observable<UserPreference | null> {
    const url = this.apiConfig.buildApiUrl('/user-preferences');
    const params = new HttpParams().set('preference_type', preferenceType);
    
    return this.http.get<UserPreference>(url, { params }).pipe(
      catchError(() => {
        // Return null if preference not found (404)
        return of(null);
      })
    );
  }

  /**
   * Delete user preferences by type
   */
  deletePreference(preferenceType: string): Observable<void> {
    const url = this.apiConfig.buildApiUrl('/user-preferences');
    const params = new HttpParams().set('preference_type', preferenceType);
    
    return this.http.delete<void>(url, { params });
  }

  /**
   * Save events list column preferences
   */
  saveEventsListColumnPreferences(preferences: EventsListColumnPreferences): Observable<UserPreference> {
    return this.savePreference('events_list_columns', preferences);
  }

  /**
   * Get events list column preferences
   */
  getEventsListColumnPreferences(): Observable<EventsListColumnPreferences | null> {
    return this.getPreference('events_list_columns').pipe(
      map(pref => {
        if (!pref || !pref.preference_data) {
          return null;
        }
        return pref.preference_data as EventsListColumnPreferences;
      })
    );
  }
}


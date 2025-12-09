import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface EventType {
    id: number;
    name: string;
}

export interface EventCategory {
    id: number;
    name: string;
    event_type_id: number;
    event_type?: {
        id: number;
        name: string;
    };
}

export interface PromotionMaterialType {
    id: number;
    material_type: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventMasterDataService {
    private apiBaseUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    /**
     * Get all event types
     */
    getEventTypes(): Observable<EventType[]> {
        return this.http.get<EventType[]>(`${this.apiBaseUrl}/api/event-types`);
    }

    /**
     * Get all event categories
     */
    getEventCategories(): Observable<EventCategory[]> {
        return this.http.get<EventCategory[]>(`${this.apiBaseUrl}/api/event-categories`);
    }

    /**
     * Get all promotion material types
     */
    getPromotionMaterialTypes(): Observable<PromotionMaterialType[]> {
        return this.http.get<PromotionMaterialType[]>(`${this.apiBaseUrl}/api/promotion-material-types`);
    }
}


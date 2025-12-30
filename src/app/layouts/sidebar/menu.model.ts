import { ResourceType, ActionType } from '../../core/services/role.service';

export interface MenuItem {
    id?: number;
    label?: string;
    icon?: string;
    link?: string;
    subItems?: MenuItem[];
    isTitle?: boolean;
    badge?: any;
    parentId?: number;
    isLayout?: boolean;
    // Permission requirements - menu item will only show if user has this permission
    permission?: {
        resource: ResourceType;
        action: ActionType;
    };
    // Role requirement - menu item will only show if user has this role
    requiredRole?: string;
}

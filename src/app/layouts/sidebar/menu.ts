import { MenuItem } from './menu.model';
import { ResourceType, ActionType } from '../../core/services/role.service';

export const MENU: MenuItem[] = [
    {
        id: 1,
        label: 'DJJS Event Management',
        isTitle: true
    },
    {
        id: 2,
        label: 'MENUITEMS.DASHBOARDS.TEXT',
        icon: 'bx-home-circle',
        link: '/dashboard',
        // Dashboard is always visible (no permission check)
    },
    {
        id: 3,
        label: 'Events',
        icon: 'bx-calendar-event',
        link: '/events',
        permission: {
            resource: ResourceType.EVENTS,
            action: ActionType.LIST
        }
    },
    {
        id: 6,
        label: 'MENUITEMS.BRANCH.TEXT',
        icon: 'bx bx-git-pull-request',
        link: '/branch',
        permission: {
            resource: ResourceType.BRANCHES,
            action: ActionType.LIST
        }
    },
    {
        id: 8,
        label: 'Members',
        icon: 'bx-group',
        link: '/branch/members',
        permission: {
            resource: ResourceType.VOLUNTEERS,
            action: ActionType.LIST
        }
    },
    {
        id: 7,
        label: 'Users',
        icon: 'bx-user',
        link: '/branch/branchAssistance',
        permission: {
            resource: ResourceType.USERS,
            action: ActionType.LIST
        }
    },
    {
        id: 9,
        label: 'Settings',
        icon: 'bx-cog',
        link: '/settings',
        requiredRole: 'super_admin' // Only super admin can see settings
    },
];


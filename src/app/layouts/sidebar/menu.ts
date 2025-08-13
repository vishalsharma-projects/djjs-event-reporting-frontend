import { MenuItem } from './menu.model';

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
    },
    {
        id: 3,
        label: 'Events',
        icon: 'bx-calendar-event',
        link: '/events',
    },
    {
        id: 4,
        label: 'Areas',
        icon: 'bx-map',
        link: '/areas',
    },
    {
        id: 5,
        label: 'Districts',
        icon: 'bx bxs-inbox',
        link: '/districts',
    },
    {
        id: 6,
        label: 'Branches',
        icon: 'bx bx-git-pull-request',
        link: '/branches',
    },
    {
        id: 7,
        label: 'Users',
        icon: 'bx-user',
        link: '/users',
    },

    // {
    //     id: 1,
    //     label: 'MENUITEMS.MENU.TEXT',
    //     isTitle: true
    // },
    // {
    //     id: 2,
    //     label: 'MENUITEMS.DASHBOARDS.TEXT',
    //     icon: 'bx-home-circle',
    //     link: '/dashboard',
    //     // subItems: [
    //     //     {
    //     //         id: 3,
    //     //         label: 'MENUITEMS.DASHBOARDS.LIST.DEFAULT',
    //     //         link: '/dashboard',
    //     //         parentId: 2
    //     //     },
    //     //     {
    //     //         id: 4,
    //     //         label: 'MENUITEMS.DASHBOARDS.LIST.SAAS',
    //     //         link: '/dashboards/saas',
    //     //         parentId: 2
    //     //     },
    //     //     {
    //     //         id: 5,
    //     //         label: 'MENUITEMS.DASHBOARDS.LIST.CRYPTO',
    //     //         link: '/dashboards/crypto',
    //     //         parentId: 2
    //     //     },
    //     //     {
    //     //         id: 6,
    //     //         label: 'MENUITEMS.DASHBOARDS.LIST.BLOG',
    //     //         link: '/dashboards/blog',
    //     //         parentId: 2
    //     //     },
    //     //     {
    //     //         id: 7,
    //     //         label: 'MENUITEMS.DASHBOARDS.LIST.JOBS',
    //     //         link: '/dashboards/jobs',
    //     //         parentId: 2,
    //     //     },
    //     // ]
    // },
    // {
    //     id: 8,
    //     isLayout: true
    // },
    // {
    //     id: 9,
    //     label: 'MENUITEMS.APPS.TEXT',
    //     isTitle: true
    // },
    // {
    //     id: 10,
    //     label: 'MENUITEMS.CALENDAR.TEXT',
    //     icon: 'bx-calendar',
    //     link: '/calendar',
    // },
    // {
    //     id: 11,
    //     label: 'MENUITEMS.CHAT.TEXT',
    //     icon: 'bx-chat',
    //     link: '/chat',

    // },
    // {
    //     id: 12,
    //     label: 'MENUITEMS.FILEMANAGER.TEXT',
    //     icon: 'bx-file',
    //     link: '/filemanager',
    // },
    // {
    //     id: 13,
    //     label: 'MENUITEMS.ECOMMERCE.TEXT',
    //     icon: 'bx-store',
    //     subItems: [
    //         {
    //             id: 14,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.PRODUCTS',
    //             link: '/ecommerce/products',
    //             parentId: 13
    //         },
    //         {
    //             id: 15,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.PRODUCTDETAIL',
    //             link: '/ecommerce/product-detail/1',
    //             parentId: 13
    //         },
    //         {
    //             id: 16,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.ORDERS',
    //             link: '/ecommerce/orders',
    //             parentId: 13
    //         },
    //         {
    //             id: 17,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.CUSTOMERS',
    //             link: '/ecommerce/customers',
    //             parentId: 13
    //         },
    //         {
    //             id: 18,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.CART',
    //             link: '/ecommerce/cart',
    //             parentId: 13
    //         },
    //         {
    //             id: 19,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.CHECKOUT',
    //             link: '/ecommerce/checkout',
    //             parentId: 13
    //         },
    //         {
    //             id: 20,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.SHOPS',
    //             link: '/ecommerce/shops',
    //             parentId: 13
    //         },
    //         {
    //             id: 21,
    //             label: 'MENUITEMS.ECOMMERCE.LIST.ADDPRODUCT',
    //             link: '/ecommerce/add-product',
    //             parentId: 13
    //         },
    //     ]
    // },
    // {
    //     id: 22,
    //     label: 'MENUITEMS.CRYPTO.TEXT',
    //     icon: 'bx-bitcoin',
    //     subItems: [
    //         {
    //             id: 23,
    //             label: 'MENUITEMS.CRYPTO.LIST.WALLET',
    //             link: '/crypto/wallet',
    //             parentId: 22
    //         },
    //         {
    //             id: 24,
    //             label: 'MENUITEMS.CRYPTO.LIST.BUY/SELL',
    //             link: '/crypto/buy-sell',
    //             parentId: 22
    //         },
    //         {
    //             id: 25,
    //             label: 'MENUITEMS.CRYPTO.LIST.EXCHANGE',
    //             link: '/crypto/exchange',
    //             parentId: 22
    //         },
    //         {
    //             id: 26,
    //             label: 'MENUITEMS.CRYPTO.LIST.LENDING',
    //             link: '/crypto/lending',
    //             parentId: 22
    //         },
    //         {
    //             id: 27,
    //             label: 'MENUITEMS.CRYPTO.LIST.ORDERS',
    //             link: '/crypto/orders',
    //             parentId: 22
    //         },
    //         {
    //             id: 28,
    //             label: 'MENUITEMS.CRYPTO.LIST.KYCAPPLICATION',
    //             link: '/crypto/kyc-application',
    //             parentId: 22
    //         },
    //         {
    //             id: 29,
    //             label: 'MENUITEMS.CRYPTO.LIST.ICOLANDING',
    //             link: '/crypto-ico-landing',
    //             parentId: 22
    //         }
    //     ]
    // },
    // {
    //     id: 30,
    //     label: 'MENUITEMS.EMAIL.TEXT',
    //     icon: 'bx-envelope',
    //     subItems: [
    //         {
    //             id: 31,
    //             label: 'MENUITEMS.EMAIL.LIST.INBOX',
    //             link: '/email/inbox',
    //             parentId: 30
    //         },
    //         {
    //             id: 32,
    //             label: 'MENUITEMS.EMAIL.LIST.READEMAIL',
    //             link: '/email/read/1',
    //             parentId: 30
    //         },
    //         {
    //             id: 33,
    //             label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.TEXT',
    //             badge: {
    //                 variant: 'success',
    //                 text: 'MENUITEMS.EMAIL.LIST.TEMPLATE.BADGE'
    //             },
    //             subItems: [
    //                 {
    //                     id: 34,
    //                     label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.LIST.BASIC',
    //                     link: '/email/basic',
    //                     parentId: 33
    //                 },
    //                 {
    //                     id: 35,
    //                     label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.LIST.ALERT',
    //                     link: '/email/alert',
    //                     parentId: 33
    //                 },
    //                 {
    //                     id: 36,
    //                     label: 'MENUITEMS.EMAIL.LIST.TEMPLATE.LIST.BILLING',
    //                     link: '/email/billing',
    //                     parentId: 33
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     id: 37,
    //     label: 'MENUITEMS.INVOICES.TEXT',
    //     icon: 'bx-receipt',
    //     subItems: [
    //         {
    //             id: 38,
    //             label: 'MENUITEMS.INVOICES.LIST.INVOICELIST',
    //             link: '/invoices/list',
    //             parentId: 37
    //         },
    //         {
    //             id: 39,
    //             label: 'MENUITEMS.INVOICES.LIST.INVOICEDETAIL',
    //             link: '/invoices/detail',
    //             parentId: 37
    //         }
    //     ]
    // },
    // {
    //     id: 40,
    //     label: 'MENUITEMS.PROJECTS.TEXT',
    //     icon: 'bx-briefcase-alt-2',
    //     subItems: [
    //         {
    //             id: 41,
    //             label: 'MENUITEMS.PROJECTS.LIST.GRID',
    //             link: '/projects/grid',
    //             parentId: 40
    //         },
    //         {
    //             id: 42,
    //             label: 'MENUITEMS.PROJECTS.LIST.PROJECTLIST',
    //             link: '/projects/list',
    //             parentId: 40
    //         },
    //         {
    //             id: 43,
    //             label: 'MENUITEMS.PROJECTS.LIST.OVERVIEW',
    //             link: '/projects/overview',
    //             parentId: 40
    //         },
    //         {
    //             id: 44,
    //             label: 'MENUITEMS.PROJECTS.LIST.CREATE',
    //             link: '/projects/create',
    //             parentId: 40
    //         }
    //     ]
    // },
    // {
    //     id: 45,
    //     label: 'MENUITEMS.TASKS.TEXT',
    //     icon: 'bx-task',
    //     subItems: [
    //         {
    //             id: 46,
    //             label: 'MENUITEMS.TASKS.LIST.TASKLIST',
    //             link: '/tasks/list',
    //             parentId: 45
    //         },
    //         {
    //             id: 47,
    //             label: 'MENUITEMS.TASKS.LIST.KANBAN',
    //             link: '/tasks/kanban',
    //             parentId: 45
    //         },
    //         {
    //             id: 48,
    //             label: 'MENUITEMS.TASKS.LIST.CREATETASK',
    //             link: '/tasks/create',
    //             parentId: 45
    //         }
    //     ]
    // },
    // {
    //     id: 49,
    //     label: 'MENUITEMS.CONTACTS.TEXT',
    //     icon: 'bx-user-circle',
    //     subItems: [
    //         {
    //             id: 50,
    //             label: 'MENUITEMS.CONTACTS.LIST.USERGRID',
    //             link: '/contacts/usergrid',
    //             parentId: 49
    //         },
    //         {
    //             id: 51,
    //             label: 'MENUITEMS.CONTACTS.LIST.USERLIST',
    //             link: '/contacts/userlist',
    //             parentId: 49
    //         },
    //         {
    //             id: 52,
    //             label: 'MENUITEMS.CONTACTS.LIST.PROFILE',
    //             link: '/contacts/profile',
    //             parentId: 49
    //         }
    //     ]
    // },
    // {
    //     id: 53,
    //     label: 'MENUITEMS.BLOG.TEXT',
    //     icon: 'bx-file',
    //     badge: {
    //         variant: 'success',
    //         text: 'MENUITEMS.BLOG.BADGE'
    //     },
    //     subItems: [
    //         {
    //             id: 54,
    //             label: 'MENUITEMS.BLOG.LIST.BLOGLIST',
    //             link: '/blog/list',
    //             parentId: 53
    //         },
    //         {
    //             id: 55,
    //             label: 'MENUITEMS.BLOG.LIST.BLOGGRID',
    //             link: '/blog/grid',
    //             parentId: 53
    //         },
    //         {
    //             id: 56,
    //             label: 'MENUITEMS.BLOG.LIST.DETAIL',
    //             link: '/blog/detail',
    //             parentId: 53
    //         }
    //     ]
    // },
    // {
    //     id: 57,
    //     isLayout: true
    // },
    // {
    //     id: 58,
    //     label: 'MENUITEMS.PAGES.TEXT',
    //     isTitle: true
    // },
    // {
    //     id: 59,
    //     label: 'MENUITEMS.AUTHENTICATION.TEXT',
    //     icon: 'bx-user-circle',
    //     subItems: [
    //         {
    //             id: 60,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN',
    //             link: '/account/login',
    //             parentId: 59
    //         },
    //         {
    //             id: 61,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.LOGIN2',
    //             link: '/account/login2',
    //             parentId: 59
    //         },
    //         {
    //             id: 62,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER',
    //             link: '/account/register',
    //             parentId: 59
    //         },
    //         {
    //             id: 63,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.REGISTER2',
    //             link: '/account/register2',
    //             parentId: 59
    //         },
    //         {
    //             id: 64,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPW',
    //             link: '/account/recoverpw',
    //             parentId: 59
    //         },
    //         {
    //             id: 65,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.RECOVERPW2',
    //             link: '/account/recoverpw2',
    //             parentId: 59
    //         },
    //         {
    //             id: 66,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN',
    //             link: '/account/lock-screen',
    //             parentId: 59
    //         },
    //         {
    //             id: 67,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.LOCKSCREEN2',
    //             link: '/account/lock-screen2',
    //             parentId: 59
    //         },
    //         {
    //             id: 68,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL',
    //             link: '/account/confirm-mail',
    //             parentId: 59
    //         },
    //         {
    //             id: 69,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.CONFIRMMAIL2',
    //             link: '/account/confirm-mail2',
    //             parentId: 59
    //         },
    //         {
    //             id: 70,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION',
    //             link: '/account/email-verification',
    //             parentId: 59
    //         },
    //         {
    //             id: 71,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.EMAILVERIFICATION2',
    //             link: '/account/email-verification2',
    //             parentId: 59
    //         },
    //         {
    //             id: 72,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION',
    //             link: '/account/two-step-verification',
    //             parentId: 59
    //         },
    //         {
    //             id: 73,
    //             label: 'MENUITEMS.AUTHENTICATION.LIST.TWOSTEPVERIFICATION2',
    //             link: '/account/two-step-verification2',
    //             parentId: 59
    //         }
    //     ]
    // },
    // {
    //     id: 74,
    //     label: 'MENUITEMS.UTILITY.TEXT',
    //     icon: 'bx-file',
    //     subItems: [
    //         {
    //             id: 75,
    //             label: 'MENUITEMS.UTILITY.LIST.STARTER',
    //             link: '/pages/starter',
    //             parentId: 74
    //         },
    //         {
    //             id: 76,
    //             label: 'MENUITEMS.UTILITY.LIST.MAINTENANCE',
    //             link: '/pages/maintenance',
    //             parentId: 74
    //         },
    //         {
    //             id: 77,
    //             label: 'MENUITEMS.UTILITY.LIST.COMMINGSOON',
    //             link: '/pages/coming-soon',
    //             parentId: 74
    //         },
    //         {
    //             id: 78,
    //             label: 'MENUITEMS.UTILITY.LIST.TIMELINE',
    //             link: '/pages/timeline',
    //             parentId: 74
    //         },
    //         {
    //             id: 79,
    //             label: 'MENUITEMS.UTILITY.LIST.FAQS',
    //             link: '/pages/faqs',
    //             parentId: 74
    //         },
    //         {
    //             id: 80,
    //             label: 'MENUITEMS.UTILITY.LIST.PRICING',
    //             link: '/pages/pricing',
    //             parentId: 74
    //         },
    //         {
    //             id: 81,
    //             label: 'MENUITEMS.UTILITY.LIST.ERROR404',
    //             link: '/pages/404',
    //             parentId: 74
    //         },
    //         {
    //             id: 82,
    //             label: 'MENUITEMS.UTILITY.LIST.ERROR500',
    //             link: '/pages/500',
    //             parentId: 74
    //         }
    //     ]
    // },
    // {
    //     id: 83,
    //     isLayout: true
    // },
    // {
    //     id: 84,
    //     label: 'MENUITEMS.COMPONENTS.TEXT',
    //     isTitle: true
    // },
    // {
    //     id: 85,
    //     label: 'MENUITEMS.UIELEMENTS.TEXT',
    //     icon: 'bx-tone',
    //     subItems: [
    //         {
    //             id: 86,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.ALERTS',
    //             link: '/ui/alerts',
    //             parentId: 85
    //         },
    //         {
    //             id: 87,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.BUTTONS',
    //             link: '/ui/buttons',
    //             parentId: 85
    //         },
    //         {
    //             id: 88,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.CARDS',
    //             link: '/ui/cards',
    //             parentId: 85
    //         },
    //         {
    //             id: 89,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.CAROUSEL',
    //             link: '/ui/carousel',
    //             parentId: 85
    //         },
    //         {
    //             id: 90,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.DROPDOWNS',
    //             link: '/ui/dropdowns',
    //             parentId: 85
    //         },
    //         {
    //             id: 91,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.GROUP',
    //             link: '/ui/group',
    //             parentId: 85
    //         },
    //         {
    //             id: 92,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.IMAGES',
    //             link: '/ui/images',
    //             parentId: 85
    //         },
    //         {
    //             id: 93,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.LIGHTBOX',
    //             link: '/ui/lightbox',
    //             parentId: 85
    //         },
    //         {
    //             id: 94,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.MODALS',
    //             link: '/ui/modals',
    //             parentId: 85
    //         },
    //         {
    //             id: 95,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.RANGESLIDER',
    //             link: '/ui/rangeslider',
    //             parentId: 85
    //         },
    //         {
    //             id: 96,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.SESSIONTIMEOUT',
    //             link: '/ui/session-timeout',
    //             parentId: 85
    //         },
    //         {
    //             id: 97,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.PROGRESSBAR',
    //             link: '/ui/progressbar',
    //             parentId: 85
    //         },
    //         {
    //             id: 98,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.SWEETALERT',
    //             link: '/ui/sweet-alert',
    //             parentId: 85
    //         },
    //         {
    //             id: 99,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.TABS',
    //             link: '/ui/tabs-accordions',
    //             parentId: 85
    //         },
    //         {
    //             id: 100,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.TYPOGRAPHY',
    //             link: '/ui/typography',
    //             parentId: 85
    //         },
    //         {
    //             id: 101,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.VIDEO',
    //             link: '/ui/video',
    //             parentId: 85
    //         },
    //         {
    //             id: 102,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.GENERAL',
    //             link: '/ui/general',
    //             parentId: 85
    //         },
    //         {
    //             id: 103,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.COLORS',
    //             link: '/ui/colors',
    //             parentId: 85
    //         },
    //         {
    //             id: 104,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.RATING',
    //             link: '/ui/rating',
    //             parentId: 85
    //         },
    //         {
    //             id: 105,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.NOTIFICATION',
    //             link: '/ui/notification',
    //             parentId: 85
    //         },
    //         {
    //             id: 106,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.SPINNERS',
    //             link: '/ui/spinners',
    //             parentId: 85
    //         },
    //         {
    //             id: 107,
    //             label: 'MENUITEMS.UIELEMENTS.LIST.JAVASCRIPT',
    //             link: '/ui/javascript',
    //             parentId: 85
    //         }
    //     ]
    // },
    // {
    //     id: 108,
    //     label: 'MENUITEMS.FORMS.TEXT',
    //     icon: 'bx-receipt',
    //     subItems: [
    //         {
    //             id: 109,
    //             label: 'MENUITEMS.FORMS.LIST.ELEMENTS',
    //             link: '/forms/elements',
    //             parentId: 108
    //         },
    //         {
    //             id: 110,
    //             label: 'MENUITEMS.FORMS.LIST.VALIDATION',
    //             link: '/forms/validation',
    //             parentId: 108
    //         },
    //         {
    //             id: 111,
    //             label: 'MENUITEMS.FORMS.LIST.ADVANCED',
    //             link: '/forms/advanced',
    //             parentId: 108
    //         },
    //         {
    //             id: 112,
    //             label: 'MENUITEMS.FORMS.LIST.EDITOR',
    //             link: '/forms/editor',
    //             parentId: 108
    //         },
    //         {
    //             id: 113,
    //             label: 'MENUITEMS.FORMS.LIST.FILEUPLOAD',
    //             link: '/forms/fileupload',
    //             parentId: 108
    //         },
    //         {
    //             id: 114,
    //             label: 'MENUITEMS.FORMS.LIST.REPEATER',
    //             link: '/forms/repeater',
    //             parentId: 108
    //         },
    //         {
    //             id: 115,
    //             label: 'MENUITEMS.FORMS.LIST.WIZARD',
    //             link: '/forms/wizard',
    //             parentId: 108
    //         },
    //         {
    //             id: 116,
    //             label: 'MENUITEMS.FORMS.LIST.MASK',
    //             link: '/forms/mask',
    //             parentId: 108
    //         }
    //     ]
    // },
    // {
    //     id: 117,
    //     label: 'MENUITEMS.TABLES.TEXT',
    //     icon: 'bx-table',
    //     subItems: [
    //         {
    //             id: 118,
    //             label: 'MENUITEMS.TABLES.LIST.BASIC',
    //             link: '/tables/basic',
    //             parentId: 117
    //         },
    //         {
    //             id: 119,
    //             label: 'MENUITEMS.TABLES.LIST.ADVANCED',
    //             link: '/tables/advanced',
    //             parentId: 117
    //         }
    //     ]
    // },
    // {
    //     id: 120,
    //     label: 'MENUITEMS.CHARTS.TEXT',
    //     icon: 'bx-doughnut-chart',
    //     subItems: [
    //         {
    //             id: 121,
    //             label: 'MENUITEMS.CHARTS.LIST.APEX',
    //             link: '/charts/apex',
    //             parentId: 120
    //         },
    //         {
    //             id: 122,
    //             label: 'MENUITEMS.CHARTS.LIST.CHARTJS',
    //             link: '/charts/chartjs',
    //             parentId: 120
    //         },
    //         {
    //             id: 123,
    //             label: 'MENUITEMS.CHARTS.LIST.CHARTIST',
    //             link: '/charts/chartist',
    //             parentId: 120
    //         },
    //         {
    //             id: 124,
    //             label: 'MENUITEMS.CHARTS.LIST.ECHART',
    //             link: '/charts/echart',
    //             parentId: 120
    //         }
    //     ]
    // },
    // {
    //     id: 125,
    //     label: 'MENUITEMS.ICONS.TEXT',
    //     icon: 'bx-store',
    //     subItems: [
    //         {
    //             id: 126,
    //             label: 'MENUITEMS.ICONS.LIST.BOXICONS',
    //             link: '/icons/boxicons',
    //             parentId: 125
    //         },
    //         {
    //             id: 127,
    //             label: 'MENUITEMS.ICONS.LIST.MATERIALDESIGN',
    //             link: '/icons/materialdesign',
    //             parentId: 125
    //         },
    //         {
    //             id: 128,
    //             label: 'MENUITEMS.ICONS.LIST.DRIPICONS',
    //             link: '/icons/dripicons',
    //             parentId: 125
    //         },
    //         {
    //             id: 129,
    //             label: 'MENUITEMS.ICONS.LIST.FONTAWESOME',
    //             link: '/icons/fontawesome',
    //             parentId: 125
    //         }
    //     ]
    // },
    // {
    //     id: 130,
    //     label: 'MENUITEMS.MAPS.TEXT',
    //     icon: 'bx-map',
    //     subItems: [
    //         {
    //             id: 131,
    //             label: 'MENUITEMS.MAPS.LIST.GOOGLEMAP',
    //             link: '/maps/google',
    //             parentId: 130
    //         },
    //         {
    //             id: 132,
    //             label: 'MENUITEMS.LIST.VECTOR',
    //             link: '/maps/vector',
    //             parentId: 130
    //         }
    //     ]
    // },
    // {
    //     id: 133,
    //     isLayout: true
    // },
    // {
    //     id: 134,
    //     label: 'MENUITEMS.MULTILEVEL.TEXT',
    //     icon: 'bx-share-alt',
    //     subItems: [
    //         {
    //             id: 135,
    //             label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.1',
    //             link: 'javascript: void(0);',
    //             parentId: 134
    //         },
    //         {
    //             id: 136,
    //             label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.2',
    //             parentId: 134,
    //             subItems: [
    //                 {
    //                     id: 137,
    //                     label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.LEVEL2.1',
    //                     link: 'javascript: void(0);',
    //                     parentId: 136,
    //                 },
    //                 {
    //                     id: 138,
    //                     label: 'MENUITEMS.MULTILEVEL.LIST.LEVEL1.LEVEL2.2',
    //                     link: 'javascript: void(0);',
    //                     parentId: 136,
    //                 }
    //             ]
    //         }
    //     ]
    // }
];



export const API_ENDPOINT = {
    DASHBOARD: {
        BASE: '/dashboard',
    },
    LANDING_PAGE: {
        BASE: '/landing-data',
    },
    CARDS: {
        BASE: '/cards',
        CREATE_NEW_CARD: '/cards',
        GET_CARD: (cardId: any) => `/cards/${cardId}`,
    },
    TRANSACTIONS: {
        BASE: '/transactions',
        BY_ID: (transactionId: string) => `/transactions/${transactionId}`,
        BY_QUERY: (transactionId: string) => `/transactions?transaction_id=${transactionId}`,
        CREATES: '/transactions/creates',
        OPENAI: '/transactions/openai',
    },
    CATEGORIES: {
        BASE: '/categories',
    },
    USERS: {
        SIGN_UP: '/users/sign-up',
        SIGN_IN: '/users/sign-in',
    },
    ANALYTICS: {
        TOTAL_ASSET: '/analytics/total-asset',
        CATEGORY_VOLUME: '/analytics/category-volume',
    },
    RECURRINGS: {
        BASE: '/recurrings',
        BY_ID: (recurringId: string | number) => `/recurrings/${recurringId}`,
        INSTANCES: '/recurrings/recurring-instances',
        INSTANCES_BY_ID: (instanceId: string | number) => `/recurrings/recurring-instances/${instanceId}`,
        INSTANCE_SKIP: (instanceId: string | number) => `/recurrings/recurring-instances/${instanceId}/skip`,
        INSTANCE_CREATE_TRANSACTION: (instanceId: string | number) => `/recurrings/recurring-instances/${instanceId}/create-transaction`,
        PROJECTED_BALANCE: '/recurrings/recurring-instances/projected-balance',
    },
};

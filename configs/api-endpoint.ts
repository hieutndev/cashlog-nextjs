import { TTransaction } from "@/types/transaction";

export const API_ENDPOINT = {
    CARDS: {
        BASE: '/cards',
        CREATE_NEW_CARD: '/cards',
        GET_CARD: (cardId: any) => `/cards/${cardId}`,
    },
    TRANSACTIONS: {
        BASE: '/transactions',
        BY_ID: (transactionId: string) => `/transactions/${transactionId}`,
        BY_QUERY: (transactionId: string) => `/transactions?transaction_id=${transactionId}`,
    },
    CATEGORIES: {
        BASE: '/categories',
    },
    USERS: {
        SIGN_UP: '/users/sign-up',
        SIGN_IN: '/users/sign-in',
    },
    RECURRINGS: {
        BASE: '/recurrings',
        BY_ID: (id: any) => `/recurrings/${id}`,
    },
};
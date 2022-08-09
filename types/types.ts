import { CurrencyFormat } from "ynab"

export interface Category {
    id: string
    label: string
    balance: number
    groupName: string
}

export interface CategoryGroup {
    id: string
    name: string
    categories: Category[]
}

export interface Account {
    id: string
    label: string
}

export interface Payee {
    id?: string
    label: string
    transferAccountId?: string | null
    inputValue?: string
}

export interface TransactionOptions {
    accounts: Account[]
    payees: Payee[]
    categories: Category[]
    currency: CurrencyFormat
}

export interface Transaction {
    accountId: string,
    data: string,
    ammount: number,
    payeeId?: string,
    payeeName: string,
    categoryId: string
}
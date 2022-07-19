import { JWT } from "next-auth/jwt"
import { Account } from "next-auth"

declare module "next-auth/jwt" {
    interface JWT {
        accessToken: string,
        refreshToken: string,
        accessTokenExpires: number
    }
}

declare module "next-auth" {
    interface Account {
        access_token: string,
        refresh_token: string,
        expires_at: number
    }
}
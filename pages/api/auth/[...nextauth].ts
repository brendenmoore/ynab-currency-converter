import NextAuth, { Awaitable, User } from "next-auth"
import { JWT } from "next-auth/jwt"

export async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const url =
            "https://app.youneedabudget.com/oauth/token?" +
            new URLSearchParams({
                grant_type: "refresh_token",
                client_id: process.env.CLIENT_ID as string,
                client_secret: process.env.CLIENT_SECRET as string,
                refresh_token: token.refreshToken
            })

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST"
        })

        const refreshedTokens = await response.json()

        if (!response.ok) {
            throw refreshedTokens
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
        }
    } catch (err) {
        console.log(err)

        return {
            ...token,
            error: "RefreshAccessTokenError"
        }
    }
}

export default NextAuth({
    debug: false,
    callbacks: {
        async jwt({ token, account }) {
            // initial sign in
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.accessTokenExpires= account.expires_at * 1000
                return token
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < token.accessTokenExpires) {
                return token
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token)
        },
        async session({ session, token, user }) {
            session.accessToken = token.accessToken
            return session
        }
    },
    providers: [
        {
            id: "ynab",
            name: "YNAB",
            type: "oauth",
            authorization: { url: "https://app.youneedabudget.com/oauth/authorize", params: { scope: 'public' } },
            token: { url: "https://app.youneedabudget.com/oauth/token" },
            userinfo: "https://api.youneedabudget.com/v1/user",
            profile(profile): Awaitable<User & { id: string }> {
                return {
                    id: profile.data.user.id,
                }
            },
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
        },
    ],
})
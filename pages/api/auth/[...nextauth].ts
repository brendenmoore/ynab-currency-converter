import NextAuth, { Awaitable, Profile, User } from "next-auth"

export default NextAuth({
    debug: true,
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        }
    },
    providers: [
        {
            id: "ynab",
            name: "YNAB",
            type: "oauth",
            authorization: { url: "https://app.youneedabudget.com/oauth/authorize", params: {scope: 'public'}},
            token: {url: "https://app.youneedabudget.com/oauth/token"},
            userinfo: "https://api.youneedabudget.com/v1/user",
            profile(profile): Awaitable<User & {id: string}> {
                return {
                    id: profile.data.user.id,
                }
            },
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
        },
    ],
})
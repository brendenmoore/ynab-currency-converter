import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'

interface ResponseBody {
    access_token: string
    expires_in: number
    refresh_token: string
    scope: string
    created_at: number
}

const redirectURI = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api/callback' : 'https://ynab.bmoore.dev/api/callback'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { code } = req.query
    if (!code) {
        res.redirect("/login")
    }
    const {data} = await axios.post<null, AxiosResponse<ResponseBody>>(`https://app.youneedabudget.com/oauth/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&redirect_uri=${redirectURI}&grant_type=authorization_code&code=${code}`)
    console.log(data.access_token)

    
}
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import * as ynab from 'ynab'

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const token = await getToken({ req })
    if (!token?.accessToken) {
        return res.redirect("/api/auth/signin")
    }

    const api = new ynab.API(token.accessToken)

    const categories = await api.categories.getCategories('default')
    res.send(categories.data)
}
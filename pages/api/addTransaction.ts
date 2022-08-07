import { NextApiHandler } from "next";
import { getToken } from "next-auth/jwt";
import * as ynab from 'ynab'

const addTransaction: NextApiHandler = async (req, res) => {
    const token = await getToken({ req })
    if (!token?.accessToken) {
        return res.redirect("/api/auth/signin")
    }

    // req.bod

    const api = new ynab.API(token.accessToken)

    api.transactions.createTransaction("default", {
        transaction: {
            account_id: 'accountid',
            date: "in ISO string format 2022-12-2",
            amount: 100,
            payee_id: 'string or null',
            payee_name: "if no payee_id is provided, it will match or create it automatically",
            category_id: 'string',
        }
    })
}

export default addTransaction
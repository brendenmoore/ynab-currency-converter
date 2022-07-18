import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const token = await getToken({ req })
    console.log(token)
    res.json(token)
}
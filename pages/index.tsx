import type { GetServerSideProps, NextPage } from 'next'
import { getToken } from 'next-auth/jwt'
import { signOut, useSession } from 'next-auth/react'
import * as ynab from 'ynab'
import {TextField, Autocomplete, Button, Box, Container} from '@mui/material'

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = await getToken({ req })
  console.log(token)
  if (!token?.accessToken) {
    return { props: {} }
  }

  const api = new ynab.API(token.accessToken)

  const categories = api.categories.getCategories('default')
  const accounts = api.accounts.getAccounts('default')
  const payees = api.accounts.getAccounts('default')
  const userData = await Promise.all([accounts, categories, payees])

  return {
    props: {
      userData
    }
  }
}

const Home: NextPage<{ userData?: [ynab.AccountsResponse, ynab.CategoriesResponse, ynab.PayeesResponse] }> = (props) => {

  useSession({ required: true })

  return (
    <Container maxWidth="sm">
      <div>
        <Button onClick={() => signOut()}>Sign out</Button>
      </div>
      <TextField inputProps={{inputMode: 'numeric', pattern: '[0-9]'}} label="Transaction Amount" />
      <br />
      <Autocomplete disablePortal id="category-selector" options={[]} renderInput={(params) => <TextField {...params} label="Category" />}></Autocomplete>
    </Container>
  )


}

export default Home

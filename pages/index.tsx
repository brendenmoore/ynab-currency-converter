import type { GetServerSideProps, NextPage } from 'next'
import { getToken } from 'next-auth/jwt'
import { signOut, useSession } from 'next-auth/react'
import * as ynab from 'ynab'
import {TextField, Autocomplete, Button, Box, Container} from '@mui/material'
import { useQuery } from 'react-query'
import { useEffect } from 'react'

// export const getServerSideProps: GetServerSideProps = async ({ req }) => {
//   const token = await getToken({ req })
//   console.log(token)
//   if (!token?.accessToken) {
//     return { props: {} }
//   }

//   const api = new ynab.API(token.accessToken)

//   const categories = await api.categories.getCategories('default')

//   return {
//     props: {
//       userData: categories
//     }
//   }
// }

const Home: NextPage<{ userData?: [ynab.AccountsResponse, ynab.CategoriesResponse, ynab.PayeesResponse] }> = (props) => {

  useSession({ required: true })
  const { data } = useQuery('/api/categories', async () => {
    return await (await fetch("/api/categories")).json()
  })
  
  useEffect(() => {
    console.log(data)
  }, [data])

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

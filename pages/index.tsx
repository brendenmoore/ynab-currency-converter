import type { GetServerSideProps, NextPage } from 'next'
import { getToken } from 'next-auth/jwt'
import { signIn, signOut, useSession } from 'next-auth/react'
import * as ynab from 'ynab'

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = await getToken({ req })
  console.log(token)
  if (!token?.accessToken) {
    return {props: {}}
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

const Home: NextPage<{userData?: [ynab.AccountsResponse, ynab.CategoriesResponse, ynab.PayeesResponse]}> = (props) => {

  const session = useSession()

  if (props.userData) {
    return <pre>{JSON.stringify(props.userData[0].data.accounts, null, 4)}</pre>
  }

  if (session.data) {
    return (
      <>
        Signed in. Session data: <br />
        {JSON.stringify(session)}
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn('ynab')}>Sign in</button>
    </>
  )
}

export default Home

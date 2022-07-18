import type { GetServerSideProps, NextPage } from 'next'
import { getToken } from 'next-auth/jwt'
import { signIn, signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import { useQuery } from 'react-query'
import * as ynab from 'ynab'

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const token = await getToken({ req })
  if (!token?.accessToken) {
    return {props: {}}
  }
  const api = new ynab.API(token.accessToken)

  const userData = await api.categories.getCategories('default')

  return {
    props: {
      userData
    }
  }
}

const Home: NextPage<{userData?: string}> = (props) => {

  const session = useSession()
  const { isLoading, error, data: token } = useQuery(['token'], () => {
    fetch("http://localhost:3000/api/token")
  })

  if (error) {
    return (
      <div>
        {JSON.stringify(error)}
      </div>
    )
  }

  if (props.userData) {
    return <div>{JSON.stringify(props.userData)}</div>
  }

  if (session.data) {
    return (
      <>
        Signed in. Session data: <br />
        {JSON.stringify(session)}
        <button onClick={() => signOut()}>Sign out</button>
        {JSON.stringify(token)}
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

import type { GetServerSideProps, NextPage } from 'next'
import { getToken } from 'next-auth/jwt'
import { signOut } from 'next-auth/react'
import * as ynab from 'ynab'
import { TextField, Autocomplete, Button, Container, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Account, Category, Payee, TransactionOptions } from '../types/types'
import { DatePicker } from '@mui/x-date-pickers'
import { DateTime } from 'luxon'

export const getServerSideProps: GetServerSideProps<{ transactionOptions?: TransactionOptions, error?: any }> = async ({ req }) => {

  const token = await getToken({ req })
  if (!token?.accessToken) {
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false
      }
    }
  }

  try {
    const api = new ynab.API(token.accessToken)

    const categoryPromise: Promise<Category[]> = api.categories.getCategories('default').then(response => {
      return response.data.category_groups.filter(group => !group.hidden).reduce((categories, group) => {
        return categories.concat(group.categories.filter(category => !category.hidden).map(category => {
          return {
            id: category.id,
            label: category.name,
            balance: ynab.utils.convertMilliUnitsToCurrencyAmount(category.balance),
            groupName: group.name
          }
        }))
      }, [] as Category[])
    })

    const payeesPromise: Promise<Payee[]> = api.payees.getPayees('default').then(response => {
      return response.data.payees.filter(payee => !payee.deleted).map(payee => {
        return {
          id: payee.id,
          label: payee.name,
          transferAccountId: payee.transfer_account_id || null
        }
      })
    })

    const accountsPromise: Promise<Account[]> = api.accounts.getAccounts('default').then(response => {
      return response.data.accounts.filter(account => !(account.deleted || account.closed)).map(account => {
        return {
          id: account.id,
          label: account.name,
        }
      })
    })

    const [categories, payees, accounts] = await Promise.all([categoryPromise, payeesPromise, accountsPromise])
    console.log(categories)
    return {
      props: {
        transactionOptions: {
          categories,
          payees,
          accounts
        },
      }
    }
  } catch (err) {
    console.log(err)
    return {
      props: {
        error: err
      }
    }
  }
}

const Home: NextPage<{ transactionOptions?: TransactionOptions, error?: any }> = ({ transactionOptions, error }) => {

  const [date, setDate] = useState<DateTime | null>(DateTime.now())

  if (error || !transactionOptions) {
    return (
      <Container>
        <Typography my={2} variant="h4" color="error">Error</Typography>
        <Typography>An unknown error has occured. Please reach out to <a href="mailto:admin@bmoore.dev">admin@bmoore.dev</a> for support.</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Stack spacing={3}>
        <div>
          <Button onClick={() => signOut()}>Sign out</Button>
        </div>
        <DatePicker label="Date" value={date} onChange={newDate => setDate(newDate)} renderInput={(params) => <TextField {...params} />}/>
        <TextField inputProps={{ inputMode: 'numeric', pattern: '[0-9]' }} label="Transaction Amount" />
        <Autocomplete id="account-selector" options={transactionOptions.accounts} renderInput={(params) => <TextField {...params} label="Account" />}></Autocomplete>
        <Autocomplete id="payee-selector" freeSolo options={transactionOptions.payees} renderInput={(params) => <TextField {...params} label="Payee" />}></Autocomplete>
        <Autocomplete id="category-selector" options={transactionOptions.categories} groupBy={(option) => option.groupName} renderInput={(params) => <TextField {...params} label="Category" />}></Autocomplete>
        <Button variant="contained">Add Transaction</Button>
      </Stack>
    </Container>
  )
}

export default Home

import type { GetServerSideProps, NextPage } from 'next'
import { getToken } from 'next-auth/jwt'
import { signOut } from 'next-auth/react'
import * as ynab from 'ynab'
import { TextField, Autocomplete, Button, Container, Stack, Typography, Box, createFilterOptions, InputAdornment } from '@mui/material'
import React, { useState } from 'react'
import { Account, Category, Payee, Transaction, TransactionOptions } from '../types/types'
import { DatePicker } from '@mui/x-date-pickers'
import { DateTime } from 'luxon'
import CurrencyInput from 'react-currency-input-field';
import { CurrencyInputOnChangeValues } from 'react-currency-input-field/dist/components/CurrencyInputProps'
import NumberFormat, { InputAttributes } from 'react-number-format';

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

const payeeFilter = createFilterOptions<Payee>()

const Home: NextPage<{ transactionOptions?: TransactionOptions, error?: any }> = ({ transactionOptions, error }) => {

  const [date, setDate] = useState<DateTime | null>(DateTime.now())
  const [account, setAccount] = useState<Account | null>(null)
  const [payee, setPayee] = useState<Payee | string | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [amount, setAmount] = useState<string | null>(null)

  const handleSubmit = async () => {
    console.log(amount)
    // const data: Transaction = {
    //   account_id: event.target.account
    // }
  }

  if (error || !transactionOptions) {
    return (
      <Container>
        <Typography my={2} variant="h4" color="error">Error</Typography>
        <Typography>An unknown error has occured. Please reach out to <a href="mailto:admin@bmoore.dev">admin@bmoore.dev</a> for support.</Typography>
      </Container>
    )
  }

  return (
    <Box>
      <Box width='100%' position="relative">
        <Button sx={{ position: 'absolute', right: 3 }} onClick={() => signOut()}>Sign out</Button>
      </Box>
      <Container maxWidth="sm" sx={{ minHeight: '95vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Stack spacing={3}>
          <Typography>Add a Transaction</Typography>
          <DatePicker label="Date" value={date} onChange={newDate => setDate(newDate)} renderInput={(params) => <TextField {...params} />} />
          <TextField
            label="Amount"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
            }}
            name="numberformat"
            id="formatted-numberformat-input"
            InputProps={{
              startAdornment: <InputAdornment position='start'>$</InputAdornment>,
              inputComponent: NumberFormatCustom as any,
            }}
          />
          <Autocomplete options={transactionOptions.accounts} value={account} onChange={(event, value) => setAccount(value)} renderInput={(params) => <TextField {...params} label="Account" />}></Autocomplete>
          <Autocomplete
            freeSolo
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={transactionOptions.payees}
            value={payee}
            onChange={(event, newValue) => {
              if (typeof newValue === 'string') {
                setPayee(newValue)
              } else if (newValue && newValue.inputValue) {
                setPayee(newValue.inputValue)
              }
            }}
            filterOptions={(options, params) => {
              const filtered = payeeFilter(options, params)
              const { inputValue } = params
              const isExisting = options.some((option) => inputValue === option.label)
              if (inputValue !== '' && !isExisting) {
                filtered.push({
                  inputValue,
                  label: `Add "${inputValue}"`
                })
              }
              return filtered
            }}
            renderInput={(params) => <TextField {...params} label="Payee" />}
          />
          <Autocomplete options={transactionOptions.categories} value={category} onChange={(event, value) => setCategory(value)} groupBy={(option) => option.groupName} renderInput={(params) => <TextField {...params} label="Category" />}></Autocomplete>
          <Button onClick={handleSubmit} variant="contained">Add Transaction</Button>
        </Stack>
      </Container>
    </Box>
  )
}
interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const NumberFormatCustom = React.forwardRef<
  NumberFormat<InputAttributes>,
  CustomProps
>(function NumberFormatCustom(props, ref) {
  const { onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      decimalScale={2}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value,
          },
        });
      }}
      thousandSeparator
      isNumericString
    />
  );
});

export default Home

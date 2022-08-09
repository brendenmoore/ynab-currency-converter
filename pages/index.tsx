import type { GetServerSideProps, NextPage } from 'next';
import { getToken } from 'next-auth/jwt';
import { signOut } from 'next-auth/react';
import * as ynab from 'ynab';
import {
  TextField,
  Autocomplete,
  Button,
  Container,
  Stack,
  Typography,
  Box,
  createFilterOptions,
  InputAdornment,
  Select,
  FormControl,
  MenuItem,
} from '@mui/material';
import React, { useState } from 'react';
import { Account, Category, Payee, TransactionOptions } from '../types/types';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import NumberFormat, { InputAttributes } from 'react-number-format';
import { CurrencyFormat, SaveTransactionsResponse } from 'ynab';
import { refreshAccessToken } from './api/auth/[...nextauth]';
import { currencies } from '../lib/supportedSymbols';
import axios from 'axios';

export const getServerSideProps: GetServerSideProps<{
  transactionOptions?: TransactionOptions;
  error?: any;
}> = async ({ req }) => {
  let token = await getToken({ req });
  if (!token?.accessToken) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  if (Date.now() > token.accessTokenExpires) {
    const newToken = await refreshAccessToken(token);
    if (newToken.error) {
      return {
        redirect: {
          destination: '/api/auth/signin',
          permanent: false,
        },
      };
    }
    token = newToken;
  }

  try {
    const api = new ynab.API(token.accessToken);

    const categoryPromise: Promise<Category[]> = api.categories
      .getCategories('default')
      .then((response) => {
        return response.data.category_groups
          .filter((group) => !group.hidden)
          .reduce((categories, group) => {
            return categories.concat(
              group.categories
                .filter((category) => !category.hidden)
                .map((category) => {
                  return {
                    id: category.id,
                    label: category.name,
                    balance: ynab.utils.convertMilliUnitsToCurrencyAmount(
                      category.balance
                    ),
                    groupName: group.name,
                  };
                })
            );
          }, [] as Category[]);
      });

    const payeesPromise: Promise<Payee[]> = api.payees
      .getPayees('default')
      .then((response) => {
        return response.data.payees
          .filter((payee) => !payee.deleted)
          .map((payee) => {
            return {
              id: payee.id,
              label: payee.name,
              transferAccountId: payee.transfer_account_id || null,
            };
          });
      });

    const accountsPromise: Promise<Account[]> = api.accounts
      .getAccounts('default')
      .then((response) => {
        return response.data.accounts
          .filter((account) => !(account.deleted || account.closed))
          .map((account) => {
            return {
              id: account.id,
              label: account.name,
            };
          });
      });

    const budgetCurrency: Promise<CurrencyFormat> = api.budgets
      .getBudgetSettingsById('default')
      .then((response) => {
        return response.data.settings.currency_format;
      });

    const [categories, payees, accounts, currency] = await Promise.all([
      categoryPromise,
      payeesPromise,
      accountsPromise,
      budgetCurrency,
    ]);
    return {
      props: {
        apiKey: token.accessToken,
        transactionOptions: {
          categories,
          payees,
          accounts,
          currency,
        },
      },
    };
  } catch (err) {
    console.log(err);
    return {
      props: {
        apiKey: token.accessToken,
        error: err,
      },
    };
  }
};

const payeeFilter = createFilterOptions<Payee>();

const Home: NextPage<{
  apiKey: string;
  transactionOptions?: TransactionOptions;
  error?: any;
}> = ({ apiKey, transactionOptions, error }) => {
  const [date, setDate] = useState<DateTime | null>(DateTime.now());
  const [account, setAccount] = useState<Account | null>(null);
  const [payee, setPayee] = useState<Payee | string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [currencySelection, setCurrencySelection] =
    useState<CurrencyFormat | null>(transactionOptions?.currency || null);
  const [amount, setAmount] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<SaveTransactionsResponse | null>(
    null
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    if (!date || !account || !payee || !category || !amount || !currencySelection || !transactionOptions) {
      setErrorMessage('Missing Data');
      setSubmitting(false);
      return;
    }
    const api = new ynab.API(apiKey);

    let payeeId: string | null = null;
    let payeeName: string;
    if (typeof payee !== 'string') {
      payeeId = payee.id || null;
      payeeName = payee.label;
    } else {
      payeeName = payee;
    }

    let convertedAmount: number;
    try {
      if (transactionOptions.currency.iso_code === currencySelection.iso_code) {
        convertedAmount = parseFloat(amount) * 1000
      } else {
        const isNegative = parseFloat(amount) < 0
        const url = new URL("https://api.exchangerate.host/convert")
        url.searchParams.append("from", currencySelection.iso_code)
        url.searchParams.append("to", transactionOptions.currency.iso_code)
        url.searchParams.append("amount", Math.abs(parseFloat(amount)).toString())
        url.searchParams.append("date", date.toISODate())
        const response = (await axios.get<{result: number}>(url.toString())).data
        convertedAmount = Math.floor(response.result * 1000)
        if (isNegative) {
          convertedAmount = -convertedAmount
        }
      }
    } catch(err) {
      console.log(err);
      setResponse(null);
      setErrorMessage(
        'A Currency Conversion Error has Occured. Please reach out to admin@bmoore.dev'
      );
      setSubmitting(false);
      return
    }

    try {
      const response = await api.transactions.createTransaction('default', {
        transaction: {
          account_id: account.id,
          date: date.toISODate(),
          amount: convertedAmount,
          payee_id: payeeId,
          payee_name: payeeName,
          category_id: category.id,
        },
      });
      setResponse(response);
      setErrorMessage(null);
      setPayee(null);
      setCategory(null);
      setAmount('');
    } catch (err) {
      console.log(err);
      setResponse(null);
      setErrorMessage(
        'An Error has Occured. Please reach out to admin@bmoore.dev'
      );
    }
    setSubmitting(false);
  };

  if (error || !transactionOptions) {
    return (
      <Container>
        {JSON.stringify(error, null, 2)}
        <Typography my={2} variant='h4' color='error'>
          Error
        </Typography>
        <Typography>
          An unknown error has occured. Please reach out to{' '}
          <a href='mailto:admin@bmoore.dev'>admin@bmoore.dev</a> for support.
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      <Box width='100%' position='relative'>
        <Button
          sx={{ position: 'absolute', right: 3 }}
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </Box>
      <Container
        maxWidth='sm'
        sx={{
          minHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Stack spacing={3}>
          <Typography>Add a Transaction</Typography>
          <DatePicker
            disableFuture
            minDate={DateTime.now().minus({ years: 5 })}
            disabled={submitting}
            label='Date'
            value={date}
            onChange={(newDate) => setDate(newDate)}
            renderInput={(params) => <TextField {...params} />}
          />
          <Autocomplete
            disabled={submitting}
            options={transactionOptions.accounts}
            value={account}
            onChange={(event, value) => setAccount(value)}
            renderInput={(params) => <TextField {...params} label='Account' />}
          ></Autocomplete>
          <Box display="flex">
            <FormControl>
              <Select
                value={currencySelection?.iso_code}
                onChange={(event) =>
                  setCurrencySelection(
                    currencies.find(
                      (currency) =>
                        currency.iso_code === (event.target.value as string)
                    ) || null
                  )
                }
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.iso_code} value={currency.iso_code}>
                    {currency.currency_symbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              sx={{flexGrow: 1}}
              disabled={submitting}
              label='Amount'
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
              }}
              name='numberformat'
              InputProps={{
                // startAdornment: (
                //   <InputAdornment position='start'>$</InputAdornment>
                // ),
                inputComponent: NumberFormatCustom as any,
              }}
            />
          </Box>
          <Autocomplete
            disabled={submitting}
            freeSolo
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            autoHighlight
            options={transactionOptions.payees}
            value={payee}
            onChange={(event, newValue) => {
              if (typeof newValue !== 'string' && newValue?.inputValue) {
                setPayee(newValue.inputValue);
              } else {
                setPayee(newValue);
              }
            }}
            filterOptions={(options, params) => {
              const filtered = payeeFilter(options, params);
              const { inputValue } = params;
              const isExisting = options.some(
                (option) => inputValue === option.label
              );
              if (inputValue !== '' && !isExisting) {
                filtered.push({
                  inputValue,
                  label: `Add "${inputValue}"`,
                });
              }
              return filtered;
            }}
            renderInput={(params) => <TextField {...params} label='Payee' />}
          />
          <Autocomplete
            disabled={submitting}
            options={transactionOptions.categories}
            value={category}
            onChange={(event, value) => setCategory(value)}
            groupBy={(option) => option.groupName}
            renderInput={(params) => <TextField {...params} label='Category' />}
          ></Autocomplete>
          <Button
            disabled={submitting}
            onClick={handleSubmit}
            variant='contained'
          >
            Add Transaction
          </Button>
          {errorMessage && (
            <Typography color='error'>{errorMessage}</Typography>
          )}
          {response && (
            <Typography color='success'>Transaction Added</Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
};
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

export default Home;

import '../styles/globals.css'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { SessionProvider } from "next-auth/react"
import type { AppProps } from 'next/app'
import Head from 'next/head';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';


function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <Head>
          <title>
            YNAB Currencty Converter
          </title>
        </Head>
        <Component {...pageProps} />
      </LocalizationProvider>
    </SessionProvider>
  )
}

export default MyApp

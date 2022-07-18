import type { NextPage } from 'next'

export function getStaticProps() {
    return {
        props: {
            clientId: process.env.CLIENT_ID,
            redirectURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api/callback' : 'https://ynab.bmoore.dev/api/callback'
        }
    }
}

const Login: NextPage<{clientId: string, redirectURL: string}> = ({clientId, redirectURL}) => {

    function authorizeWithYNAB(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        e.preventDefault();
        console.log(clientId)
        const uri = `https://app.youneedabudget.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectURL}&response_type=code`;
        location.replace(uri);
    }

    return (
        <div>
            <p>Log in to ynab</p>
            <button onClick={(e) => authorizeWithYNAB(e)}>Login</button>
        </div>
    )
}

export default Login

import Web3 from 'web3'
import { useState } from 'react'

import { Alert, AlertTitle } from '@material-ui/lab'
import {
    Container,
    Grid,
    ButtonGroup,
    Button,
    CircularProgress,
    LinearProgress,
    TextField,
    Paper,
} from '@material-ui/core'
import { useMediaQuery } from '@material-ui/core'

import bnb_logo from './bnb_logo.svg'
import busd_logo from './busd-logo.svg'
import MetamaskSVG from './MetamaskSVG.js'
import BscSVG from './BscSVG.js'
import DRCsvg from './logo.js'

import DRCSeller from './DRCSeller.json'
import ERC20 from './IERC20.json'
import Aggregator from './AggregatorV3Interface.json'

const activeNetwork = 56 //97
let web3, drcseller, busdContract, aggregator, rate
const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
const aggregatorAddress = "0x87Ea38c9F24264Ec1Fff41B04ec94a97Caf99941"
// const busdAddress ="0xE0dFffc2E01A7f051069649aD4eb3F518430B6a4" // teestnet
// const aggregatorAddress = "0x0630521aC362bc7A19a4eE44b57cE72Ea34AD01c" //testnet

const Metamask = () => {
    const [account, setAccount] = useState(0)
    const [chainID, setChainID] = useState(0)
    const [sold, setSold] = useState(0)
    const [end, setEnd] = useState(false)
    const [bnbbal, setBnbbal] = useState(0)
    const [busdbal, setBusdbal] = useState(0)
    const [bnbtext, setBnbtext] = useState(0)
    const [busdtext, setBusdtext] = useState(0)
    const [txhash, setTxhash] = useState(0)
    const [error, setError] = useState(false)
    const [bnbusd, setBnbusd] = useState(0)
    const [drcbnb, setDRCbnb] = useState(0)
    const [drcbusd, setDRCbusd] = useState(0)
    // const [vButton, setVButton] = useState(false)
    // setVButton(useMediaQuery("(min-width:800px)"))
    const ourMediaQuery = useMediaQuery('(min-width:800px)')
    // setVButton(ourMediaQuery)

    async function addmetaprovider() {
        web3 = new Web3(window.ethereum)
        const chain = await web3.eth.getChainId()
        console.log(chain)
        setChainID(chain)
        if (chain === activeNetwork) {
            await getAccount()
        }
    }

    async function addbcwprovider() {
        web3 = new Web3(window.BinanceChain)
        const chain = await web3.eth.getChainId()
        console.log(chain)
        setChainID(chain)
        if (chain === activeNetwork) {
            await getAccount()
        }
    }

    async function getAccount() {
        const accounts = await web3.eth.requestAccounts()
        console.log(accounts[0])
        setAccount(accounts[0])
        const bnbBalance = (await web3.eth.getBalance(accounts[0])) / 10 ** 18
        console.log(bnbBalance)
        setBnbbal(bnbBalance.toFixed(4))
        busdContract = new web3.eth.Contract(
            ERC20.abi,
            busdAddress
        )
        let busdBalance = (await busdContract.methods.balanceOf(accounts[0]).call()) / 10 ** 18
        console.log(busdBalance)
        setBusdbal(busdBalance.toFixed(4))
        drcseller = new web3.eth.Contract(
            DRCSeller.abi,
            DRCSeller.networks[activeNetwork].address,
        )
        let tokensSold = await drcseller.methods.tokensSold().call()
        setSold(parseFloat(tokensSold) * 10 ** -9)
        let ended = await drcseller.methods.saleEnded().call()
        setEnd(ended)
        rate = await drcseller.methods.rate().call()
        console.log(tokensSold, ended, rate)
        aggregator = new web3.eth.Contract(
            Aggregator.abi,
            aggregatorAddress
        )
        let bprice = await aggregator.methods.latestAnswer().call()
        setBnbusd((1 / (bprice * 10 ** -18)).toFixed(4))
        console.log((1 / (bprice * 10 ** -18)).toFixed(4))
        // let bprice = await fetch(
        //     'https://api.coingecko.com/api/v3/coins/binancecoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false',
        // )
        // let bnbprice = await bprice.json()
        // console.log(bnbprice.market_data.current_price.usd)
        // setBnbusd(bnbprice.market_data.current_price.usd)
    }

    function bnbChange(event) {
        let value = event.target.value
        setBnbtext(value)
        setDRCbnb((value * bnbusd * rate).toFixed(4))
    }

    function busdChange(event) {
        let value = event.target.value
        setBusdtext(value)
        setDRCbusd((value * rate).toFixed(4))
    }

    async function buyDRCwithBNB() {
        try {
            if (bnbtext === 0) {
                throw new Error({ "message": "Cannot Buy 0 DRC" })
            }
            let sold = await drcseller.methods
                .buyDRCwithBNB()
                .send({ from: account, value: web3.utils.toWei(bnbtext.toString()), gas: "200000", gasPrice: "10000000000" })
            setError(false)
            setTxhash(sold['transactionHash'])
            console.log(txhash)
            await getAccount()
        } catch (error) {
            setError(error)
            console.error(error)
        }
    }

    async function buyDRCwithBUSD() {
        try {
            if (busdtext === 0) {
                throw new Error({ "message": "Cannot Buy 0 DRC" })
            }
            let allowed = await busdContract.methods.allowance(account, DRCSeller.networks[activeNetwork].address).call()
            // console.log((web3.utils.fromWei(allowed) * 10 ** 18) >= parseInt(web3.utils.toWei(busdtext.toString())))
            if ((web3.utils.fromWei(allowed) * 10 ** 18) >= parseInt(web3.utils.toWei(busdtext.toString()))) {
                let sold = await drcseller.methods
                    .buyDRCwithBUSD(web3.utils.toWei(busdtext.toString()))
                    .send({ from: account, gas: "200000", gasPrice: "10000000000" })
                setError(false)
                setTxhash(sold['transactionHash'])
                console.log(txhash)
                await getAccount()
            }
            else {
                let approved = await busdContract.methods.approve(DRCSeller.networks[activeNetwork].address, web3.utils.toWei(busdtext.toString())).send({ from: account })
                setError({ message: "BUSD Approved Successfully" })
                setTxhash(approved['transactionHash'])
                console.log(txhash)
                await buyDRCwithBUSD()
            }
        } catch (error) {
            setError(error)
            console.error(error)
        }
    }

    async function adddrctoken() {
        const tokenAddress = "0x6976f83ec3940F1DFcb7bD2011a5652b73021533";
        const tokenSymbol = 'DRC';
        const tokenDecimals = 9;
        const tokenImage = "https://i.imgur.com/WDy7umf.png";

        try {
            // wasAdded is a boolean. Like any RPC method, an error may be thrown.
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20', // Initially only supports ERC20, but eventually more!
                    options: {
                        address: tokenAddress, // The address that the token is at.
                        symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                        decimals: tokenDecimals, // The number of decimals in the token
                        image: tokenImage, // A string url of the token logo
                    },
                },
            });

            if (wasAdded) {
                console.log('Thanks for your interest!');
            } else {
                console.log('Your loss!');
            }
        } catch (error) {
            console.log(error);
        }

    }

    if (
        typeof window.ethereum !== 'undefined' ||
        typeof window.BinanceChain !== 'undefined'
    ) {
        if (end) {
            return (
                <Grid container justify="center" align="center">
                    <Alert severity="success">
                        <AlertTitle>PreSale Ended</AlertTitle>
                    </Alert>
                </Grid>
            )
        }
        else if (
            // account !== 0 &&
            // account !== undefined &&
            chainID !== activeNetwork &&
            chainID !== 0
        ) {
            return (
                <Grid container item justify="center" align="center">
                    <Alert severity="error">
                        <AlertTitle>Not Supported Network({chainID}). Switch to BSC Mainnet</AlertTitle>
                    </Alert>
                </Grid>
            )
        }
        else if (account === 0 || account === undefined) {
            return (
                <Container align="center">
                    <ButtonGroup
                        orientation={ourMediaQuery ? `horizontal` : `vertical`}
                        variant="contained"
                        color="primary"
                        aria-label="text primary button group"
                    >
                        <Button onClick={addmetaprovider} startIcon={<MetamaskSVG />}>
                            Metamask
                        </Button>
                        <Button onClick={addbcwprovider} startIcon={<BscSVG />}>
                            Binance Chain Wallet
                        </Button>
                        <Button onClick={adddrctoken} startIcon={<DRCsvg />}>
                            Add DRC to Metamask
                        </Button>
                    </ButtonGroup>
                </Container>
            )
        } else if (
            account !== 0 &&
            account !== undefined &&
            chainID === activeNetwork
        ) {
            return (
                <Grid
                    container
                    item
                    xl={12}
                    direction="row"
                    spacing={4}
                    justify="center"
                    alignItems="center"
                >
                    <Paper elevation={24} style={{ backgroundColor: "white", width: "100%", padding: "20px", margin: "20px" }}>
                        <Grid container direction="column" align="center">
                            {sold >= 0 ? (
                                <Grid item>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(sold / (4 * 10 ** 8))}
                                        style={{ height: '25px' }}
                                    />
                                    <h4 style={{ color: "black" }}>{(sold*10**-6).toFixed(4)} Million DRC Sold</h4>
                                </Grid>
                            ) : (
                                ''
                            )
                            }
                            <Grid item>Current BNB/USD Price: ${bnbusd}</Grid>
                            <Grid item>Balance: {bnbbal} BNB / {busdbal} BUSD</Grid>
                            <Grid item>1 BUSD = 1,000,000 DRC + 30% Bonus</Grid>
                        </Grid>
                        <Grid container direction="row" spacing={4} style={{ padding: "10px" }}>
                            <Grid
                                container
                                item
                                direction="column"
                                md={6}
                                spacing={3}
                                justify="center"
                                alignItems="center"
                            >
                                <Grid item>
                                    <img src={bnb_logo} alt="BNB" height="100" width="100" />
                                </Grid>
                                <Grid item>
                                    {drcbnb} DRC
                                </Grid>
                                <Grid item>
                                    <TextField
                                        id="outlined-number"
                                        label="BNB"
                                        type="number"
                                        variant="outlined"
                                        value={bnbtext}
                                        onChange={bnbChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        color="primary"
                                        onClick={buyDRCwithBNB}
                                    >
                                        Buy with BNB
                                    </Button>
                                </Grid>
                            </Grid>
                            <Grid
                                container
                                item
                                direction="column"
                                md={6}
                                spacing={3}
                                justify="center"
                                alignItems="center"
                            >
                                <Grid item>
                                    <img src={busd_logo} alt="BUSD" height="100" width="100" />
                                </Grid>
                                <Grid item>
                                    {drcbusd} DRC
                                </Grid>
                                <Grid item>
                                    <TextField
                                        id="outlined-number"
                                        label="BUSD"
                                        type="number"
                                        variant="outlined"
                                        value={busdtext}
                                        onChange={busdChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        color="primary"
                                        onClick={buyDRCwithBUSD}
                                    >
                                        Buy with BUSD
                                    </Button>
                                </Grid>
                            </Grid>
                            <Grid
                                container
                                item
                                xs={12}
                                spacing={2}
                                justify="center"
                                alignItems="center"
                            >

                            </Grid>
                        </Grid>
                        <Grid
                            container
                            direction="row"
                            alignItems="center"
                            justify="center"
                            spacing={5}
                        >

                            <Grid item>
                                {error ? (
                                    <Alert severity="error">{error["message"]}</Alert>
                                ) : txhash !== 0 ? (
                                    <Alert severity="success">
                                        Bought DRC Successfully,{' '}
                                        <a
                                            href={'https://bscscan.com/tx/' + txhash}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            check here
                                        </a>
                                    </Alert>
                                ) : (
                                    ''
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            )
        } else {
            return (
                <Container>
                    <CircularProgress />
                </Container>
            )
        }
    } else {
        return (
            <Container align="center">
                <Button
                    color="primary"
                    variant="contained"
                    target="_blank"
                    href="https://docs.binance.org/wallets/bsc-wallets.html"
                >
                    Install BSC Supported Wallet
                </Button>
            </Container>
        )
    }

}

export default Metamask;
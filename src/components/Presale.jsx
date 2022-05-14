import {
    Alert,
    AlertTitle,
    Button,
    ButtonGroup,
    Container,
    Grid,
    Paper,
    Typography,
} from "@mui/material"
import { useState } from "react"
import Web3 from "web3"

import MetamaskSVG from "../assests/MetamaskSVG.js"
import BscSVG from "../assests/BscSVG.js"

import CIPSeller from "../assests/json/CIPSeller.json"
import ERC20 from "../assests/json/IERC20.json"
import Aggregator from "../assests/json/AggregatorV3Interface.json"

import { PresaleContent } from "./PresaleContent"

let web3, cipseller, busdContract, aggregator
export const Presale = () => {
    const activeNetwork = 56 // 97
    const busdAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    const aggregatorAddress = "0x87Ea38c9F24264Ec1Fff41B04ec94a97Caf99941"
    // const busdAddress = "0xE0dFffc2E01A7f051069649aD4eb3F518430B6a4" // testnet
    // const aggregatorAddress = "0x0630521aC362bc7A19a4eE44b57cE72Ea34AD01c" //testnet

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
    const [cipbnb, setCIPbnb] = useState(0)
    const [cipbusd, setCIPbusd] = useState(0)
    const [rate, setRate] = useState(0)

    let presaleData = {
        sold,
        bnbbal,
        busdbal,
        error,
        cipbnb,
        cipbusd,
        bnbusd,
        bnbtext,
        busdtext,
        bnbChange,
        busdChange,
        buyCIPwithBNB,
        buyCIPwithBUSD,
        txhash,
    }

    // const ourMediaQuery = useMediaQuery("(min-width:800px)")

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
        busdContract = new web3.eth.Contract(ERC20.abi, busdAddress)
        let busdBalance =
            (await busdContract.methods.balanceOf(accounts[0]).call()) /
            10 ** 18
        console.log(busdBalance)
        setBusdbal(busdBalance.toFixed(4))
        cipseller = new web3.eth.Contract(
            CIPSeller.abi,
            CIPSeller.networks[activeNetwork].address
        )
        let tokensSold = await cipseller.methods.tokensSold().call()
        setSold(parseFloat(tokensSold) * 10 ** -5)
        let ended = await cipseller.methods.saleEnded().call()
        setEnd(ended)
        let _rate = await cipseller.methods.rate().call()
        setRate(_rate)
        console.log(tokensSold, ended, rate)
        aggregator = new web3.eth.Contract(Aggregator.abi, aggregatorAddress)
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
        setCIPbnb((((value * bnbusd) / rate) * 100).toFixed(4))
    }

    function busdChange(event) {
        let value = event.target.value
        setBusdtext(value)
        setCIPbusd(((value / rate) * 100).toFixed(4))
    }

    async function buyCIPwithBNB() {
        try {
            if (bnbtext === 0) {
                throw new Error({ message: "Cannot Buy 0 CIP" })
            }
            let sold = await cipseller.methods.buyCIPwithBNB().send({
                from: account,
                value: web3.utils.toWei(bnbtext.toString()),
                gas: "300000",
                gasPrice: "10000000000",
            })
            setError(false)
            setTxhash(sold["transactionHash"])
            console.log(txhash)
            await getAccount()
        } catch (error) {
            setError(error)
            console.error(error)
        }
    }

    async function buyCIPwithBUSD() {
        try {
            if (busdtext === 0) {
                throw new Error({ message: "Cannot Buy 0 CIP" })
            }
            let allowed = await busdContract.methods
                .allowance(account, CIPSeller.networks[activeNetwork].address)
                .call()
            // console.log((web3.utils.fromWei(allowed) * 10 ** 18) >= parseInt(web3.utils.toWei(busdtext.toString())))
            if (
                web3.utils.fromWei(allowed) * 10 ** 18 >=
                parseInt(web3.utils.toWei(busdtext.toString()))
            ) {
                let sold = await cipseller.methods
                    .buyCIPwithBUSD(web3.utils.toWei(busdtext.toString()))
                    .send({
                        from: account,
                        gas: "300000",
                        gasPrice: "10000000000",
                    })
                setError(false)
                setTxhash(sold["transactionHash"])
                console.log(txhash)
                await getAccount()
            } else {
                let approved = await busdContract.methods
                    .approve(
                        CIPSeller.networks[activeNetwork].address,
                        web3.utils.toWei(busdtext.toString())
                    )
                    .send({ from: account })
                setError({ message: "BUSD Approved Successfully" })
                setTxhash(approved["transactionHash"])
                console.log(txhash)
                await buyCIPwithBUSD()
            }
        } catch (error) {
            setError(error)
            console.error(error)
        }
    }

    async function addciptoken() {
        const tokenAddress = "0xc2c39AaF68f5CF8B54684338dcBA70a8365E40FA"
        const tokenSymbol = "CIP"
        const tokenDecimals = 5
        const tokenImage = "https://bscscan.com/token/images/cipprotocol_32.png"

        try {
            // wasAdded is a boolean. Like any RPC method, an error may be thrown.
            const wasAdded = await window.ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20", // Initially only supports ERC20, but eventually more!
                    options: {
                        address: tokenAddress, // The address that the token is at.
                        symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                        decimals: tokenDecimals, // The number of decimals in the token
                        image: tokenImage, // A string url of the token logo
                    },
                },
            })

            if (wasAdded) {
                console.log("Thanks for your interest!")
            } else {
                console.log("Your loss!")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const ConnectButtons = () => (
        <ButtonGroup
            // orientation={ourMediaQuery ? `horizontal` : `vertical`}
            orientation="vertical"
            variant="contained"
            color="primary"
            aria-label="text primary button group"
            sx={{
                padding: "10px",
                margin: "10px",
            }}
        >
            <Button onClick={addmetaprovider} startIcon={<MetamaskSVG />}>
                Metamask
            </Button>
            <Button onClick={addbcwprovider} startIcon={<BscSVG />}>
                Binance Chain Wallet
            </Button>
            <Button
                onClick={addciptoken}
                startIcon={
                    <img src="/ciplogo.png" alt="CIP Logo" width="32px" />
                }
            >
                Add CIP to Metamask
            </Button>
        </ButtonGroup>
    )

    const NoMetamask = () => (
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

    const PresaleEnd = () => (
        <Grid container justify="center" align="center">
            <Alert severity="success">
                <AlertTitle>PreSale Ended</AlertTitle>
            </Alert>
        </Grid>
    )

    const NotSupportedNetwork = () => (
        <Grid container item justify="center" align="center">
            <Alert severity="error">
                <AlertTitle>
                    Not Supported Network({chainID}). Switch to BSC Mainnet.
                </AlertTitle>
            </Alert>
        </Grid>
    )

    return (
        <main>
            <Paper
                sx={{
                    padding: "1rem",
                    margin: "1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(12,12,12,0.5)",
                    textAlign: "center",
                    color: "white",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    letterSpacing: "0.1rem",
                    border: "1px solid rgba(0,0,0,0.1)",
                    boxShadow: "0px 0px 10px rgba(238,45,15,0.1)",
                }}
            >
                <h1>Private Sale</h1>
                <Grid
                    container
                    spacing={3}
                    justifyContent="space-evenly"
                    alignItems="center"
                >
                    <Grid
                        item
                        sm={12}
                        lg={6}
                        sx={{
                            padding: "20px",
                        }}
                    >
                        <img src="/ciplogo.png" alt="ciplogo" width="300px" />
                        <Typography variant="h4">Round 1 (Live)</Typography>
                        <Typography variant="h5">
                            10,000 CIP @ 2$/CIP
                        </Typography>
                        <Typography variant="h4">Round 2</Typography>
                        <Typography variant="h5">
                            10,000 CIP @ 2.25$/CIP
                        </Typography>
                        <Typography variant="h4">Round 3</Typography>
                        <Typography variant="h5">
                            10,000 CIP @ 2.50$/CIP
                        </Typography>
                    </Grid>
                    <Grid item sm={12} lg={6}>
                        {window.ethereum || window.BinanceChain ? (
                            end ? (
                                <PresaleEnd />
                            ) : chainID !== activeNetwork && chainID !== 0 ? (
                                <NotSupportedNetwork />
                            ) : account ? (
                                <PresaleContent {...presaleData} />
                            ) : (
                                <ConnectButtons />
                            )
                        ) : (
                            <NoMetamask />
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </main>
    )
}

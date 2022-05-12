import { AppBar, Toolbar, Typography } from "@mui/material"

export const Navbar = () => {
    return (
        <AppBar position="static" color="transparent">
            <Toolbar>
                <img src="/CIP-3.0logo.png" alt="logo" width="286px" height="66px" className="navbar--logo"/>
                <Typography variant="h3" component="div" className="navbar--title">
                    Presale
                </Typography>
                
            </Toolbar>
        </AppBar>
    )
}

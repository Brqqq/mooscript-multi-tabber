/*global chrome*/
import React from "react";
import Play from "./icons/play.svg";
import Pause from "./icons/pause.svg";

const AccountList = (props) => {
    const [accounts, setAccounts] = React.useState({});

    const onAccountListChange = (changes) => {
        if (changes.accounts != null) {
            setAccounts(changes.accounts.newValue);
        }
    }

    React.useEffect(() => {
        chrome.storage.sync.onChanged.addListener(onAccountListChange);

        return () => {
            chrome.storage.sync.onChanged.removeListener(onAccountListChange);
        };
    }, [onAccountListChange]);

    React.useEffect(() => {
        chrome.storage.sync.get("accounts", ({ accounts }) => {
            setAccounts(accounts || {});
        })
    }, []);

    const onRemove = (email) => {
        chrome.extension.getBackgroundPage().removeAccount(email);
    }

    const onLogin = async (email) => {
        await chrome.extension.getBackgroundPage().useAuthToken(email);
        window.open("https://www.mobstar.cc");
    }

    const setActive = (email, isActive) => {
        chrome.extension.getBackgroundPage().updateAccount(email, {
            active: isActive
        });
    }

    const Name = ({ account }) => {
        if (account.invalidPassword) {
            return <span style={{ color: "red" }}>Incorrect password!</span>
        } else if (account.isDead) {
            return <>
                {account.name}
                <span style={{ color: "red" }}>(DEAD)</span>
            </>
        } else if(!account.name) {
            return <>Loading...</>
        }

        return <>{account.name}</>;
    }

    return <>
        <h3>Accounts</h3>
        <table>
            <thead>
                <tr>
                    <th>Login</th>
                    <th>Start</th>
                    <th>Script status</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Rank</th>
                    <th>Cash</th>
                    <th>Bullets</th>
                    <th>Country</th>
                    <th>Lead</th>
                    <th>Crew</th>
                    <th>Paying days</th>
                    <th>Honor</th>
                    <th>Credits</th>
                    <th>Remove</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(accounts).map(email => {
                    const account = accounts[email];
                    return <tr key={email}>
                        <td>
                            <button onClick={e => {
                                e.preventDefault();
                                onLogin(email);
                            }}>
                                Login
                            </button>
                        </td>
                        <td>
                            {account.active && <a href="#" alt="Pause script" onClick={() => setActive(email, false)}><img src={Pause} /></a>}
                            {!account.active && <a href="#" alt="Start script" onClick={() => setActive(email, true)}><img src={Play} /></a>}
                        </td>
                        <td>
                            {account.active && "Running..."}
                            {!account.active && "Paused"}
                        </td>
                        <td>{email}</td>
                        <td><Name account={account} /></td>
                        <td>{account.rank}</td>
                        <td>€ {account.cash && account.cash.toLocaleString()}</td>
                        <td>{account.bullets}</td>
                        <td>{account.country}</td>
                        <td>{typeof account.lead === "number" ? `${account.lead.toLocaleString()} kg` : account.lead}</td>
                        <td>{account.crew}</td>
                        <td>{account.payingDays}</td>
                        <td>{account.honor}</td>
                        <td>{account.credits}</td>
                        <td>
                            <button onClick={e => {
                                e.preventDefault();
                                onRemove(email);
                            }}>
                                Remove
                            </button>
                        </td>
                    </tr>
                })}
            </tbody>
        </table>
    </>;
};

export default AccountList;
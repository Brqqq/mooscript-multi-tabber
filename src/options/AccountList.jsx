/*global chrome*/
import React from "react";
import Play from "./icons/play.svg";
import Pause from "./icons/pause.svg";
import ConfigModal from "./ConfigModal";
import Rodal from 'rodal';
import Options from "./Options";

const AccountList = (props) => {
    const [accounts, setAccounts] = React.useState({});
    const [configuringAccount, setConfiguringAccount] = React.useState(undefined);

    const onAccountListChange = (changes) => {
        if (changes.accounts != null) {
            setAccounts(changes.accounts.newValue);
        }
    }

    React.useEffect(() => {
        chrome.storage.local.onChanged.addListener(onAccountListChange);

        return () => {
            chrome.storage.local.onChanged.removeListener(onAccountListChange);
        };
    }, [onAccountListChange]);

    React.useEffect(() => {
        chrome.storage.local.get("accounts", ({ accounts }) => {
            setAccounts(accounts || {});
        })
    }, []);

    const onRemove = (email) => {
        chrome.extension.getBackgroundPage().removeAccount(email);
    }

    const onLogin = async (e, email) => {
        if (accounts[email].active) {
            e.preventDefault();
            try {
                await chrome.extension.getBackgroundPage().useAuthToken(email);
            } catch (e) {
                alert("Please wait a moment and try again in a second. The script has to log you in first.")
                return;
            }

            window.open("https://www.mobstar.cc");
        }
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
        } else if (!account.name) {
            return <>Loading...</>
        }

        return <>{account.name}</>;
    }

    return <>
        <Options accounts={accounts} />
        <h3>Accounts</h3>
        <table>
            <thead>
                <tr>
                    <th>Login</th>
                    <th>Start</th>
                    <th>Script status</th>
                    <th>Configure</th>
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
                            <form method="post" action="https://www.mobstar.cc/main/login.php?mooscript=true" target="mobstar" onSubmit={(e) => onLogin(e, email)}>
                                <input type="hidden" name="email" value={email} />
                                <input type="hidden" name="password" value={account.password} />
                                <button type="submit">
                                    Login
                                </button>
                            </form>
                        </td>
                        <td>
                            {account.active && <a href="#" alt="Pause script" onClick={() => setActive(email, false)}><img src={Pause} /></a>}
                            {!account.active && <a href="#" alt="Start script" onClick={() => setActive(email, true)}><img src={Play} /></a>}
                        </td>
                        <td>
                            {account.active && "Running..."}
                            {!account.active && "Paused"}
                        </td>
                        <td>
                            <a href="#" onClick={() => setConfiguringAccount({ email, account })}>Configure</a>
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
        {/* We dont use the `visibility` because we want an unmountOnExit behavior that doesn't exist */}
        {
            configuringAccount != null && <Rodal
                visible
                onClose={() => setConfiguringAccount(undefined)}
                height={350}
            >
                <ConfigModal
                    account={configuringAccount}
                    onClose={() => setConfiguringAccount(undefined)}
                />
            </Rodal>
        }
    </>;
};

export default AccountList;
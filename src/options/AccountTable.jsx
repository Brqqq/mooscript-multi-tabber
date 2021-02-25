import React from "react";
import Play from "./icons/play.svg";
import Pause from "./icons/pause.svg";
import { sortAccounts } from "./sorting";

const Name = ({ account }) => {
    if (account.invalidPassword) {
        return <span style={{ color: "red" }}>Incorrect password!</span>
    } else if (account.dead) {
        return <>
            {account.name}
            <span style={{ color: "red" }}>(DEAD)</span>
        </>
    } else if (!account.name) {
        return <>Loading...</>
    }

    return <>{account.name}</>;
}


const AccountTable = (props) => {
    const [sortProp, setSortProp] = React.useState("email");
    const [isAsc, setIsAsc] = React.useState(true);
    const {
        onRemove,
        accounts,
        onScriptActiveChange,
        setConfiguringAccount,
        onLogin
    } = props;

    let accountList = Object.keys(accounts).map(email => ({
        ...accounts[email],
        email
    }));

    const sortOnProp = (propName) => {
        let shouldBeAsc = true;
        if (sortProp === propName) {
            if (isAsc === true) shouldBeAsc = false;
            else if (isAsc === false) shouldBeAsc = undefined;
            else if (isAsc == null) shouldBeAsc = true;
        }

        setSortProp(propName);
        setIsAsc(shouldBeAsc);
    }

    let sortedAccounts = [...accountList];
    if (isAsc != null) {
        sortAccounts(sortedAccounts, sortProp, isAsc);
    }

    console.log(sortProp, isAsc);

    const SortButton = ({ prop, children }) => {
        let ascText = "";
        if (prop === sortProp) {
            if (isAsc === true) ascText = "(asc)";
            else if (isAsc === false) ascText = "(desc)"
        }
        return <button className="link-button" onClick={() => sortOnProp(prop)}>
            {children} {ascText}
        </button>
    }
    return <table>
        <thead>
            <tr>
                <th></th>
                <th>Login</th>
                <th>Start</th>
                <th>Script status</th>
                <th>Configure</th>
                <th><SortButton prop="email">Email</SortButton></th>
                <th><SortButton prop="name">Name</SortButton></th>
                <th><SortButton prop="rank">Rank</SortButton></th>
                <th><SortButton prop="cash">Cash</SortButton></th>
                <th><SortButton prop="bullets">Bullets</SortButton></th>
                <th><SortButton prop="country">Country</SortButton></th>
                <th><SortButton prop="lead">Lead</SortButton></th>
                <th><SortButton prop="crew">Crew</SortButton></th>
                <th><SortButton prop="payingDays">Paying days</SortButton></th>
                <th><SortButton prop="honor">Honor</SortButton></th>
                <th><SortButton prop="credits">Credits</SortButton></th>
                <th>Remove</th>
            </tr>
        </thead>
        <tbody>
            {sortedAccounts.map((account, idx) => {
                const { email } = account;
                return <tr key={email}>
                    <td>
                        {idx + 1}
                    </td>
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
                        {account.active && <button className="link-button" onClick={() => onScriptActiveChange(email, false)}><img src={Pause} /></button>}
                        {!account.active && <button className="link-button" onClick={() => onScriptActiveChange(email, true)}><img src={Play} /></button>}
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
}

export default AccountTable;
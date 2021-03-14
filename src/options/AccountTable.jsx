import React from "react";
import Play from "./icons/play.svg";
import Pause from "./icons/pause.svg";
import Buy from "./icons/buy.svg"
import Factory from "./icons/factory-pollution.svg"
import Handcuffs from "./icons/handcuffs.svg"
import Marijuana from "./icons/marijuana.svg"
import Search from "./icons/search-line.svg"
import SedanCar from "./icons/sedan-car.svg"
import Sold from "./icons/sold.svg"
import Thief from "./icons/thief.svg"
import Plane from "./icons/plane.svg"
import BanLine from "./icons/ban-line.svg"
import Ascending from "./icons/ascending.svg"
import Descending from "./icons/descending.svg"
import DefaultSort from "./icons/sort-result.svg"

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

const ConfigIcon = ({ email, title, account, svg, propName }) => {
    const onPropToggle = () => {
        const newValue = account[propName] == null || account[propName] === false;

        const newAccount = {
            ...account,
            [propName]: newValue
        };

        chrome.extension.getBackgroundPage().updateAccount(email, newAccount);
    }

    return <button className="link-button" onClick={() => onPropToggle(email, propName)}>
        <img title={title} className="icon" src={svg} />
        {!account[propName] && <img title={title} className="icon layered" src={BanLine} />}
    </button>
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

    const SortButton = ({ prop, children }) => {
        let sortIcon = DefaultSort;
        if (prop === sortProp) {
            if (isAsc === true) sortIcon = Ascending;
            else if (isAsc === false) sortIcon = Descending;
        }
        //return <span style={{ display: "flex" }}>
        return <button style={{ width: "100%"}} className="link-button" onClick={() => sortOnProp(prop)}>
            <span style={{ display: "flex" }}>
                {children}
                <span style={{ flexGrow: 1 }}></span>
                <img className="small-icon" src={sortIcon} />
            </span>
        </button>
        //</span>
    }

    return <table id="accounts">
        <thead>
            <tr>
                <th></th>
                <th>Update</th>
                <th>Login</th>
                <th>Start</th>
                <th>Script status</th>
                <th><SortButton prop="enableJailbusting"><img title="Jail busting" className="icon" src={Handcuffs} /></SortButton></th>
                <th><SortButton prop="enableSmallCrime"><img title="Small crimes" className="icon" src={Thief} /></SortButton></th>
                <th><SortButton prop="enableGta"><img title="GTA" className="icon" src={SedanCar} /></SortButton></th>
                <th><SortButton prop="enableCarSelling"><img title="Car seller" className="icon" src={Sold} /></SortButton></th>
                <th><SortButton prop="enableItemBuying"><img title="Item buyer" className="icon" src={Buy} /></SortButton></th>
                <th><SortButton prop="enableDrugRunning"><img title="Drug dealing" className="icon" src={Marijuana} /></SortButton></th>
                <th><SortButton prop="enableDrugRunFinding"><img title="Drug run finding" className="icon" src={Search} /></SortButton></th>
                <th><SortButton prop="enableBuyingPbf"><img title="Buy personal bullet factory" className="icon" src={Factory} /></SortButton></th>
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
                        <button
                            title="Tries to update your account info in this table as soon as possible"
                            onClick={() => props.onAddToAccountUpdateList(email)}
                        >
                            Update
                        </button>
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
                    <td className="composite-icon">
                        <ConfigIcon title="Jail busting" svg={Handcuffs} propName="enableJailbusting" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Small crimes" svg={Thief} propName="enableSmallCrime" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="GTA" svg={SedanCar} propName="enableGta" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Sell cars" svg={Sold} propName="enableCarSelling" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Buy items" svg={Buy} propName="enableItemBuying" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Sell drugs" svg={Marijuana} propName="enableDrugRunning" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Search drug run" svg={Search} propName="enableDrugRunFinding" email={email} account={account} />
                    </td>
                    <td className="composite-icon">
                        <ConfigIcon title="Personal bullet factory" svg={Factory} propName="enableBuyingPbf" email={email} account={account} />
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
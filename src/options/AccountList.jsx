/*global chrome*/
import React from "react";
import ConfigModal from "./ConfigModal";
import Rodal from 'rodal';
import Options from "./Options";
import AccountTable from "./AccountTable";
import AccountFilter from "./AccountFilter";
import { filterAccounts } from "./filterAccounts";

const AccountList = (props) => {
    const [accounts, setAccounts] = React.useState({});
    const [drugs, setDrugs] = React.useState({});
    const [showAccountConfig, setShowAccountConfig] = React.useState(false);
    const [filter, setFilter] = React.useState({
        name: "",
        crewName: "",
        value: ""
    });

    const onStorageChanges = (changes) => {
        if (changes.accounts != null) {
            setAccounts(changes.accounts.newValue);
        }
        if (changes.drugs != null) {
            setDrugs(changes.drugs.newValue);
        }
    }


    React.useEffect(() => {
        chrome.storage.local.onChanged.addListener(onStorageChanges);
        return () => {
            chrome.storage.local.onChanged.removeListener(onStorageChanges);
        };
    }, [onStorageChanges]);

    React.useEffect(() => {
        chrome.storage.local.get(["accounts", "drugs"], ({ accounts, drugs }) => {
            setAccounts(accounts || {});
            setDrugs(drugs || {});
        })
    }, []);

    const onRemove = (email) => {
        chrome.extension.getBackgroundPage().removeAccount(email);
    }

    const onAddToAccountUpdateList = (email) => {
        chrome.extension.getBackgroundPage().addAccountsToUpdateList([email]);
    }

    const setActive = (email, isActive) => {
        chrome.extension.getBackgroundPage().updateAccount(email, {
            active: isActive
        });
    }

    const onLogin = async (e, email) => {
        e.preventDefault();

        const loginResult = await chrome.extension.getBackgroundPage().login(email);

        if (!loginResult) {
            alert("There was an error with logging in your account. Maybe the password is incorrect or mobstar doesn't work?");
        }

    }

    const hasDrugRun = drugs?.run1 != null && drugs?.run2 != null;

    const filteredAccounts = filterAccounts(accounts, filter);

    const accountKeys = Object.keys(filteredAccounts);

    const totalCash = accountKeys.reduce((acc, curr) => {
        if (Number.isInteger(accounts[curr].cash)) {
            return acc + accounts[curr].cash;
        }

        return acc;
    }, 0);

    const onStartAll = () => {
        chrome.extension
            .getBackgroundPage()
            .updateAccounts(Object.keys(filteredAccounts), { active: true });
    }

    const onStopAll = () => {
        chrome.extension
            .getBackgroundPage()
            .updateAccounts(Object.keys(filteredAccounts), { active: false });
    }

    return <>
        <Options accounts={accounts} drugs={drugs} />
        {hasDrugRun && <h2>DR: {drugs.run1.country || "<unknown>"} -> {drugs.run2.country || "<unknown>"}</h2>}
        <h2>Total cash: € {totalCash.toLocaleString()}</h2>

        <AccountFilter
            filter={filter}
            onFilterChange={setFilter}
            onConfigureClick={() => setShowAccountConfig(true)}
            startAll={onStartAll}
            stopAll={onStopAll}
        />

        {accountKeys.length === 0 && <div>There are no accounts.</div>}
        {accountKeys.length > 0 &&
            <AccountTable
                onAddToAccountUpdateList={onAddToAccountUpdateList}
                onRemove={onRemove}
                accounts={filteredAccounts}
                onScriptActiveChange={setActive}
                onLogin={onLogin}
            />}

        {/* We dont use the `visibility` prop because we want an unmountOnExit behavior that doesn't exist */}
        {showAccountConfig && <Rodal
            visible
            onClose={() => setShowAccountConfig(false)}
            height={390}
        >
            <ConfigModal
                accounts={filteredAccounts}
                onClose={() => setShowAccountConfig(false)}
            />
        </Rodal>}
    </>;
};

export default AccountList;
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
        if (accounts[email].active) {
            e.preventDefault();
            try {
                await chrome.extension.getBackgroundPage().useAuthToken(email);
            } catch (e) {
                alert("Please wait a moment and try again in a second. The script has to log you in first.")
                return;
            }

            window.open("https://www.mobstar.cc", "mobstar");
        }
    }

    const hasDrugRun = drugs?.run1 != null && drugs?.run2 != null;
    const accountKeys = Object.keys(accounts);
    const totalCash = accountKeys.reduce((acc, curr) => {
        if (Number.isInteger(accounts[curr].cash)) {
            return acc + accounts[curr].cash;
        }

        return acc;
    }, 0);

    const filteredAccounts = filterAccounts(accounts, filter);

    return <>
        <Options accounts={accounts} drugs={drugs} />
        {hasDrugRun && <h2>DR: {drugs.run1.country || "<unknown>"} -> {drugs.run2.country || "<unknown>"}</h2>}
        <h2>Total cash: € {totalCash.toLocaleString()}</h2>
        
        {accountKeys.length === 0 && <div>You have no accounts on script.</div>}
        {accountKeys.length > 0 && <>
            <AccountFilter
                filter={filter}
                onFilterChange={setFilter}
                onConfigureClick={() => setShowAccountConfig(true)}
            />
            <AccountTable
                onAddToAccountUpdateList={onAddToAccountUpdateList}
                onRemove={onRemove}
                accounts={filteredAccounts}
                onScriptActiveChange={setActive}
                onLogin={onLogin}
            />
        </>}

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
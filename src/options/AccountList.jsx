/*global chrome*/
import React from "react";
import ConfigModal from "./ConfigModal";
import Rodal from 'rodal';
import Options from "./Options";
import AccountTable from "./AccountTable";

const AccountList = (props) => {
    const [accounts, setAccounts] = React.useState({});
    const [drugs, setDrugs] = React.useState({});
    const [configuringAccount, setConfiguringAccount] = React.useState(undefined);

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

            window.open("https://www.mobstar.cc");
        }
    }

    const hasDrugRun = drugs?.run1 != null && drugs?.run2 != null;
    const accountKeys = Object.keys(accounts);
    return <>
        <Options accounts={accounts} drugs={drugs} />
        {hasDrugRun && <h2>DR: {drugs.run1.country} -> {drugs.run2.country}</h2>}
        <h3>Accounts</h3>
        {accountKeys.length === 0 && <div>You have no accounts on script.</div>}
        {accountKeys.length > 0 && <AccountTable
            onRemove={onRemove}
            accounts={accounts}
            onScriptActiveChange={setActive}
            setConfiguringAccount={setConfiguringAccount}
            onLogin={onLogin}
        />}

        {/* We dont use the `visibility` prop because we want an unmountOnExit behavior that doesn't exist */}
        {configuringAccount != null && <Rodal
            visible
            onClose={() => setConfiguringAccount(undefined)}
            height={350}
        >
            <ConfigModal
                account={configuringAccount}
                onClose={() => setConfiguringAccount(undefined)}
            />
        </Rodal>}
    </>;
};

export default AccountList;
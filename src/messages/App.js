/*global chrome*/
import React from "react";
import './App.css';
import 'rodal/lib/rodal.css';
import Messages from "./Messages";
import Witnesses from './Witnesses';

function App() {
    const [accounts, setAccounts] = React.useState({});

    const onStorageChanges = (changes) => {
        if (changes.accounts != null) {
            setAccounts(changes.accounts.newValue);
        }
    }

    React.useEffect(() => {
        chrome.storage.local.onChanged.addListener(onStorageChanges);
        return () => {
            chrome.storage.local.onChanged.removeListener(onStorageChanges);
        };
    }, [onStorageChanges]);

    React.useEffect(() => {
        chrome.storage.local.get(["accounts"], ({ accounts }) => {
            setAccounts(accounts || {});
        });
    }, []);

    const [showWitnessesOnly, setShowWitnessesOnly] = React.useState(true);

    return (
        <div className="App">
            <div style={{ marginTop: 8 }}>
                <button onClick={() => window.location = "/index.html"}>Back to list</button>
            </div>
            <div style={{ marginTop: 8 }}>
                <input type="radio" checked={showWitnessesOnly} id="witnessonly" onChange={() => setShowWitnessesOnly(true)}></input>
                <label htmlFor="witnessonly">Show witnesses only</label>

                <input style={{ marginLeft: 8 }} type="radio" checked={!showWitnessesOnly} id="allmessages" onChange={() => setShowWitnessesOnly(false)}></input>
                <label htmlFor="allmessages">Show all messages</label>
            </div>
            {!showWitnessesOnly && <Messages accounts={accounts} />}
            {showWitnessesOnly && <Witnesses accounts={accounts} />}
        </div>
    );
}

export default App;

/*global chrome*/
import React from "react";
import './App.css';
import 'rodal/lib/rodal.css';
import Messages from "./Messages";
import Witnesses from './Witnesses';
import Detective from "./Detective";

function App() {
    const [accounts, setAccounts] = React.useState({});
    const [detective, setDetective] = React.useState(undefined);
    const onStorageChanges = (changes) => {
        if (changes.accounts != null) {
            setAccounts(changes.accounts.newValue);
        }
        if(changes.detective != null) {
            setDetective(changes.detective.newValue);
        }
    }

    React.useEffect(() => {
        chrome.storage.local.onChanged.addListener(onStorageChanges);
        return () => {
            chrome.storage.local.onChanged.removeListener(onStorageChanges);
        };
    }, [onStorageChanges]);

    React.useEffect(() => {
        chrome.storage.local.get(["accounts", "detective"], ({ accounts, detective }) => {
            setAccounts(accounts || {});
            setDetective(detective);
        });
    }, []);

    const [page, setPage] = React.useState("witness");

    return (
        <div className="App">
            <div style={{ marginTop: 8 }}>
                <button onClick={() => window.location = "/index.html"}>Back to list</button>
            </div>
            <div style={{ marginTop: 8 }}>
                <input type="radio" checked={page === "witness"} id="witnessonly" onChange={() => setPage("witness")}></input>
                <label htmlFor="witnessonly">Show witnesses only</label>

                <input style={{ marginLeft: 8 }} type="radio" checked={page === "messages"} id="allmessages" onChange={() => setPage("messages")}></input>
                <label htmlFor="allmessages">Show all messages</label>

                <input style={{ marginLeft: 8 }} type="radio" checked={page === "detective"} id="detective" onChange={() => setPage("detective")}></input>
                <label htmlFor="detective">Show detective</label>
            </div>
            {(page === "messages") && <Messages accounts={accounts} />}
            {(page === "witness") && <Witnesses accounts={accounts} />}
            {(page === "detective" && <Detective accounts={accounts} detective={detective} />)}
        </div>
    );
}

export default App;

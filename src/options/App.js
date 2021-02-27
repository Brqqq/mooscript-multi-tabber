/*global chrome*/

import './App.css';
import 'rodal/lib/rodal.css';
import NewUser from "./NewUser";
import AccountList from "./AccountList";

function App() {

    const onNewAccountAdded = (email, password) => {
        chrome.extension.getBackgroundPage().addAccount(email.trim().toLocaleLowerCase(), password.trim());
    }

    return (
        <div className="App">
            <a href="https://www.buymeacoffee.com/mooscript" target="_blank">☕ Buy me a coffee and support my work!</a>
            <NewUser onSubmit={onNewAccountAdded} />

            <AccountList />
        </div>
    );
}

export default App;

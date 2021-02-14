/*global chrome*/

import './App.css';
import NewUser from "./NewUser";
import AccountList from "./AccountList";

function App() {

    const onNewAccountAdded = (email, password) => {
        chrome.extension.getBackgroundPage().addAccount(email.trim(), password.trim());
    }

    return (
        <div className="App">
            <NewUser onSubmit={onNewAccountAdded} />

            <AccountList />
        </div>
    );
}

export default App;

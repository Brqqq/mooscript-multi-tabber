/*global chrome*/
import React from "react";

const Detective = (props) => {
    const { detective, accounts } = props;
    const [selectedAccount, setSelectedAccount] = React.useState(undefined);
    const [target, setTarget] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const [CO, setCO] = React.useState(true);
    const [US, setUS] = React.useState(true);
    const [NL, setNL] = React.useState(true);
    const [IT, setIT] = React.useState(true);
    const [JP, setJP] = React.useState(true);
    const [RU, setRU] = React.useState(true);
    const [CN, setCN] = React.useState(true);
    const [GB, setGB] = React.useState(true);
    const [CU, setCU] = React.useState(true);

    const [clearSearch, setClearSearch] = React.useState(true);

    if (!detective) return null;

    const accountArray = Object.keys(accounts)
        .map(email => ({ ...accounts[email], email }));

    const onSubmit = async () => {
        const trimmedTarget = target.trim();
        if (!trimmedTarget) {
            alert("No target filled in...")
            return;
        }

        if (!selectedAccount) {
            alert("You didn't select an account to search with");
            return;
        }

        const countries = [];
        CO && countries.push("Colombia");
        US && countries.push("United States");
        NL && countries.push("Netherlands");
        IT && countries.push("Italy");
        JP && countries.push("Japan");
        RU && countries.push("Russia");
        CN && countries.push("China");
        GB && countries.push("Great Britain");
        CU && countries.push("Cuba");

        if (countries.length === 0) {
            alert("You didn't select any countries...");
            return;
        }


        setIsLoading(true);
        const result = await chrome.extension.getBackgroundPage().startDetectiveSearch(selectedAccount, target, countries, clearSearch);
        if (result !== true) {
            alert(result);
        }
        setIsLoading(false);

    }

    const onLogin = async (email) => {
        const loginResult = await chrome.extension.getBackgroundPage().login(email);

        if (!loginResult) {
            alert("There was an error with logging in your account. Maybe the password is incorrect or mobstar doesn't work?");
        }
    }

    return <div>
        <h3>Detective</h3>
        <div>
            <table>
                <tbody>
                    <tr>
                        <td>Account that will search</td>
                        <td>
                            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                                <option value={undefined}></option>
                                {accountArray.map(acc => <option key={acc.email} value={acc.email}>
                                    {acc.name || acc.email}
                                </option>)}
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>Target to find</td>
                        <td>
                            <input type="text" value={target} onChange={e => setTarget(e.target.value)} />
                        </td>
                    </tr>
                    <tr>
                        <td>Search in countries</td>
                        <td>
                            <div>
                                <input type="checkbox" checked={CO} onChange={() => setCO(!CO)} id="CO" />
                                <label htmlFor="CO">Colombia</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={US} onChange={() => setUS(!US)} id="US" />
                                <label htmlFor="US">United States</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={NL} onChange={() => setNL(!NL)} id="NL" />
                                <label htmlFor="NL">Netherlands</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={IT} onChange={() => setIT(!IT)} id="IT" />
                                <label htmlFor="IT">Italy</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={JP} onChange={() => setJP(!JP)} id="JP" />
                                <label htmlFor="JP">Japan</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={RU} onChange={() => setRU(!RU)} id="RU" />
                                <label htmlFor="RU">Russia</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={CN} onChange={() => setCN(!CN)} id="CN" />
                                <label htmlFor="CN">China</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={GB} onChange={() => setGB(!GB)} id="GB" />
                                <label htmlFor="GB">Great Britain</label>
                            </div>
                            <div>
                                <input type="checkbox" checked={CU} onChange={() => setCU(!CU)} id="CU" />
                                <label htmlFor="CU">Cuba</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Options</td>
                        <td>
                            <input type="checkbox" checked={clearSearch} onChange={() => setClearSearch(!clearSearch)} id="clearSearch" />
                            <label htmlFor="clearSearch">Clear all past detective searches on this account</label>
                        </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td>
                            <button disabled={isLoading} onClick={onSubmit}>
                                {isLoading ? "Searching..." : "Search 50x"}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <h3>Searching</h3>
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Started at</th>
                        <th>Searcher</th>
                        <th>Target</th>
                        <th>Searching in countries</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(detective.searching).map(id => {
                        const search = detective.searching[id];
                        return <tr key={id}>
                            <td>
                                {new Date(search.isoDate).toLocaleTimeString()}
                            </td>
                            <td>
                                <button title="Click to login" className="link-button" onClick={() => onLogin(search.searcher)}>{accounts[search.searcher]?.name}</button>
                            </td>
                            <td>
                                {search.target}
                            </td>
                            <td>
                                {search.countries.join(", ")}
                            </td>
                        </tr>
                    })}
                </tbody>
            </table>
        </div>

        <h3>Results</h3>
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Found at time</th>
                        <th>Searcher</th>
                        <th>Target</th>
                        <th>Found in country</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(detective.found).map(id => {
                        const found = detective.found[id];
                        return <tr key={id}>
                            <td>
                                {new Date(found.foundOn).toLocaleTimeString()}
                            </td>
                            <td>
                                <button title="Click to login" className="link-button" onClick={() => onLogin(found.searcher)}>{accounts[found.searcher]?.name}</button>
                            </td>
                            <td>
                                {found.target}
                            </td>
                            <td>
                                {found.foundIn}
                            </td>
                        </tr>
                    })}
                </tbody>
            </table>
        </div>
    </div>;
};

export default Detective;
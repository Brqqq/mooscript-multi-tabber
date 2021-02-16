/*global chrome*/
import React from "react";

const ConfigModal = props => {
    const [account, setAccount] = React.useState(props.account.account);
    const [applyForAllAccounts, setApplyForAllAccounts] = React.useState(false);
    const onSaveClicked = (e) => {
        e.preventDefault();
        const {
            enableJailbusting,
            enableSmallCrime,
            enableGta,
            enableCarSelling,
            enableItemBuying,
            enableDrugRunning,
            enableDrugRunFinding
        } = account;

        const newValues = {
            enableJailbusting,
            enableSmallCrime,
            enableGta,
            enableCarSelling,
            enableItemBuying,
            enableDrugRunning,
            enableDrugRunFinding
        };

        if (applyForAllAccounts) {
            chrome.extension.getBackgroundPage().updateEveryAccount(newValues);
        } else {
            chrome.extension.getBackgroundPage().updateAccount(props.account.email, newValues);
        }
        props.onClose();
    }

    const onApplyToAllAccsChange = () => {
        setApplyForAllAccounts(!applyForAllAccounts);
    }

    const onPropToggle = (propName) => {
        const newValue = account[propName] == null || account[propName] === false;
        const newAccount = {
            ...account,
            [propName]: newValue
        };

        setAccount(newAccount);
    }

    return <div>
        <div className="header">Configuration</div>
        <div className="body">
            <table>
                <tbody>
                    <tr>
                        <td>
                            Do jailbusts
                    </td>
                        <td>
                            <input type="checkbox" checked={account.enableJailbusting || false} onChange={() => onPropToggle("enableJailbusting")} />
                        </td>
                    </tr>
                    <tr>
                        <td>Do small crime</td>
                        <td>
                            <input type="checkbox" checked={account.enableSmallCrime || false} onChange={() => onPropToggle("enableSmallCrime")} />
                        </td>
                    </tr>
                    <tr>
                        <td>Do GTA</td>
                        <td>
                            <input type="checkbox" checked={account.enableGta || false} onChange={() => onPropToggle("enableGta")} />
                        </td>
                    </tr>
                    <tr>
                        <td>Sell cars</td>
                        <td>
                            <input type="checkbox" checked={account.enableCarSelling || false} onChange={() => onPropToggle("enableCarSelling")} />
                        </td>
                    </tr>
                    <tr>
                        <td>Buy items</td>
                        <td>
                            <input type="checkbox" checked={account.enableItemBuying || false} onChange={() => onPropToggle("enableItemBuying")} />
                        </td>
                    </tr>
                    <tr>
                        <td>Do drug runs</td>
                        <td>
                            <input type="checkbox" checked={account.enableDrugRunning || false} onChange={() => onPropToggle("enableDrugRunning")} />
                        </td>
                    </tr>
                    <tr>
                        <td>Find drug runs</td>
                        <td>
                            <input type="checkbox" checked={account.enableDrugRunFinding || false} onChange={() => onPropToggle("enableDrugRunFinding")} />
                        </td>
                    </tr>

                    <tr>
                        <td></td>
                        <td></td>
                    </tr>

                    <tr>
                        <td>Apply these changes to ALL of your accounts?</td>
                        <td>
                            <input type="checkbox" checked={applyForAllAccounts} onChange={onApplyToAllAccsChange} />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <button onClick={onSaveClicked} className="rodal-confirm-btn">Save</button>
        <button onClick={props.onClose} className="rodal-cancel-btn">Close</button>
    </div>

}

export default ConfigModal;
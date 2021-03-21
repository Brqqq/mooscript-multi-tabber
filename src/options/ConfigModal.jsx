/*global chrome*/
import React from "react";

const ConfigModal = props => {
    const [settings, setSettings] = React.useState({
        enableJailbusting: true,
        enableSmallCrime: true,
        enableGta: true,
        enableCarSelling: true,
        enableItemBuying: true,
        enableDrugRunning: true,
        enableBuyingPbf: false
    });
    const [applyForAllAccounts, setApplyForAllAccounts] = React.useState(false);

    const onSaveClicked = (e) => {
        e.preventDefault();

        if (applyForAllAccounts) {
            chrome.extension.getBackgroundPage().updateEveryAccount(settings);
        } else {
            chrome.extension.getBackgroundPage().updateAccounts(Object.keys(props.accounts), settings);
        }
        props.onClose();
    }

    const onApplyToAllAccsChange = () => {
        setApplyForAllAccounts(!applyForAllAccounts);
    }

    const onPropToggle = (propName) => {
        const newValue = !settings[propName];

        const newSettings = {
            ...settings,
            [propName]: newValue
        }

        setSettings(newSettings);
    }

    return <div>
        <div className="header">Configuration</div>
        <div className="body">
            <table>
                <tbody>
                    <tr>
                        <td>
                            <label htmlFor="dojailbusts">
                                Do jailbusts
                            </label>
                        </td>
                        <td>
                            <input id="dojailbusts" type="checkbox" checked={settings.enableJailbusting} onChange={() => onPropToggle("enableJailbusting")} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor="smallcrime">Do small crime</label>
                        </td>
                        <td>
                            <input id="smallcrime" type="checkbox" checked={settings.enableSmallCrime} onChange={() => onPropToggle("enableSmallCrime")} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor="dogta">Do GTA</label>
                        </td>
                        <td>
                            <input id="dogta" type="checkbox" checked={settings.enableGta} onChange={() => onPropToggle("enableGta")} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor="sellcars">Sell cars</label>
                        </td>
                        <td>
                            <input id="sellcars" type="checkbox" checked={settings.enableCarSelling} onChange={() => onPropToggle("enableCarSelling")} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor="buyitems">Buy items</label>
                        </td>
                        <td>
                            <input id="buyitems" type="checkbox" checked={settings.enableItemBuying} onChange={() => onPropToggle("enableItemBuying")} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor="enabledrugrunning">Do drug runs</label>
                        </td>
                        <td>
                            <input id="enabledrugrunning" type="checkbox" checked={settings.enableDrugRunning} onChange={() => onPropToggle("enableDrugRunning")} />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <label htmlFor="enablebuyingpbf">Buy personal bullet factory</label>
                        </td>
                        <td>
                            <input id="enablebuyingpbf" type="checkbox" checked={settings.enableBuyingPbf} onChange={() => onPropToggle("enableBuyingPbf")} />
                        </td>
                    </tr>


                </tbody>
            </table>

            <br />

            <input id="applytoselectedaccounts" type="radio" checked={!applyForAllAccounts} onChange={() => setApplyForAllAccounts(false)} />
            <label htmlFor="applytoselectedaccounts">Apply settings to the filtered accounts (the accounts you see in the list right now)</label>
            <br />
            <br />
            <input id="applytoallaccounts" type="radio" checked={applyForAllAccounts} onChange={() => setApplyForAllAccounts(true)} />
            <label htmlFor="applytoallaccounts">Apply settings to ALL the accounts that you have</label>
        </div>
        <button onClick={onSaveClicked} className="rodal-confirm-btn">
            Save
        </button>
        <button onClick={props.onClose} className="rodal-cancel-btn">Close</button>
    </div>

}

export default ConfigModal;
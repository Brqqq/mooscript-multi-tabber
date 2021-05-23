/*global chrome*/
import React from "react";
import Rodal from "rodal";

const expectedDataShape = `[
    {
      "country": "Great Britain",
      "drug": "Nederwiet"
    },
    {
      "country": "Cuba",
      "drug": "XTC"
    }
]`;

const DrugrunSettings = (props) => {
    const [drugrunType, setDrugrunType] = React.useState("");
    const [drugrunUrl, setDrugrunUrl] = React.useState("");
    React.useEffect(() => {
        chrome.storage.local.get("config", ({ config  }) => {
            setDrugrunType(config.drugrunType);
            setDrugrunUrl(config.drugrunUrl);
        });
    }, []);

    const onSave = () => {
        if(drugrunType !== "api") {
            chrome.extension.getBackgroundPage()
                .setDrugrunType(drugrunType, drugrunUrl)
                .then(props.onClose);
        }
        const callback = () => {
            return fetch(drugrunUrl, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    "MooScript": "0"
                }
            })
                .then(res => res.json())
                .then(res => {
                    if(
                        Array.isArray(res) && 
                        res.length === 2 &&
                        res[0].country != null && typeof res[0].country === "string" &&
                        res[0].drug != null && typeof res[0].drug === "string"  &&
                        res[1].country != null && typeof res[1].country === "string" &&
                        res[1].drug != null && typeof res[1].drug === "string"
                    ) {
                        return chrome.extension.getBackgroundPage()
                            .setDrugrunType(drugrunType, drugrunUrl);
                    } else {
                        throw new Error("Unexpected data shape");
                    }
                })
                .then(() => {
                    alert("Success! It will now fetch data from " + drugrunUrl);
                    props.onClose();
                })
                .catch((e) => {
                    console.error(e);
                    alert("Error with the URL: " + e);
                    alert(`Server must return JSON data like:
                    ${expectedDataShape}`);
                });
        }

        chrome.permissions.contains({
            origins: [drugrunUrl]
        }, (result) => {
            if(result) {
                callback(drugrunUrl);
            }
            else {
                chrome.permissions.request({
                    origins: [drugrunUrl]
                }, (granted) => {
                    if (granted) {
                        callback(drugrunUrl);
                        return;
                    }

                    alert("You did not grant permission. The setting was not saved.");
                });
            }
        });
    }

    return <Rodal
        visible
        onClose={props.onClose}
        height={400}
        width={500}
    >
        <div className="header">Drug run settings</div>
        <div className="body">
            <div>
                There are two ways to retrieve the latest drug run:
                <ul>
                    <li>Look at the stats and see in which countries there are the most players.<br/>This is the old strategy. It is not always very accurate and only works after 02:00 Amsterdam time<br/><br/></li>
                    <li>Use an external server.<br/>This server will give the most up to date drug run information. By default this is MooScript's server: https://extension.mooscript.com/api/drug-run</li>
                </ul>
            </div>
            <div style={{ marginTop: 6 }}>
                <input type="radio" id="statsRadio" checked={drugrunType === "stats"} onChange={e => setDrugrunType("stats")} />
                <label htmlFor="statsRadio">Use the old stats strategy</label>
                <br/>
                <br/>
                <input type="radio" id="apiRadio" checked={drugrunType === "api"} onChange={e => setDrugrunType("api")} />
                <label htmlFor="apiRadio">Use an external server</label>
                <br/>
                <input style={{ width: "70%"}} type="text" disabled={drugrunType !== "api"} value={drugrunUrl} onChange={e => setDrugrunUrl(e.target.value)} />
            </div>
        </div>

        <button onClick={onSave} className="rodal-confirm-btn">Save</button>
        <button onClick={props.onClose} className="rodal-cancel-btn">Close</button>
    </Rodal>
}

export default DrugrunSettings;
/*global chrome*/
import React from "react";
import Rodal from "rodal";

const verifyAndSaveSync = (url, username, password) => {
    const callback = (resolve, reject) => {
        return fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: "verify",
                auth: {
                    username,
                    password
                }
            })
        })
            .then(res => res.json())
            .then(res => {
                const { serverName } = res;
                return chrome.extension.getBackgroundPage()
                    .setSync(url, username, password, serverName)
                    .then(() => resolve(serverName));
            })
            .catch((e) => {
                console.error(e);
                reject(e);
            });
    }

    return new Promise((resolve, reject) => {
        chrome.permissions.contains({
            origins: [url]
        }, function (result) {
            if (result) {
                callback(resolve, reject);
            } else {
                chrome.permissions.request({
                    origins: [url]
                }, (granted) => {
                    if (granted) {
                        callback(resolve, reject);
                        return;
                    }

                    reject("You didn't grant permissions");
                });
            }
        });
    });
}

const Sync = (props) => {
    const [url, setUrl] = React.useState("");
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [server, setServer] = React.useState("");

    React.useEffect(() => {
        chrome.storage.local.get("sync", ({ sync }) => {
            if(sync == null) return;

            setUrl(sync.url);
            setUsername(sync.username);
            setPassword(sync.password);
            setServer(sync.serverName);
        });
    }, []);

    const onSave = async () => {
        try {
            const result = await verifyAndSaveSync(url, username, password);
            alert("Succesfully connected with: " + result);

            setServer(result);
        } catch(e) {
            alert("Connection failed. Error: " + e);
            console.error(e);
        }
    }

    return <Rodal
        visible
        onClose={props.onClose}
        height={300}
    >
        <div className="header">Sync</div>
        <div className="body">
            <div>
                {server}
            </div>
            <div style={{ marginTop: 6 }}>
                <input type="text" placeholder="URL" value={url} onChange={e => setUrl(e.currentTarget.value)} />
            </div>
            <div style={{ marginTop: 6 }}>
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.currentTarget.value)} />
            </div>
            <div style={{ marginTop: 6 }}>
                <input type="text" placeholder="Password" value={password} onChange={e => setPassword(e.currentTarget.value)} />
            </div>
        </div>

        <button onClick={onSave} className="rodal-confirm-btn">Save</button>
        <button onClick={props.onClose} className="rodal-cancel-btn">Close</button>
    </Rodal>
}

export default Sync;
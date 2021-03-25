import React from "react";

const Messages = (props) => {
    return <div>
        <h3>Messages</h3>
        <div>
            {Object.keys(props.accounts).map(email => {
                const account = props.accounts[email];
                if (!account.messages || account.messages.length === 0) return <React.Fragment key={email}></React.Fragment>;

                return <React.Fragment key={email}>
                    <div style={{ marginTop: 8 }}>
                        <b>{account.name}</b>
                        {account.messages.map((msg, idx) => {
                            return <div style={{ marginLeft: "30%", marginRight: "30%", border: "2px solid black", marginTop: 2 }} key={idx + msg.from + msg.message}>
                                <div style={{ fontFamily: "Verdana", borderBottom: "1px solid black", color: "white", fontWeight: "bold", backgroundColor: "#c18411" }}>
                                    {msg.from}
                                </div>
                                <div
                                    style={{ backgroundColor: "rgb(89, 89, 89)", color: "rgb(238, 238, 238)" }}
                                    dangerouslySetInnerHTML={{ __html: msg.message.replace(/href=".*?"/g, "") }}
                                >
                                </div>
                            </div>
                        })}
                    </div>
                </React.Fragment>
            })}
        </div>
    </div>;
};

export default Messages;
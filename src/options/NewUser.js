import React from "react";

const NewUser = ({ onSubmit }) => {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    return <>
        <h3>Add new account</h3>
        <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
        <input style={{ marginLeft: 6 }} type="text" placeholder="Password" value={password} onChange={e => setPassword(e.currentTarget.value)} />
        <button
            style={{ marginLeft: 6 }}
            onClick={(e) => {
                e.preventDefault();
                onSubmit(email, password);
                setEmail("");
                setPassword("");
            }}>Add</button>
    </>
}

export default NewUser;
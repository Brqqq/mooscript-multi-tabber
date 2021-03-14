import React from "react";

const NewUser = ({ onSubmit }) => {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [rememberPassword, setRememberPassword] = React.useState(false);
    const emailRef = React.useRef();
    return <>
        <h3>Add new account</h3>
        <input ref={emailRef} type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
        <input style={{ marginLeft: 6 }} type="text" placeholder="Password" value={password} onChange={e => setPassword(e.currentTarget.value)} />
        <input id="rememberpassword" type="checkbox" onChange={e => setRememberPassword(e.currentTarget.checked)} />
        <label htmlFor="rememberpassword">Remember password</label>

        <button
            style={{ marginLeft: 6 }}
            onClick={(e) => {
                e.preventDefault();
                onSubmit(email, password);
                setEmail("");
                if (!rememberPassword) {
                    setPassword("");
                }
                emailRef.current?.focus();
            }}>Add</button>
    </>
}

export default NewUser;
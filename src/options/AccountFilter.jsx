import React from "react";
import { typeOptions } from "./constants";

const AccountFilter = (props) => {
    const onChange = (propName, newValue) => {
        const newFilter = {
            ...props.filter,
            [propName]: newValue
        }

        props.onFilterChange(newFilter);
    }

    const onReset = () => {
        props.onFilterChange({
            name: "",
            crewName: "",
            type: ""
        });
    }

    return <table>
        <tbody>
            <tr>
                <td>Account name</td>
                <td>
                    <input
                        type="text"
                        placeholder="Filter on account name"
                        value={props.filter.name}
                        onChange={e => onChange("name", e.target.value)}
                    />
                </td>
            </tr>
            <tr>
                <td>Crew name</td>
                <td>
                    <input
                        type="text"
                        placeholder="Filter on crew name"
                        value={props.filter.crewName}
                        onChange={e => onChange("crewName", e.target.value)}
                    />
                </td>
            </tr>
            <tr>
                <td>Account type</td>
                <td>
                    <select
                        style={{ width: "100%" }}
                        value={props.filter.type}
                        onChange={(e) => onChange("type", e.target.value)}
                    >
                        <option></option>
                        {typeOptions.map(t => <option key={t}>
                            {t}
                        </option>)}
                    </select>
                </td>
            </tr>
            <tr>
                <td>
                    <button onClick={props.onConfigureClick}>Configure accounts</button>
                </td>
                <td>
                    <button onClick={onReset}>Reset filter</button>
                </td>
            </tr>
        </tbody>
    </table>
}

export default AccountFilter;
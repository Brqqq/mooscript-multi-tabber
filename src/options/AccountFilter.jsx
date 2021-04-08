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
            type: "",
            rank: ""
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
                <td>Rank</td>
                <td>
                    <select
                        style={{ width: "100%" }}
                        value={props.filter.rank}
                        onChange={(e) => onChange("rank", e.target.value)}
                    >
                        <option value=""></option>
                        <option value="Bacteria">Bacteria</option>
                        <option value="Low Life">Low life</option>
                        <option value="Apprentice">Apprentice</option>
                        <option value="Hitman">Hitman</option>
                        <option value="Assassin">Assassin</option>
                        <option value="Local Boss">Local Boss</option>
                        <option value="Boss">Boss</option>
                        <option value="Godfather">Godfather</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td colSpan={2}>
                    <button onClick={props.onConfigureClick}>Configure accounts</button>
                    &nbsp;
                    <button onClick={props.startAll} title="Starts scripting on all the filtered accounts in the list below">Start scripting</button>
                    &nbsp;
                    <button onClick={props.stopAll} title="Stop scripting on all the filtered accounts in the list below">Stop scripting</button>
                    &nbsp;
                    <button onClick={onReset}>Reset filter</button>
                </td>
            </tr>
        </tbody>
    </table>
}

export default AccountFilter;
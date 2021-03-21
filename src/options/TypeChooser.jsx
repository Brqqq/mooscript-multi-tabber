import React from "react";
import { typeOptions } from "./constants";

const TypeChooser = ({ value, onChange }) => {
    return <select
        onChange={e => onChange(e.target.value)}
        id="type-select"
        value={value || "⭕"}>
        {typeOptions.map(type => <option key={type}>
            {type}
        </option>)}

    </select>;
}

export default TypeChooser;
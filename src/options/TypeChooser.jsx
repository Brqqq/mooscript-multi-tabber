import React from "react";
const options = [
    "⭕",
    "🟠",
    "🟣",
    "⚫",
    "🔵",
    "🟡",
    "⚪"
]

const TypeChooser = ({ value, onChange }) => {
    return <select
        onChange={e => onChange(e.target.value)}
        id="type-select"
        value={value || "⭕"}>
        {options.map(type => <option key={type}>
            {type}
        </option>)}

    </select>;
}

export default TypeChooser;
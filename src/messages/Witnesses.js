import React from "react";
import moment from "../background/lib/moment.js";

const uniqBy = (arr, predicate) => {
    const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];

    return [...arr.reduce((map, item) => {
        const key = (item === null || item === undefined) ?
            item : cb(item);

        map.has(key) || map.set(key, item);

        return map;
    }, new Map()).values()];
};

const Witnesses = (props) => {
    const messages = Object.keys(props.accounts)
        .map(email => props.accounts[email].messages)
        .filter(messages => messages != null)
        .flatMap(messages => messages)
        .filter(message => message.message.includes("You have witnessed"));

    const getDate = (message) => {
        const words = message.from.split(" ");
        const dateSection = words[words.length - 1].split("\t");
        const parsed = moment.utc(`${dateSection[0]} ${dateSection[1]}`, "YYYY-MM-DD HH:mm:ss:")
        return parsed;
    }

    const uniqueMessages = uniqBy(messages, m => m.message);

    uniqueMessages.sort((a, b) => {
        const aDate = getDate(a);
        const bDate = getDate(b);

        return bDate.valueOf() - aDate.valueOf();
    });

    return <div>
        <h3>Witnesses</h3>
        <table>
            <tbody>
                {uniqueMessages.map((message, idx) => {
                    const words = message.from.split(" ");
                    return <tr key={idx + message.from + message.message}>
                        <td style={{ fontFamily: "Verdana", borderBottom: "1px solid black", color: "white", fontWeight: "bold", backgroundColor: "#c18411" }}>
                            {words[words.length - 1].replace("\t", " ")}
                        </td>
                        <td style={{ backgroundColor: "rgb(89, 89, 89)", color: "rgb(238, 238, 238)" }} dangerouslySetInnerHTML={{ __html: message.message.replace(/href=".*?"/g, "") }}></td>
                    </tr>
                })}
            </tbody>
        </table>
    </div>;
};

export default Witnesses;
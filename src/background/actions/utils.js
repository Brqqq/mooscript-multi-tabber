
const sanitize = (textContent) => encodeURIComponent(textContent)
    .replace(/%20/g, "+")
    .replace(/%26/g, "&")
    .replace(/%3D/g, "=")
    .replace(/%5B/g, "[")
    .replace(/%5D/g, "]")

export const getDoc = async (url, email) => {
    const fetchCall = await fetch(url, {
        headers: {
            "MooScript": email
        }
    });
    const fetchedText = await fetchCall.text();

    const domParser = new DOMParser();
    const doc = domParser.parseFromString(fetchedText, 'text/html');

    doc.actualUrl = fetchCall.url;

    return {
        document: doc,
        result: fetchCall
    };
}

export const postForm = async (url, postBody, email, options = {}) => {
    const fetchCall = await fetch(url, {
        method: "post",
        body: options.disableSanitize ? postBody : sanitize(postBody),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "MooScript": email
        }
    });
    const fetchedText = await fetchCall.text();

    const domParser = new DOMParser();
    const doc = domParser.parseFromString(fetchedText, 'text/html');

    doc.actualUrl = fetchCall.url;

    return {
        document: doc,
        result: fetchCall
    };
}


export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const isLoggedOut = (fetchResult) => {
    return fetchResult.url.includes(".cc/main/")
}

//export const getAccName = ()
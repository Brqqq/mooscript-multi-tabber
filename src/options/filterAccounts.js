export const filterAccounts = (accounts, { name, crewName, type }) => {
    if(!name && !crewName && !type) return accounts;

    const filteredAccounts = { ...accounts };

    const result = Object.keys(filteredAccounts)
        .reduce((acc, curr) => {
            let shouldBeAdded = true;

            if(name && shouldBeAdded) {
                shouldBeAdded = accounts[curr].name?.toLowerCase().includes(name.toLowerCase(0)) || false;
            }

            if(crewName && shouldBeAdded) {
                shouldBeAdded = accounts[curr].crew?.toLowerCase().includes(crewName.toLowerCase()) || false;
            }

            if(type && shouldBeAdded) {
                shouldBeAdded = accounts[curr].type === type || (accounts[curr].type == null && type === "⭕");
            }
            
            if(shouldBeAdded) {
                return { ...acc, [curr]: accounts[curr] };
            }

            return acc;
        }, {});

    return result;
}
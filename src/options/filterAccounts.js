const normalizeRank = (rank) => {
    switch(rank) {
		case "Young Woman": return "Low Life";
		case "Adult Lady": return "Apprentice";
		case "Hitwoman": return "Hitman";
		case "Local Bossin": return "Local Boss";
		case "Bossin": return "Boss";
		case "Godmother": return "Godfather";
	}
	
	return rank;
}
const shouldFilterRank = (accountRank, rankToFilterOn) => {
    const normalizedRank = normalizeRank(accountRank);

    return normalizedRank === rankToFilterOn;
}

export const filterAccounts = (accounts, { name, crewName, type, rank }) => {
    if(!name && !crewName && !type && !rank) return accounts;

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

            if(rank && shouldBeAdded) {
                shouldBeAdded = shouldFilterRank(accounts[curr].rank, rank);
            }
            
            if(shouldBeAdded) {
                return { ...acc, [curr]: accounts[curr] };
            }

            return acc;
        }, {});

    return result;
}
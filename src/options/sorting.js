const sortAlphabetically = (accountList, propToCompare, isAsc, zeroValue) => {
    console.log(zeroValue)
    const sorted = accountList
        .sort((a, b) => {
            if(a[propToCompare] === zeroValue && b[propToCompare] === zeroValue) return 0;
            else if(a[propToCompare] === zeroValue) return 1;
            else if(b[propToCompare] === zeroValue) return -1;

            return a[propToCompare]?.toString().localeCompare(b[propToCompare].toString())
        });
    
    return isAsc ? sorted : sorted.reverse();
}

const sortNumbers = (accountList, propToCompare, isAsc) => {
    const sorted = accountList
        .sort((a, b) => (+a[propToCompare] || 0) - (+b[propToCompare] || 0));
    
    return isAsc ? sorted : sorted.reverse();
}


const ranks = ["bacteria", "low life", "young woman", "apprentice", "adult lady", "hitman", "hitwoman", "assassin", "local boss", "local bossin", "boss", "bossin", "godfather", "godmother"];
const compareRanks = (rankA, rankB) => {
    const aIndex = ranks.indexOf(rankA?.toLowerCase());
    const bIndex = ranks.indexOf(rankB?.toLowerCase());
    
    if(aIndex > bIndex) return 1;
    if(aIndex === bIndex) return 0;
    return -1;
}

const rankSort = (accountList, propToCompare, isAsc) => {
    const sorted = accountList
        .sort((a, b) => compareRanks(a[propToCompare], b[propToCompare]));
    
    return isAsc ? sorted : sorted.reverse();
}


const numericalProps = ["cash", "bullets", "lead", "payingDays", "honor", "credits"];
const alphabeticalProps = ["email", "name", "crew", "country"];
export const sortAccounts = (accountList, propToSort, isAsc) => {
    if(numericalProps.includes(propToSort)) {
        return sortNumbers(accountList, propToSort, isAsc);
    } else if(alphabeticalProps.includes(propToSort)) {
        let zeroValue = propToSort === "crew" ? "None" : undefined;
        return sortAlphabetically(accountList, propToSort, isAsc, zeroValue);
    } else if(propToSort === "rank") {
        return rankSort(accountList, propToSort, isAsc);
    }
    else {
        console.log("Unknown prop: " + propToSort);
    }

    return accountList;
}
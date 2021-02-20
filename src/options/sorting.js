const sortAlphabetically = (accountList, propToCompare, isAsc) => {
    const sorted = accountList
        .sort((a, b) => a[propToCompare]?.toString().localeCompare(b[propToCompare].toString()));
    
    return isAsc ? sorted : sorted.reverse();
}

const sortNumbers = (accountList, propToCompare, isAsc) => {
    const sorted = accountList
        .sort((a, b) => +a[propToCompare] - +b[propToCompare]);
    
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
        return sortAlphabetically(accountList, propToSort, isAsc);
    } else if(propToSort === "rank") {
        return rankSort(accountList, propToSort, isAsc);
    }
    else {
        console.log("Unknown prop: " + propToSort);
    }

    return accountList;
}
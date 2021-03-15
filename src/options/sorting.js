const sortAlphabetically = (accountList, propToCompare, isAsc, zeroValue, defaultValue) => {
    const sorted = accountList
        .sort((a, b) => {
            const aPropToCompare = a[propToCompare] || defaultValue;
            const bPropToCompare = b[propToCompare] || defaultValue;

            if(aPropToCompare === zeroValue && bPropToCompare === zeroValue) return 0;
            else if(aPropToCompare === zeroValue) return 1;
            else if(bPropToCompare === zeroValue) return -1;

            return aPropToCompare?.toString().localeCompare(bPropToCompare.toString())
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

const booleanSort = (accountList, propToCompare, isAsc) => {
    const sorted = accountList
        .sort((a, b) => {
            if(a[propToCompare] === true && b[propToCompare] === true) return 0;
            if(a[propToCompare] === true) return -1;
            if(b[propToCompare] === true) return 1;
        });

    return isAsc ? sorted.reverse() : sorted;
}


const numericalProps = ["cash", "bullets", "lead", "payingDays", "honor", "credits"];
const alphabeticalProps = ["email", "name", "crew", "country", "type"];
const booleanProps = ["enableJailbusting", "enableSmallCrime", "enableGta", "enableCarSelling", "enableItemBuying", "enableDrugRunning", "enableBuyingPbf"];

export const sortAccounts = (accountList, propToSort, isAsc) => {
    if(numericalProps.includes(propToSort)) {
        return sortNumbers(accountList, propToSort, isAsc);
    } else if(alphabeticalProps.includes(propToSort)) {
        let zeroValue = undefined;
        let defaultValue = undefined;

        if(propToSort === "crew") zeroValue = "None";
        if(propToSort === "type") {
            zeroValue = "⭕";
            defaultValue = "⭕";
        }

        return sortAlphabetically(accountList, propToSort, isAsc, zeroValue, defaultValue);
    } else if(propToSort === "rank") {
        return rankSort(accountList, propToSort, isAsc);
    } else if(booleanProps.includes(propToSort)) {
        return booleanSort(accountList, propToSort, isAsc);
    }
    else {
        console.error("Unknown prop " + propToSort)
    }

    return accountList;
}
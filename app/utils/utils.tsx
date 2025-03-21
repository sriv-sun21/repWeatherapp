// date formating in readable form
export function dateTimeConverter(dataValue: string) {
    const formatDate = new Date(dataValue.toString());
    return formatDate;
}

// temperature calculation 
export function temeratureCalc(tempValue:number,tempType:string) {
    const temerature = {C:'',F:'',K:''};
    if (tempType === 'C') {
        temerature.C = tempValue.toFixed(2);
        temerature.F = (tempValue*1.8 + 32).toFixed(2);
        temerature.K = (tempValue + 273.15).toFixed(2);

    } else if (tempType === 'K')  {
        temerature.C = (tempValue - 273.15).toFixed(2);
        temerature.F = (((tempValue -273.15)*9/5) + 32).toFixed(2);
        temerature.K = tempValue.toFixed(2);
    } else {
        temerature.C = ((tempValue - 32)/1.8).toFixed(2);
        temerature.F = tempValue.toFixed(2);
        temerature.K = (((tempValue-32)*5/9 ) + 273.15).toFixed(2);
    }

    return temerature;
}


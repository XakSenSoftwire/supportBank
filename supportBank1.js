// import libraries

var readlineSync = require('readline-sync');
const fs = require('fs');
const Excel = require('exceljs');

// define classes

class Account {
    constructor (name = ``, balance = 0) {
        this.name = name;
        this.balance = balance;
    }

    printAccount() {
        console.log(`${this.name}, Net balance: ${this.balance}`);
    }

    add(value) {
        this.balance += value;
    }
}

class Transaction {
    constructor (date, narrative , value) {
        this.date = date; // dateFormat logic placeholder
        this.narrative = narrative;
        this.value = value;
    }
}

// define functions

async function readCSVFile(fileName) {
    const workbook = new Excel.Workbook();
    const options = {
        dateFormats: ['DD/MM/YYYY'],
    
        map(value, index) {
            switch(index) {
            case 0:
                // column 1 is date
                return new Date(value);
            
            case 1:
                // column 2 is the sender's name
                return value;

            case 2:
                // column 3 is recipient's name
                return value;

            case 3:
                // column 4 is the transaction narrative
                return value;

            case 4:
                // column 5 is the transaction value
                return parseFloat(value);
            }
        },

        parserOptions: {
            delimiter: '\t',
            quote: false,
        },
    };
    const worksheet = await workbook.csv.readFile(fileName, options);
    return worksheet
}

async function main() {
    const fileName = `transactions2014.csv`;
    const worksheet = await readCSVFile(fileName);
    console.log(worksheet.getCell('E2').text);
}

main()

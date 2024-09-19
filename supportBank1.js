// // import libraries

var readlineSync = require('readline-sync');
const Excel = require('exceljs');
var log4js = require("log4js");
const moment = require("moment");

log4js.configure(
    {
    appenders: {
        file: {type: 'fileSync', filename: 'logs/debug.log'}
    },
    categories: {
        default: {appenders: ['file'], level: 'trace'}
    }
});

const logger = log4js.getLogger('supportBank1.js');



// // define classes

// Account class to store name, balance, and transaction history. will be the .value() of the database [map]
class Account {
    constructor (name = ``) {
        this.name = name;
        this.balance = 0.00;
        this.transactionHistory = [];
    }

    // output for list all cmd
    printAccount() {
        console.log(`${this.name}, Net balance: ${parseFloat(this.balance).toFixed(2)}`);
    }

    // output for list acc cmd
    reviewAccount () {
        console.log(`${this.name} Account History:`)
        this.transactionHistory.forEach(rowTransaction => {
            rowTransaction.printTransaction();
        });
    }
    
    // update account with new balance and transaction history
    updateAccount(date, narrative, value) {
        let currTransaction = new Transaction(date, narrative, value);
        if (currTransaction.success) {
            this.transactionHistory.push(currTransaction);
            this.balance += value;
        }
    }

}

// Transaction class to handle input from CSV file read and print transaction history neatly
class Transaction {
    constructor (date, narrative , value, success = false) {

        if (date.isValid() && narrative && value) {
            this.success = true;
        }

        this.date = date.format("DD/MM");
        this.narrative = narrative;
        if (value > 0) {
            this.value = `+${value}`;
        }
        else {
            this.value = `${value}`;
        }
    }

    // output for list acc cmd
    printTransaction(){
        console.log(`${this.date}, ${this.narrative}, ${this.value}`)
    }
}

// // define functions
// CSV read file function to an array of data to be destructured and assigned to Account and Transaction objs
async function readCSVFile(fileName) {
    const workbook = new Excel.Workbook();
    const options = {
        map(value, index) {
            switch(index) {
                case 0:
                    // column 1 is date as moment date obj
                    return moment(value, 'DD/MM/YYYY');
                    
                case 4:
                    // column 5 is the transaction value as float
                    return parseFloat(value);
                
                default:
                    // column 2 is the sender's name
                    // column 3 is recipient's name
                    // column 4 is the transaction narrative
                    return value;
            }
        },

        parserOptions: {
            delimiter: ',',
            quote: false,
        },
    };
    const worksheet = await workbook.csv.readFile(fileName, options);
    return worksheet
}

// function to check user input is correctly formatted as "List [...]"
function isFormattedCorrectly(userRequest) {
    const regexTest = /List\s+([\w\s]+)/;
    return regexTest.test(userRequest);
}

// main logic flow of programme
async function main() {

    logger.trace("supportBank intiating...")
    
    // read file
    const fileName = `DodgyTransactions2015.csv`;
    const worksheet = await readCSVFile(fileName);

    // iterate through each row of the worksheet and create database
    var accDatabase = new Map();
    worksheet.eachRow(row => {

        // skip headings row
        if (row.number == 1) {
            return
        }

        // destructuing assingment of variables
        let [, date, senderName, recipientName, narrative, value] = row.values;

        // sender account check
        if (!accDatabase.has(senderName)) {
            accDatabase.set(senderName, new Account(senderName));
        } 
        
        // update sender acc
        accDatabase.get(senderName).updateAccount(date, narrative, -value);

        // recipient account check
        if (!accDatabase.has(recipientName)) {
            accDatabase.set(recipientName, new Account(recipientName));
        }
        
        accDatabase.get(recipientName).updateAccount(date, narrative, value);
    });
    
    // ask for user inputs
    console.log(`----------------------------------------------`)
    console.log(`Welcome to supportBank!`);
    console.log(`----------------------------------------------`)
    console.log(`Please input one of the following options.`);
    console.log('List All: Outputs the name and net balance of each account.');
    console.log('List [Name]: Outputs the transaction history of that account.');
    console.log('Close: Closes the application.');
    console.log(`----------------------------------------------`)
    var userRequest = readlineSync.question(`What would you like to do? `);

    // while input is not close, continue asking user for inputs
    while (userRequest != `Close`) {

        // if user inputs `List All`, print the name and balance of each account in database
        if (userRequest === `List All`) {
            accDatabase.forEach(currAcc => {
                currAcc.printAccount();
            });
        } 
        
        // otherwise, check if input is formatted as `List [Name]`
        else if (isFormattedCorrectly(userRequest)) {

            // extract `[Name]` from input
            const regexExtract = /List\s+([\w\s]+)/;
            let [,userRequestName] = userRequest.match(regexExtract);

            // check database for name
            if (accDatabase.has(userRequestName)) {
                let arrTransaction = accDatabase.get(userRequestName).transactionHistory;
                arrTransaction.forEach(currTransaction => {
                    currTransaction.printTransaction()
                });
            } 
            
            // failure message for name check
            else {
                console.log(`Sorry, we can't find an account attached to that name.`);
            }
        }

        // wider failure message for bad input
        else {
            console.log(`Sorry, I don't recognise that command. Please try again.`);
        }

        // prompt user again
        console.log(`----------------------------------------------`)
        userRequest = readlineSync.question(`Would you like to do another operation? Input a command: `);
    }

    // closing message
    logger.trace("supportBank closing...")
}

main()

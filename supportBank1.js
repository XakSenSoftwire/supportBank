// import libraries

var readlineSync = require('readline-sync');
const fs = require('fs');
const Excel = require('exceljs');

// define classes

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
        this.transactionHistory.push(new Transaction(date, narrative, value))
        this.balance += value
    }

    // // add current transaction to transaction history
    // addTransaction(currTransaction){
    //     this.transactionHistory.push(currTransaction);
    // }
    // // add current transaction to net balance
    // updateBalance(value) {
    //     this.balance += value;
    // }


}

class Transaction {
    constructor (date, narrative , value) {
        this.date = date;
        this.narrative = narrative;
        if (value > 0) {
            this.value = `+${value}`;
        }
        else {
            this.value = `${value}`;
        }
    }

    printTransaction(){
        console.log(`${this.date}, ${this.narrative}, ${this.value}`)
    }
}

// define functions

async function readCSVFile(fileName) {
    const workbook = new Excel.Workbook();
    const options = {
        map(value, index) {
            switch(index) {
                case 4:
                    // column 4 is the transaction narrative
                    return parseFloat(value);
                
                default:
                    // column 1 is date as string
                    // column 2 is the sender's name
                    // column 3 is recipient's name
                    // column 5 is the transaction value as string
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

function isFormattedCorrectly(userRequest) {
    const regexTest = /^List \w+$/;
    return regexTest.test(userRequest);
}

async function main() {
    
    // read file
    const fileName = `transactions2014.csv`;
    const worksheet = await readCSVFile(fileName);
    // console.log(worksheet.getCell(`E2`).text);

    // iterate through each row of the worksheet and update database
    var accDatabase = new Map();
    worksheet.eachRow(row => {

        // skip headings row
        if (row.number == 1) {
            return
        }

        // destructuing assingment of variables
        let [, date, senderName, recipientName, narrative, value] = row.values;

        // sender account check
        if (!accDatabase.has(senderName)){
            accDatabase.set(senderName, new Account(senderName));
        } 
        
        // update sender acc
        accDatabase.get(senderName).updateAccount(date, narrative, -value);

        // recipient account check
        if (!accDatabase.has(recipientName)){
            accDatabase.set(recipientName, new Account(recipientName));
        }
        
        accDatabase.get(recipientName).updateAccount(date, narrative, value);
    });

    // ask for user inputs
    console.log(`Welcome to supportBank!`);
    console.log(`Please input one of the following options.`);
    console.log('List All: Outputs the name and net balance of each account.');
    console.log('List [Name]: Outputs the transaction history of that account.');
    console.log('Close: Closes the application.');
    var userRequest = readlineSync.question(`What would you like to do? `);

    while (userRequest != `Close`) {
        if (userRequest === `List All`) {
            accDatabase.forEach(currAcc => {
                currAcc.printAccount();
            });

        } 
        
        else if (isFormattedCorrectly(userRequest)) {
            const regexExtract = /List\s+([\w\s]+)/;
            let userRequestName = userRequest.match(regexExtract);

            if (accDatabase.has(userRequestName)) {
                accDatabase.get(userRequestName).forEach(currTransaction => {
                    currTransaction.printTransaction()
                });
            } 
            
            else {
                console.log(`Sorry, we can't find an account attached to that name.`);
            }
        }

        else {
            console.log(`Sorry, I don't recognise that command. Please try again.`);
        }
        userRequest = readlineSync.question(`Would you like to do another operation? Input a command: `);
    }
    console.log('Closing...');
}

main()

// // import libraries

var readlineSync = require('readline-sync');
const Excel = require('exceljs');
var log4js = require("log4js");
const moment = require("moment");
const fs = require('fs');

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
        this.transactionHistory.push(new Transaction(date, narrative, value));
        this.balance += value;
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

async function readJSONFile(fileName) {
    // fs.readFile(fileName, async (err, data) => {
    //     if (err) {
    //       logger.fatal('Error reading the file:', err);
    //       return;
    //     }
    //     let temp = JSON.parse(data);
    //     console.log(temp);
    //     return await JSON.parse(data);
    // })}
    fs.readFile('./Transactions2014.csv', function read(err, data) {
        if (err) {
            throw err;
        }
        const content = data;
    
        // Invoke the next step here however you like
        console.log(content);   // Put all of the code here (not the best solution)
        processFile(content);   // Or put the next step in a function and invoke it
    });
    
    function processFile(content) {
        console.log(content);
    }

}

function isFormattedCorrectly(userRequest) {
    const regexTest = /List\s+([\w\s]+)/;
    return regexTest.test(userRequest);
}

function updateDatabase(accDatabase, date, senderName, recipientName, narrative, value, index) {
    // check data is good read
    if (date.isValid() && narrative && value) {
        // sender account check
        if (!accDatabase.has(senderName)) {
            accDatabase.set(senderName, new Account(senderName));
        } 
        
        // recipient account check
        if (!accDatabase.has(recipientName)) {
            accDatabase.set(recipientName, new Account(recipientName));
        }
        
        // update sender acc
        accDatabase.get(senderName).updateAccount(date, narrative, -value);
        accDatabase.get(recipientName).updateAccount(date, narrative, value);
    } else {
        logger.error(`Data at ${index} in the input file is not in the expected format.`)
    }
}

// Function to execute different code based on file type
async function handleFileType(fileName) {
    // Extract the file extension from the file name
    const fileExtension = fileName.split('.').pop().toLowerCase();
    let accDatabase = new Map();
    
    switch (fileExtension) {
      case 'json':
        logger.info('This is a JSON file. Parsing JSON...');
        const worksheetJSON = await readJSONFile(fileName);
        // console.log(jsonData);
        worksheetJSON.forEach(row => {
            console.log("Hello");
        })

        return accDatabase

      case 'csv':
        logger.info('This is a CSV file. Processing CSV...');
        const worksheetCSV = await readCSVFile(fileName);

        // iterate through each row of the worksheet and create database
        worksheetCSV.eachRow(row => {
    
            // destructuing assingment of variables
            let [, date, senderName, recipientName, narrative, value] = row.values;

            updateDatabase(accDatabase, date, senderName, recipientName, narrative, value, row.number);
        });
        
        return accDatabase
      
      default:
        logger.error('Unsupported file type. Please provide a valid file.');
    }
}

  

// main logic flow of programme
async function main() {
    
    logger.trace("supportBank intiating...")
    
    // read file
    const fileName = `Transactions2013.json`;
    // const fileName = `Transactions2014.csv`;
    const accDatabase = await handleFileType(fileName);

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

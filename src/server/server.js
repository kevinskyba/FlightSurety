import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const oracleCount = 20;
const oracles = [];

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    console.log(event);

    let statusCode = Math.floor(Math.random() * 6) * 10;

    for (let i = 0; i < oracles.length; i++) {
        if (oracles[i].index.includes(event.returnValues.index)) {
            flightSuretyApp.methods.submitOracleResponse(
                event.returnValues.index,
                event.returnValues.airline,
                event.returnValues.flight,
                event.returnValues.timestamp,
                statusCode
            ).send({from: oracles[i].address, gas: 4500000}, (error, result) => {
                if (error) console.error(error);
                else console.log(oracles[i].address + " responded with status code " + statusCode);
            });
        }
    }
});

flightSuretyApp.events.FlightStatusInfo(
    function (error, event) {
        let flight = event.returnValues.flight;
        let status_code = event.returnValues.status;
        console.log("FlightStatusInfo Flight status of " + flight + " is " + status_code);
    });

flightSuretyApp.events.OracleReport(
    function (error, event) {
        let flight = event.returnValues.flight;
        let status_code = event.returnValues.status;
        console.log("OracleReport Flight status of " + flight + " is " + status_code);
    });

web3.eth.getAccounts((error, accts) => {
    console.log(error);
    for (let i = 0; i < oracleCount; i++) {
        flightSuretyApp.methods.registerOracle().send({
            from: accts[i],
            value: web3.utils.toWei("1.2", "ether"),
            gas: 4500000
        }, (error, result) => {
            if (error) console.error(error)
            else flightSuretyApp.methods.getMyIndexes().call({
                from: accts[i],
                gas: 4500000
            }, (error, result) => {
               oracles.push({
                   address: accts[i],
                   index: result
               });

               console.log(oracles[i]);
            });
        })
    }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;



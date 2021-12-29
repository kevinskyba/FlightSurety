import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
var BigNumber = require('bignumber.js');

export default class Contract {
    constructor(network, callback) {
        this.network = network;
        this.config = Config[network];
        this.initWeb3(callback);
        this.owner = null;
        this.airlines = ["0x9175E1AC73c1c0f86F265eb44c111fec529345E6"];
        this.passengers = [];
    }

    async initWeb3(callback) {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (false && window.ethereum) {
            this.web3Provider = window.ethereum;
            this.web3 = new Web3(window.ethereum);
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (false && window.web3) {
            this.web3Provider = window.web3.currentProvider;
            this.web3 = new Web3(this.web3Provider);
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            this.web3 = new Web3(this.web3Provider);
        }

        this.networkId = await this.web3.eth.net.getId();
        this.deployedNetwork = FlightSuretyApp.networks[this.networkId];

        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.deployedNetwork.address);
        this.flightSuretyApp.setProvider(this.web3Provider);

        await this.initialize(callback);
    }

    async initialize(callback) {
        await this.web3.eth.getAccounts((error, accts) => {
           console.log(accts);
            this.owner = accts[0];

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner,
                gas: 4500000}, callback);
    }

    getBalance(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .getBalance()
            .call({ from: self.owner,
                gas: 4500000}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner,
                gas: 4500000}, (error, result) => {
                callback(error, payload);
            });
    }

    fund(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fund()
            .send({
                from: self.owner,
                value: 1 * (new BigNumber(10)).pow(18),
                gas: 4500000}, (error, result) => {
                callback(error, result);
            });
    }

    buyInsurance(flight, amount, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .buyInsurance(flight)
            .send({
                from: self.owner,
                value: amount * (new BigNumber(10)).pow(18),
                gas: 4500000
            }, (error, result) => {
                callback(error, result);
            });
    }

    withdraw(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .withdraw()
            .send({
                from: self.owner,
                gas: 4500000
            }, (error, result) => {
                callback(error, result);
            });
    }
}
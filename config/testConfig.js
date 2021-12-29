
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {

    // mnemonic used: badge slab holiday flip oven hire easily enough fatigue vague city manage
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x9175E1AC73c1c0f86F265eb44c111fec529345E6",
        "0xdA91455A23A0C45619150C501e51eFEF0e109779",
        "0xE15725858318F784E28793B8D3fECFdB8E81aE11",
        "0xE743fcba113972eA2e44c4af66b698328358a544",
        "0x5eA73e14f617488cB4B6e9206A2A159bD7150204",
        "0x188AD113FF1b18c4765f1E0a56B62Cd0906bb71F",
        "0xA85A5655e6cAc2f68679A26b6C149b12de3837F3",
        "0x5F6fFD0a76A0f7885199f381C1C0dF7f43F442b6",
        "0xA1e5815a12DF306Ab5Ab8108C98394e6Ce9f0D52"
    ];


    let owner = accounts[0];
    let firstAirline = "0xdA91455A23A0C45619150C501e51eFEF0e109779";

    let flightSuretyData = await FlightSuretyData.deployed(firstAirline);
    let flightSuretyApp = await FlightSuretyApp.deployed(flightSuretyData.address);

    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};
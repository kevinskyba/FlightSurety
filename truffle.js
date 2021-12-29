var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "badge slab holiday flip oven hire easily enough fatigue vague city manage";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost
      port: 7545,            // Standard Ganache UI port
      network_id: '*',
      gas: 4500000
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};
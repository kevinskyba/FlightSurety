
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    let error = false;

    // ACT
    try {
        let result = await config.flightSuretyApp.registerAirline(newAirline, {from: accounts[3]});
    }
    catch(e) {
        error = true;
    }

    // ASSERT
    assert.equal(error, true, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('Only existing airline may register a new airline until there are at least four airlines registered', async () => {

      // ARRANGE
      let newAirline0 = accounts[0];
      let newAirline1 = accounts[1];
      let newAirline2 = accounts[2];
      let newAirline3 = accounts[3];
      let newAirline4 = accounts[4];
      let newAirline5 = accounts[5];

      let reverted = false;
      // ACT
      try {
          await config.flightSuretyApp.registerAirline.call(newAirline4, {from: newAirline4});
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Airline should not be able to register another airline if it hasn't registered");
  });


    it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // ARRANGE
        let newAirline0 = accounts[0];
        let newAirline1 = accounts[1];
        let newAirline2 = accounts[2];
        let newAirline3 = accounts[3];
        let newAirline4 = accounts[4];
        let newAirline5 = accounts[5];

        // after this test, Airline2 is funded, Airline3 and Airline4 are registered and funed, Airline5 is registered
        await config.flightSuretyApp.registerAirline(newAirline2, {from: config.firstAirline, gas: 4500000});
        await config.flightSuretyApp.fund({from: newAirline2, value:10*config.weiMultiple, gas: 4500000});

        await config.flightSuretyApp.registerAirline(newAirline3, {from: config.firstAirline, gas: 4500000});
        await config.flightSuretyApp.fund({from: newAirline3, value:10*config.weiMultiple, gas: 4500000});

        await config.flightSuretyApp.registerAirline(newAirline4, {from: config.firstAirline, gas: 4500000});
        await config.flightSuretyApp.fund({from: newAirline4, value:10*config.weiMultiple, gas: 4500000});

        await config.flightSuretyApp.voteAirline(newAirline5, {from:newAirline2, gas: 4500000});
        let vote_num = await config.flightSuretyData.getVotes.call(newAirline5);

        assert.equal(vote_num.toString(), "1", "should have 1 votes");

        await config.flightSuretyApp.voteAirline(newAirline5, {from:newAirline3, gas: 4500000});
        vote_num = await config.flightSuretyData.getVotes.call(newAirline5);

        assert.equal(vote_num.toString(), "2", "should have 2 votes");

        assert.equal(await config.flightSuretyData.getNumberOfRegisteredAirlines.call(), 4, "there should be 4 registered airlines");
        await config.flightSuretyApp.registerAirline(newAirline5, {from: config.firstAirline, gas: 4500000}); // try register 5th airline without 50% consensus
        assert.equal(await config.flightSuretyData.getNumberOfRegisteredAirlines.call(), 5, "there should be 5 registered airlines");
    });

    it('Airline can be registered, but does not participate in contract until it submits funding of 10 ether (make sure it is not 10 wei)', async () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // ARRANGE
        let newAirline0 = accounts[0];
        let newAirline1 = accounts[1];
        let newAirline2 = accounts[2];
        let newAirline3 = accounts[3];
        let newAirline4 = accounts[4];
        let newAirline5 = accounts[5];

        let reverted = false;
        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline2, {from: config.firstAirline});
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, false, "Register airline should work");

        // Try to vote (should not work because not yet funded
        reverted = false;
        try {
            await config.flightSuretyApp.voteAirline.call(newAirline3, {from: newAirline2});
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, false, "Voting should not work");

        // Now add 1 ETH fund
        await config.flightSuretyApp.fund({from: newAirline2, value:1*config.weiMultiple, gas: 4500000});

        // Should still not work because of missing funds
        reverted = false;
        try {
            await config.flightSuretyApp.voteAirline.call(newAirline3, {from: newAirline2});
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, false, "Voting should not work");


        // Now add 10 ETH fund
        await config.flightSuretyApp.fund({from: newAirline2, value:10*config.weiMultiple, gas: 4500000});

        // Should still not work because of missing funds
        reverted = false;
        try {
            await config.flightSuretyApp.voteAirline.call(newAirline3, {from: newAirline2});
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, false, "Voting should work");

    });
});

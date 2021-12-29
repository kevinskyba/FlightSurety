pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private owner;
    bool private operational = true;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct Airline {
        bool isRegistered;
        bool isFunded;
        address[] support_from_ra ;
        uint256 votes;
    }

    struct Passenger{
        uint256 balance;
    }

    struct Insurance{
        address[] passengers;
        mapping(address => uint256) amount;
        bool handled;
    }
    uint256 private numberOfAirlines = 0;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(string => Flight) private flights;

    mapping (address => Airline) airlines;

    mapping (address => bool) authorizedCallers;

    mapping (address => uint256) balances;

    mapping (string => Insurance) private insurances;

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
    (
        address airline
    )
    public
    {
        owner = msg.sender;

        airlines[airline].isRegistered = true;
        airlines[airline].isFunded = true;
        numberOfAirlines = numberOfAirlines.add(1);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/
    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == owner, "Caller is not contract owner");
        _;
    }

    modifier isAuthorizedCaller()
    {
        require(authorizedCallers[msg.sender],"Caller is not authorized");
        _;
    }

    modifier isRegistered(address _address)
    {
        require(airlines[_address].isRegistered, "Caller is not registered");
        _;
    }

    modifier isFunded(address _address)
    {
        require(airlines[_address].isFunded, "Caller is not funded");
        _;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/


    function authorizeContract(address _address)
    external
    requireIsOperational
    {
        authorizedCallers[_address] = true;
    }
    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
    public
    view
    returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
    (
        bool mode
    )
    external
    requireContractOwner
    {
        operational = mode;
    }

    function getAirlineInfo(
        address _address
    )
    public
    view
    returns(bool,bool)
    {
        return (
            airlines[_address].isRegistered,
            airlines[_address].isFunded
        );
    }

    function getNumberOfRegisteredAirlines(
    )
    public
    view
    returns (uint256)
    {
        return numberOfAirlines;
    }

    function getInsuranceAmount(
        address origin,
        string memory flight
    )
    public
    view
    returns (uint256)
    {
        return insurances[flight].amount[origin];
    }

    function getBalance(address origin)
    public
    view
    returns (uint256)
    {
        return balances[origin];
    }

    function getVotes(address airline)
    public
    view
    returns (uint256)
    {
        return airlines[airline].votes;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
    (
        address origin,
        address airline
    )
    external
    isAuthorizedCaller
    requireIsOperational
    isRegistered(origin)
    isFunded(origin)
    {
        airlines[airline].isRegistered = true;
        airlines[airline].isFunded = false;
        numberOfAirlines = numberOfAirlines.add(1);
    }
    
    function registerFlight
    (
        string flight
    )
    external
    isAuthorizedCaller
    requireIsOperational
    isRegistered(msg.sender)
    isFunded(msg.sender)
    {
        flights[flight].isRegistered = true;
        flights[flight].updatedTimestamp = now;
        flights[flight].airline = msg.sender;
    }

    /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
    (
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
    )
    isAuthorizedCaller
    requireIsOperational
    external
    {
        flights[flight].airline = airline;
        flights[flight].statusCode = statusCode;
        flights[flight].updatedTimestamp = timestamp;
        if (statusCode == STATUS_CODE_LATE_AIRLINE)
        {
            creditInsurees(flight, 150);
        }
    }

    // registered airlines support new airline to register
    function vote(address origin, address airline)
    external
    isAuthorizedCaller
    requireIsOperational
    isRegistered(origin)
    isFunded(origin)
    {
        bool isDuplicate = false;
        for(uint c = 0; c < airlines[airline].support_from_ra.length; c++) {
            if (airlines[airline].support_from_ra[c] == origin) {
                isDuplicate = true;
                break;
            }
        }
        require(!isDuplicate, "An airline can only vote once");
        airlines[airline].support_from_ra.push(origin);
        airlines[airline].votes = airlines[airline].votes.add(1);
    }

    /**
     * @dev Buy insurance for a flight
    *
    */
    function buy
    (
        address origin,
        string memory flight
    )
    public
    payable
    isAuthorizedCaller
    requireIsOperational
    {
        require(msg.value <= 1 ether, "Insurance amount must not be more than 1 ether");

        bool isDuplicate = false;
        for(uint i = 0; i < insurances[flight].passengers.length; i++) {
            if (insurances[flight].passengers[i] == origin) {
                isDuplicate = true;
                break;
            }
        }
        if (!isDuplicate)
        {
            insurances[flight].passengers.push(origin);
        }
        insurances[flight].amount[origin] = insurances[flight].amount[origin].add(msg.value);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
    (
        string memory flight,
        uint payoutFactor
    )
    public
    isAuthorizedCaller
    requireIsOperational
    {
        address temp_address;
        uint256 temp_payout;
        if (!insurances[flight].handled)
        {
            for (uint i = 0; i < insurances[flight].passengers.length; i++)
            {
                temp_address = insurances[flight].passengers[i];
                temp_payout = insurances[flight].amount[temp_address].mul(payoutFactor).div(100);
                balances[temp_address] = balances[temp_address].add(temp_payout);
            }
            insurances[flight].handled =true;
        }
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address origin)
    public
    isAuthorizedCaller
    requireIsOperational
    {
        require(balances[origin] > 0, "Not enough balance");
        uint256 _amount = balances[origin];
        balances[origin] = 0;
        origin.transfer(_amount);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
    (address origin)
    public
    payable
    isAuthorizedCaller
    requireIsOperational
    {
        if (msg.value >= 10 ether) {
            airlines[origin].isFunded = true;
        }
    }

    function getFlightKey
    (
        address airline,
        string memory flight,
        uint256 timestamp
    )
    pure
    internal
    returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function ()
    external
    payable
    isAuthorizedCaller
    {
        require(msg.data.length == 0);
    }

}


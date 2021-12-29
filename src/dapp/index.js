
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                console.log(result);
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

        DOM.elid('submit-balance').addEventListener('click', () => {
            // Write transaction
            contract.getBalance((error, result) => {
                display('Balance', 'Get Balance', [ { label: 'Balance', error: error, value: result} ]);
            });
        });

        DOM.elid('submit-buy').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let amount = DOM.elid('price').value;
            contract.buyInsurance(flight, amount, (error, result) => {
                display('Insurance', 'Bought', [ { label: 'Bought', error: error, value: "Bought insurance for " + flight + " for " + amount + " ETH"} ]);
            });
        });

        DOM.elid('submit-withdraw').addEventListener('click', () => {
            contract.withdraw((error, result) => {
                display('Withdraw', 'Withdraw', [ { label: 'Withdraw', error: error, value: "Withdrawed amount: " + result} ]);
            });
        });

        DOM.elid('submit-fund').addEventListener('click', () => {
            // Write transaction
            contract.fund((error, result) => {
                display('Fund', 'Funded', [ { label: 'Funded', error: error, value: "1 ETH funded to contract"} ]);
            });
        });
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}








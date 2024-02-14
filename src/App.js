import React, {useCallback, useEffect, useState} from "react";
import {filter, groupBy, includes, sortBy, sumBy, toLower} from "lodash";
import Papa from "papaparse";
import './App.css';
import RevenueChart from "./RevenueChart"; // import CSS file

function App() {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [predictions, setPredictions] = useState({});
    const [filteredData, setFilteredData] = useState(data);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [showUserTimeline, setShowUserTimeline] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);


    useEffect(() => {
        const csvFilePath = '/sample_dataset.csv';
        fetch(csvFilePath)
            .then(response => response.text())
            .then(data => {
                const csv = Papa.parse(data, { header: true, skipEmptyLines: true });
                const transactions = csv.data.map(transaction => ({
                    ...transaction,
                    event_time: new Date(transaction.event_time)
                }));
                setData(transactions);
                setFilteredData(transactions);
            })
            .catch(error => console.log(`Error! Unable to load the CSV file: ${error}`));

        const predictionsFilePath = '/export.csv';
        fetch(predictionsFilePath)
            .then(response => response.text())
            .then(data => {
                const csv = Papa.parse(data, { header: true, skipEmptyLines: true });
                const predictionsData = csv.data.reduce((acc, curr) => {
                    acc[curr.User_id] = parseFloat(curr.Prediction);
                    return acc;
                }, {});
                setPredictions(predictionsData);
            })
            .catch(error => console.log(`Error! Unable to load the CSV file: ${error}`));
    }, []);


    const filterData = (searchTerm) => {
        const lowerCaseSearchTerm = toLower(searchTerm);
        const filteredData = filter(data, (transaction) => {
            // Modify searchFields to include 'user_id' and make comparison exact for user_id
            const searchFields = ["category_code", "brand", "user_session", "event_type"];
            if (searchTerm === "") {
                setSelectedUser(null); // set selected user
                setShowUserTimeline(false); // set flag for showing user timeline
                return data
            }

            if(isNaN(searchTerm)) {
                setSelectedUser(null); // set selected user
                setShowUserTimeline(false); // set flag for showing user timeline

                // searchTerm is not a number, perform text comparison
                return searchFields.some((field) =>
                    includes(toLower(transaction[field]), lowerCaseSearchTerm)
                );
            } else {
                setSelectedUser(searchTerm); // set selected user
                setShowUserTimeline(true); // set flag for showing user timeline

                // searchTerm can be treated as user_id, perform an exact comparison
                return transaction.user_id === searchTerm;
            }
        });
        setFilteredData(filteredData);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        filterData(event.target.value);
    };

    const indexOfLastTransaction = currentPage * rowsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
    const currentTransactions = filteredData.slice(indexOfFirstTransaction, indexOfLastTransaction);

    const handleNextPage = () => {
        setCurrentPage(prevPage => prevPage + 1);
    };

    const handlePrevPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value));
        setCurrentPage(1);
    };

    // group by month-year and calculate revenue
    const userTransGroupedByMonthYear = groupBy(filteredData, transaction => transaction.event_time.toISOString().slice(0, 7));

    // prepare data for chart
    const userDataForChart = Object.keys(userTransGroupedByMonthYear).map(monthYearKey => {
        const transactionsOfMonthYear = userTransGroupedByMonthYear[monthYearKey];
        const monthYearRevenue = sumBy(transactionsOfMonthYear, transaction =>
            transaction.event_type === 'purchase' ? parseFloat(transaction.amount) : 0
        );
        return {
            month: monthYearKey,
            Actual: monthYearRevenue,
            Predicted: 0
        };
    });

    if (showUserTimeline) {
        const prediction = predictions[selectedUser];
        const existingData = userDataForChart.find(data => data.month === '2021-01' && data.user_id === selectedUser);
        if(existingData){
            existingData.Predicted = prediction;
        } else {
            userDataForChart.push({
                month: '2021-01',
                Actual: 0,
                Predicted: prediction
            });
        }
    }




    return (
        <div className="App">
            <h1 className="header-title">Customer Transactions</h1>

            <div className="buttons-container">
                <button className="btn" onClick={handlePrevPage} disabled={currentPage === 1}>Prev page</button>
                <button className="btn" onClick={handleNextPage}
                        disabled={currentTransactions.length < rowsPerPage}>Next page
                </button>

                <select className="select" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={100}>100</option>
                </select>
            </div>

            <input
                className="search-input"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            <table className="data-table">
                <thead>
                <tr className="table-header">
                    <th>Amount</th>
                    <th>Event Time</th>
                    <th>Event Type</th>
                    <th>User ID</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>User Session</th>
                </tr>
                </thead>
                <tbody>
                {currentTransactions.map((transaction) => (
                    <tr className="table-data" key={`${transaction.id}_${transaction.event_time.getTime()}`}>
                        <td>{transaction.amount}</td>
                        <td>{transaction.event_time.toLocaleString()}</td>
                        <td>{transaction.event_type}</td>
                        <td>{transaction.user_id}</td>
                        <td>{transaction.category_code}</td>
                        <td>{transaction.brand}</td>
                        <td>{transaction.user_session}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            {
                showUserTimeline && selectedUser && (
                    <div className="timeline-container">
                        <div className="timeline-container">
                            <h2>User ID: {selectedUser} - Purchase Timeline</h2>
                            <RevenueChart userData={userDataForChart}/>
                        </div>
                    </div>

                )
            }
        </div>
    );
}

export default App;
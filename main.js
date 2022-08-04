const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();
const { parse } = require('dotenv');
const bulkToBuk = require('./bulkToBUK');
const API_BUK_TOKEN = process.env.API_BUK_TOKEN;
const API_BUK_URL_EMPLOYEES = 'https://continuum.buk.pe/api/v1/peru/employees/active?page_size=100';
const API_BUK_URL_SALARIES = (date) => `https://continuum.buk.pe/api/v1/peru/payroll_detail/month?date=${date}&page_size=100`;


const bulktobuk = new bulkToBuk();
let dataEmployees;
let dataSalaries;
let date;
let parsedData;

/**
 * @return an object array with people from Buk
 */
async function getEmployees() {
    const res = await fetch(API_BUK_URL_EMPLOYEES, {
        method: 'GET',
        headers: {
            'auth_token': API_BUK_TOKEN,
        },
    });
    return dataEmployees = await res.json();
}

async function getSalaries(date) {
    const res = await fetch(API_BUK_URL_SALARIES(date), {
        method: 'GET',
        headers: {
            'auth_token': API_BUK_TOKEN,
        },
    });
    return dataSalaries = await res.json();
}

async function getDate() {
    const result = await bulktobuk.getRecordParameters();
    const month = result.month < 10 ? `0${result.month}` : result.month;
    return `01-${month}-${result.year}`;
}

/**
 * Parse data into Airtable format
 * @param {*} data array of data objects to parse
 * @returns object.array formated to airtable format
 */
async function parseDataBuk(employees, salaries) {
    let result = [];
    let aportes = [];
    let aporte = 0;
    for (let person = 0; person < employees.length; person++) {
        for (let salarie = 0; salarie < salaries.length; salarie++) {
            aportes = salaries[salarie].lines_settlement.filter(element => element.type === 'aporte');
            aporte = aportes.map(item => item.amount).reduce((prev, curr) => prev + curr, 0);
            if (employees[person].person_id === salaries[salarie].person_id && salaries[salarie].income_gross !== 0) {
                result.push(
                    {
                        //fields: campos deben tener nombres iguales a los de Airtable y tipos de valores correspondientes
                        "fields": {
                            "DNI": employees[person].rut,
                            "Name": employees[person].full_name,
                            "id": employees[person].id,
                            "remuneration liquid person": salaries[salarie].income_net,
                            "remuneration total person": salaries[salarie].income_gross,
                            "company contributions": aporte,
                            "total company cost": salaries[salarie].income_gross + aporte,
                            "Month": salaries[salarie].month,
                            "Year": salaries[salarie].year
                        }
                    }
                )
            }
        }
    }
    return result;
}

/**
 * Main function
 */
async function insertToAirtable() {
    date = await getDate();
    dataEmployees = await getEmployees();
    dataSalaries = await getSalaries(date);
    parsedData = await parseDataBuk(dataEmployees.data, dataSalaries.data);

    for (let x = 0; x < parsedData.length; x++) {
        let idExist = await bulktobuk.getRecord(parsedData[x].fields.Year, parsedData[x].fields.Month, parsedData[x].fields.Name);
        
        if (idExist.length > 0) {
            console.log('ya existe ID: ' + parsedData[x].fields.Name);
        }
        else {
            bulktobuk.createRecord(parsedData[x].fields);
            console.log('insertado el valor: ' + parsedData[x].fields.Name);
        }
    }
}

/**
 * Execution call
 */
insertToAirtable();

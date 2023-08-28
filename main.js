const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
//require('dotenv').config();
//const { parse } = require('dotenv');
const bulkToBuk = require('./bulkToBUK');
const API_BUK_TOKEN = process.env.API_BUK_TOKEN;
const API_BUK_URL_EMPLOYEES = 'https://continuum.buk.pe/api/v1/peru/employees?page_size=100';
const API_BUK_URL_SALARIES = (date) => `https://continuum.buk.pe/api/v1/peru/payroll_detail/month?date=${date}&page_size=100`;
const API_BUK_URL_AREAS =  'https://continuum.buk.pe/api/v1/peru/organization/areas/';

const bulktobuk = new bulkToBuk();
let dataEmployees;
let dataSalaries;
let date;
let parsedData;
let areas;

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

async function getArea(){
    const res = await fetch(API_BUK_URL_AREAS, {
        method: 'GET',
        headers: {
            'auth_token': API_BUK_TOKEN,
        },
    });
    return areas = await res.json();
}

async function getDate() {
    const result = await bulktobuk.getRecordParameters();
    const month = result.month < 10 ? `0${result.month}` : result.month;
    return `01-${month}-${result.year}`;
    //return '01-08-2023';
}

/**
 * Parse data into Airtable format
 * @param {*} data array of data objects to parse
 * @returns object.array formated to airtable format
 */
async function parseDataBuk(employees, salaries, areas) {
    let result = [];
//   let aportes = [];
//    let aporte = 0;
    let descuento = 0;
//    let area = {};
    for (let person = 0; person < employees.length; person++) {
        for (let salarie = 0; salarie < salaries.length; salarie++) {
            //aportes = salaries[salarie].lines_settlement.filter(element => element.type === 'aporte');
            //aporte = aportes.map(item => item.amount).reduce((prev, curr) => prev + curr, 0);
            //area = (areas.find(item => item.cost_center === employees[person].current_job.cost_center) != undefined)? areas.find(item => item.cost_center === employees[person].current_job.cost_center).name : ''
            if(employees[person].person_id === salaries[salarie].person_id && salaries[salarie].income_gross !== 0) {
                descuento =  (salaries[salarie].lines_settlement.find(element => element.name === 'Asignación Familiar') != undefined)? salaries[salarie].lines_settlement.find(element => element.name === 'Asignación Familiar').amount:0
                result.push(
                    {
                        //fields: campos deben tener nombres iguales a los de Airtable y tipos de valores correspondientes
                        "fields": {
                            "DNI": employees[person].document_number,
                            "Name": employees[person].full_name,
                            "id": employees[person].id,
                            "ceco": employees[person].current_job.cost_center,
                            "Sueldo": salaries[salarie].lines_settlement.find(element => element.name === 'Sueldo')?.amount || 0,
                            "remuneration liquid person": salaries[salarie].income_net,
                            "remuneration total person": salaries[salarie].income_gross,
                            "Asignación Familiar": salaries[salarie].lines_settlement.find(element => element.name === 'Asignación Familiar')?.amount || 0,
                            "Descanso Médico": salaries[salarie].lines_settlement.find(element => element.name === 'Descanso Médico')?.amount || 0,
                            "Bonificación Por Teletrabajo": salaries[salarie].lines_settlement.find(element => element.name === 'Bonificación Por Teletrabajo')?.amount || 0,
                            "Provisión Gratificacion": salaries[salarie].lines_settlement.find(element => element.name === 'Provisión Gratificacion')?.amount || 0,
                            "Essalud": salaries[salarie].lines_settlement.find(element => element.name === 'Essalud')?.amount || 0,
                            "Vida Ley": salaries[salarie].lines_settlement.find(element => element.name === 'Vida Ley - D.Leg 688')?.amount || 0,
                            "Provisión Bonificación Extraordinaria Gratificacion": salaries[salarie].lines_settlement.find(element => element.name === 'Provisión Bonificación Extraordinaria Gratificacion')?.amount || 0,
                            "Provisión Vacaciones Mensual": salaries[salarie].lines_settlement.find(element => element.name === 'Provisión Vacaciones Mensual')?.amount || 0,
                            "Provision CTS": salaries[salarie].lines_settlement.find(element => element.name === 'Provisión CTS')?.amount / 2 || 0,
                            "Eps": salaries[salarie].lines_settlement.find(element => element.name === 'Eps')?.amount || 0,
                            "Bono Internet": salaries[salarie].lines_settlement.find(element => element.name === 'Bono Internet')?.amount || 0,
                            "Bonificaciones Regulares": salaries[salarie].lines_settlement.find(element => element.name === 'Bonificaciones Regulares')?.amount || 0,
                            "Comisión": salaries[salarie].lines_settlement.find(element => element.name === 'Comisión')?.amount || 0,
                            "Gratificación Extraordinaria": salaries[salarie].lines_settlement.find(element => element.name === 'Gratificación Extraordinaria')?.amount || 0,
                            "Asignación Por Festividad": salaries[salarie].lines_settlement.find(element => element.name === 'Asignación Por Festividad')?.amount || 0,
                            "Licencia Paternidad": salaries[salarie].lines_settlement.find(element => element.name === 'Licencia Paternidad')?.amount || 0,
                            "Subvención de Prácticas": salaries[salarie].lines_settlement.find(element => element.name === 'Subvención de Prácticas')?.amount || 0,
                            "remuneration base": salaries[salarie].lines_settlement.find(element => element.name === 'Base de Vacaciones')?.amount - descuento,
                            "Month": salaries[salarie].month,
                            "Year": salaries[salarie].year,
                            "fecha ingreso": employees[person].current_job.start_date
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
    dataAreas = await getArea();

    parsedData = await parseDataBuk(dataEmployees.data, dataSalaries.data, dataAreas.data);
    
    for (let x = 0; x < parsedData.length; x++) {
        let idExist = await bulktobuk.getRecord(parsedData[x].fields.Year, parsedData[x].fields.Month, parsedData[x].fields.Name);

        if (idExist.length > 0) {
            console.log('ya existe ID: ' + parsedData[x].fields.id);
            console.log('existe el valor: ' + parsedData[x].fields.Name + " | ceco: " + parsedData[x].fields.centrocosto);
        }
        else {
            bulktobuk.createRecord(parsedData[x].fields);
            console.log('insertado el valor | ID:' + parsedData[x].fields.id + "Nombre: " + parsedData[x].fields.Name);
        }
    }
    
}

/**
 * Execution call
 */
insertToAirtable();

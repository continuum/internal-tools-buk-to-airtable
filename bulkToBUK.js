const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.API_KEY_AIRTABLE }).base(process.env.API_BASE_SALARY);
require('dotenv').config();

const table = base('Data BUK PE');
const parametros = base('Parameters');

class bulkToBuk {

    /**
     * 
     * @param {*} fields 
     */
    async createRecord(fields) {
        const createRecord = table.create(fields,
            function (err, records) {
                if (err)
                    console.error(err);
                return;
            });
    };

/**
 * Metodo que filtra datos en busqueda de coincidencia
 * @param {*} _year 
 * @param {*} _month 
 * @param {*} _name 
 * @returns 
 */
    async getRecord(_year, _month, _name) {
        const result =  table.select({filterByFormula: `unique = "${_year}-${_month}-${_name}"`}).all();
        return result;
    };

    /**
     * Obtiene parametros de mes y año para el exportado de datos
     */
    async getRecordParameters() {
        const record = await parametros.select().all()
        return record[0].fields;
    };
}

module.exports = bulkToBuk;
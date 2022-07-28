const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.API_KEY_AIRTABLE}).base(process.env.API_BASE_SALARY);
require('dotenv').config();

const table = base('Data BUK PE');
const parametros = base('Parameters');

class bulkToBuk {
    async createRecord(fields) 
    {
        const createRecord = table.create(fields, 
            function(err,records){
                if(err)
                console.error(err);
                return;
            });
    };

    async getRecord(_id) {
        try{
        const record = await table.select({filterByFormula: `id = ${_id}`}).all()
        return record;
        }
        catch(error)
        {
            console.log(error.message)
            return;
        }

    };

    async getRecordParameters() {
        const record = await parametros.select().all()
        return record[0].fields
    };
}

module.exports = bulkToBuk;
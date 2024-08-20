const Utilities = require('./functions');
const CustomUtilities = require('./custom_functions');
const Model = require('../model/model');
class TableModels {
    constructor(request, order = 'asc') {
        const { pagination, filters, filterTypes, endpoint, extraFetchParams } = request.body;
        const customFilter = extraFetchParams?.customFilter;
        const current = pagination?.current;
        const pageSize = pagination?.pageSize;
        const { start, end } = Utilities.getPageRange(current, pageSize, order);
        // console.log(request.body);
        this.table = endpoint?.table;
        this.res = [];
        this.start = start;
        this.end = end;
        this.recordPerPage = pageSize;
        this.totalCount = 0;
        this.like = '';
        this.operationSign = order == 'asc' ? '>=' : order == 'desc' ? '<=' : '>=';
        if ((filters && Object.keys(filters).length > 0) || customFilter) {
            let f = Utilities.removeNullFiltersNonMutated(filters);
            this.like = Utilities.getFilters(f, filterTypes, customFilter);
        }
        return this;
    }

    async get_aspirants_for_preview(acad_year) {
        const result = await new Model().multiSelect(['aspirant', 'aspirant_details', 'serial_pin'], [
            ['id as aspirant_row_id', 'applicant_id', 'index_no', 'email_sent'],
            ['*'],
            []
        ], null, true)
            .join('aspirant', 'aspirant_details', 'index_no', 'aspirant_id', 'INNER JOIN')
            .join('serial_pin', 'aspirant', 'payment_id', 'serial_pin_id', 'INNER JOIN')
            .where(`acad_year ='${acad_year}' AND lookup_id='bio' AND is_dependent='0' AND ${this.like ? this.like : '1'}`)
            .query();

        const res = Utilities.transformFieldTo2DArray(result, 'applicant_id', 'item', 'value');
        this.res = res?.slice(this.start - 1, this.end);
        this.totalCount = res.length;
        return this;
    }

}

module.exports = TableModels;
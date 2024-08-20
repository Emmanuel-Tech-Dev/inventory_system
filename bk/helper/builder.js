class Builder {
    constructor() {
        this.sql = '';
        this.whr = '';
        this.logoperator = null;
        this.reloperators = null;
        this.fieldLen = null;
        this.whichSelect = null;
        this.fromAppended = false;
        this.values = [];
        return this;
    }

    select(table, fields, others) {
        if (table == undefined || table == null) throw 'Parameter 1 of select is required';
        let f = '';
        if (fields == null || fields == '' || fields == undefined) {
            f = '*';
        } else {
            f = fields.join();
        }
        if (others == null || others == undefined) others = '';
        this.sql = `SELECT ${others} ${f} FROM ${table}`;
        this.whichSelect = 'simple';
        return this;
    }

    multiSelect(table, fields, others, explicitJoin) {
        if (table == undefined || table == null) throw 'Parameter 1 of select is required';
        if (typeof table == 'object' && table.length <= 1) throw 'For a single table, kindly use the select function';
        if (table.length != fields.length) throw 'The number of field groups must be equal to the number of the tables';
        let f = '';
        if (fields == null || fields == '' || fields == undefined) {
            f = '*';
        }
        let theFields = [];
        for (let i = 0; i < table.length; i++) {
            let tbl = table[i];
            let cols = fields[i];
            for (let j = 0; j < cols.length; j++) {
                let col = cols[j];
                theFields.push(`${tbl}.${col}`);
            }
        }
        f = theFields.join();
        table = table.join();
        let from = ` FROM ${table}`;
        if (explicitJoin) from = '';

        if (others == null || others == undefined) others = '';
        this.sql = `SELECT ${others} ${f} ${from}`;
        this.whichSelect = 'complex';
        return this;
    }
    
    where(criteria, fieldValue, reloperator='=', logoperator) {
        if (criteria == null && fieldValue == null) throw 'Error: Criteria parameters cannot be blank';
        if ((fieldValue != null || fieldValue != undefined) && (reloperator == undefined || reloperator == null)) throw 'Relational operator is required for the where clause';
        if ((fieldValue != null || fieldValue != undefined) && (fieldValue.length > 1) && (logoperator == undefined || logoperator == null)) throw 'Logical operator is required for the where clause';
        let w = ' WHERE ';
        if (criteria != null) {
            w += criteria;
        } else {
            if (fieldValue == null || fieldValue == undefined) {
                throw 'Error: Criteria parameters cannot be blank';
            }

            let flen = fieldValue.length;
            this.fieldLen = flen;
            if (logoperator == undefined || logoperator == null) logoperator = '';
            for (let i = 0; i < flen; i++) {
                let fv = Object.entries(fieldValue[i]);
                w += `${fv[0][0]}${reloperator}?`;
                this.values.push(fv[0][1]);
                if (i != flen - 1) w += ` ${logoperator} `;
            }
        }
        this.logoperator = logoperator;
        this.reloperators = reloperator;
        this.whr = w;
        this.sql += w;
        return this;
    }
    overrideLoperators(logoperator) {
        let allowed = ['AND', 'OR'];
        if (typeof logoperator != 'object' || logoperator == undefined) throw 'Error: An array of logical operators is required';
        if (logoperator.length != this.fieldLen - 1) throw 'Error: Number of logical operators must be number of fields minus 1';
        let pieces = this.whr.split(' ');
        let pointer = 0;
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].includes(this.logoperator)) {
                if (allowed.includes(logoperator[pointer].toUpperCase())) {
                    pieces[i] = pieces[i].replace(this.logoperator, logoperator[pointer]);
                } else {
                    console.log(`Logical Operator at ${pointer} is  not allowed`);
                }
                pointer++;
            }
        }
        let final = pieces.join(' ');;
        this.sql = this.sql.replace(this.whr, final);
        this.whr = final;
        return this;
    }
    overrideReloperators(reloperators) {
        let allowed = ['IN', 'NOT', 'NOT IN', '=', '<=>', '<>', '<', '>', '>=', '<=', '!=', 'LIKE'];
        if (typeof reloperators != 'object' || reloperators == undefined) throw 'Error: An array of relational operators is required';
        if (reloperators.length != this.fieldLen) throw 'Error: Number of relational operators must be equal to number of fields';
        let pieces = this.whr.split(' ');
        let pointer = 0;
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].includes(this.reloperators)) {
                if (allowed.includes(reloperators[pointer].toUpperCase())) {
                    pieces[i] = pieces[i].replace(this.reloperators, reloperators[pointer]);
                } else {
                    console.log(`Logical Operator at ${pointer} is  not allowed`);
                }
                pointer++;
            }
        }
        let final = pieces.join(' ');
        this.sql = this.sql.replace(this.whr, final);
        this.whr = final;
        return this;
    }

    join(table1, table2, field1, field2, joinType) {
        if (this.whichSelect == 'simple') throw 'Error: Please use the multiSelect method to enable join to work';
        let j = ``;
        if (table1 == undefined) throw 'Error: First table parameter is required';
        if (table2 == undefined) throw 'Error: Secondt table paremeter is required';
        if (this.fromAppended) {
            j = ` ${joinType} ${table1} ON ${table1}.${field1} =  ${table2}.${field2} `;
        } else {
            j = ` FROM ${table1} ${joinType} ${table2} ON ${table1}.${field1} =  ${table2}.${field2} `;
        }
        this.sql += j;

        this.fromAppended = true;
        return this;
    }

    from(stmt) {
        this.sql += ` FROM ${stmt}`;
        this.fromAppended = true;
        return this;
    }

    update(table, fieldsVals) {
        if (table == undefined || table == null) throw 'Parameter 1 of update is required';
        if (fieldsVals == undefined || fieldsVals == null) throw 'Parameter 2 of update is required';
        let len = fieldsVals.length;
        let sql = ` UPDATE  ${table} SET `;
        for (let i = 0; i < len; i++) {
            let fv = Object.entries(fieldsVals[i]);
            sql += ` ${fv[0][0]} = ?`;
            this.values.push(fv[0][1]);
            if (i != len - 1) {
                sql += ',';
            }
        }
        this.sql = sql;
        return this;
    }

    delete(table) {
        if (table == undefined || table == null) throw 'Parameter 1 of delete is required';
        this.sql = ` DELETE FROM ${table} `;
        return this;
    }

    insert(table, values, autoIncrement = true, others = '') {
        if (table == undefined || table == null) throw 'Parameter 1 of insert is required';
        if (values == undefined || values == null) throw 'Parameter 2 of insert is required';
        if (values == undefined || values == null) throw 'Parameter 3 of insert is required';
        let pholders = [];
        if (autoIncrement) {
            this.values.push(null);
            pholders.push('?');
        }
        for (let i = 0; i < values.length; i++) {
            this.values.push(values[i]);
            pholders.push('?');
        }
        this.sql = ` INSERT ${others} INTO ${table} VALUES (${pholders.join()}) `;
        return this;
    }
    insertSome(table, values, others = '') {
        if (table == undefined || table == null) throw 'Parameter 1 of insert is required';
        if (values == undefined || values == null) throw 'Parameter 2 of insert is required';
        if (values == undefined || values == null) throw 'Parameter 3 of insert is required';
        if (Array.isArray(values)) throw 'Parameter 2 of insertSome expected an Object and not Array';
        let pholders = [];
        let fields = [];
        for (let key in values) {
            this.values.push(values[key]);
            fields.push(key);
            pholders.push('?');
        }
        this.sql = ` INSERT ${others} INTO ${table} (${fields.join()}) VALUES (${pholders.join()}) `;
        return this;
    }
    async genInsertSomeFields(model, table, data) {
        if (!model) throw 'Parameter 1 of genInsertSomeFields is required';
        if (!table) throw 'Parameter 2 of genInsertSomeFields is required';
        if (!data) throw 'Parameter 3 of genInsertSomeFields is required';

        const desc = await new model().describe(table).query();
        let values = {};
        desc.forEach(col => {
            const field = col.Field;
            const type = col.Type;
            const isNull = col.Null;//value is either YES or NO            
            const v = data[field];
            if (v) {
                values[field] = v;
            } else {
                values[field] =
                    isNull === 'YES' ? null
                        : type.includes('int') ? 0
                            : type.includes('date') ? new Date()
                                : type.includes('decimal') ? 0
                                    : '';
            }
        });
        return values;
    }
    describe(table) {
        if (table == undefined || table == null) throw 'Parameter 1 of describe is required';
        this.sql = `DESCRIBE ${table}`;
        return this;
    }
    orderBy(fieldScheme) {//param can be a string or array
        if (!fieldScheme) throw 'One Parameter expected for orderBy to work';
        if (typeof fieldScheme === 'string') {
            this.sql += ` ORDER BY ${fieldScheme}`;
        } else if (typeof fieldScheme === 'object') {
            const od = fieldScheme?.join(' , ');
            this.sql += ` ORDER BY ${od}`;
        }
        return this;
    }
    groupBy(fields) {//param must be a string
        if (!fields) throw 'One Parameter expected for groupBy to work';
        if (typeof fields === 'string') {
            this.sql += ` GROUP BY ${fields}`;
        } else {
            throw 'Parameter must be a string';
        }
        return this;
    }
    limit(start, end) {
        if (start.toString().trim() === '') throw 'Parameter 1 is required for limit to work';
        this.sql += ` LIMIT ${start} ${end ? ',' + end : ''} `;
        return this;
    }
    setSql(sql) {
        this.sql = sql;
        return this;
    }
    getSql() {
        return this.sql;
    }
}

module.exports = Builder;
// const axios = require('axios');
const Model = require('../model/model');
const Builder = require('../helper/builder');
const Utilities = require('./functions');
const Settings = require('./settings');

// const fetch = require('node-fetch');
// const tf = require('@tensorflow/tfjs-node');
// const logger = require('morgan');
// const moment = require('moment');
const Mutex = require('async-mutex').Mutex;
const crypto = require("crypto");

const { request } = require('./functions');
const { response } = require('express');
// const { sign } = require('jsonwebtoken');
// const { response } = require('express');
const mutex = new Mutex();

var CustomUtilities = {
   
    async usersInMyDept(adminId) {
        const depts = await CustomUtilities.whatIsMyDept(adminId);
        const deptsInSQL = Utilities.generateSQLIn(depts.deptAlias);
        const usersInDept = await Utilities.getRows('admin_dept', ['admin_id'], 'dept', deptsInSQL);        
        return usersInDept;
    },

    async usersInDept(deptId) {
        const depts = await CustomUtilities.getDeptInOrgtype(deptId);
        const deptsInSQL = Utilities.generateSQLIn(depts.deptAlias);
        const users = await Utilities.getRows('admin_dept', ['admin_id'], 'dept', deptsInSQL);          
        return users;
    },

    async whatIsMyDept(adminId) {
        if (!adminId) return {};
        const res = await new Model().multiSelect(['admin_dept', 'organizational_type'], [
            ['dept'],
            ['id', 'name', 'super_ou_type', 'type']
        ], null, true)
            .join('admin_dept', 'organizational_type', 'dept', 'alias', 'INNER JOIN')
            .where(null, [{ 'admin_dept.admin_id': adminId }, { blocked: 0 }], '=', 'AND')
            .query();

        let v = await CustomUtilities.recurDept(res, []);

        const final = [...res, ...v];
        const r = { deptAlias: [], deptIDS: [], deptNames: [], result: final };
        final.forEach(v => {
            r.deptAlias.push(v.dept);
            r.deptIDS.push(v.id);
            r.deptNames.push(v.name);
        });
        return r;
    },

    async getDeptInOrgtype(orgType) {
        const res = await new Model().select('organizational_type', ['id', 'name', 'super_ou_type', 'type', 'alias'])
            .where(null, [{ alias: orgType }], '=', null)
            .query();
        let v = await CustomUtilities.recurDept(res, []);
        const final = [...res, ...v];
        const r = { deptAlias: [], deptIDS: [], deptNames: [], result: final };
        final.forEach(v => {
            r.deptAlias.push(v.dept || v.alias);
            r.deptIDS.push(v.id);
            r.deptNames.push(v.name);
        });
        return r;
    },

    recurDept(res, output) {
        return new Promise((resolve, reject) => {
            res.forEach(async v => {
                const res1 = await new Model().select('organizational_type', ['id', 'name', 'super_ou_type', 'type', 'alias as dept'])
                    .where(null, [{ super_ou_type: v.id }], '=', null)
                    .query();
                if (res1.length >= 1) {
                    output.push(...res1);
                    await CustomUtilities.recurDept(res1, output);
                }
            });
            setTimeout(e => {
                resolve(output);
            }, 1000);
        });
    },

    async recurDeptUp(rowId, output) {
        const res1 = await new Model().select('organizational_type', ['id', 'name', 'super_ou_type', 'type', 'alias as dept'])
            .where(null, [{ id: rowId }], '=', null)
            .query();

        if (res1.length >= 1 && res1[0]?.type != 0) {
            output.push(...res1);
            const superType = res1[0]?.super_ou_type;
            await CustomUtilities.recurDeptUp(superType, output);
        }
        return output;
    },

    async orgTypeDetails(alias) {
        const res1 = await new Model().select('organizational_type', ['*'])
            .where(null, [{ alias }], '=', null)
            .query();
        return res1;
    },
   
   

}



module.exports = CustomUtilities;

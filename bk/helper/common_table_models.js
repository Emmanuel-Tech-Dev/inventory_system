const Utilities = require('./functions');
const CustomUtilities = require('./custom_functions');
const Model = require('../model/model');
const TableModels = require('./table_models');
class CommonTableModels extends TableModels {
    constructor(request, order = 'asc') {
        super(request, order);
        return this;
    }

    async get_admin_dept() {
        const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
        const colName = parsedCredentialsMeta?.username;
        const result = await new Model().setSql(`SELECT admin_dept.id,admin_id,dept,blocked,admin.name as adminName,organizational_type.name as orgType
            FROM admin_dept,admin,organizational_type 
            WHERE  admin_dept.admin_id = admin.${colName} 
            AND organizational_type.alias = admin_dept.dept
            AND 1 ${this.like ? ` AND ${this.like}` : ''} `)
            .query();

        this.res = result?.slice(this.start - 1, this.end);
        this.totalCount = result.length;
        return this;
    }

    async get_admin_role_files_link() {
        const result = await new Model().setSql(`SELECT admin_role_files_link.id,role_id,file_id,arf_link_restricted,admin_role.role,admin_files.description
            FROM admin_role_files_link,admin_role,admin_files
            WHERE  admin_role_files_link.role_id = admin_role.custom_id
            AND admin_files.path = admin_role_files_link.file_id
            AND 1 ${this.like ? ` AND ${this.like}` : ''} `)
            .query();

        this.res = result?.slice(this.start - 1, this.end);
        this.totalCount = result.length;
        return this;
    }

    async get_admin_role_link() {
        const parsedCredentialsMeta = await Utilities.getCredentialsMeta();
        const colName = parsedCredentialsMeta?.username;
        const result = await new Model().setSql(`SELECT admin_role_link.id,role_id,admin_id,admin_role.role,admin.name
            FROM admin_role_link,admin_role,admin
            WHERE  admin_role_link.role_id = admin_role.custom_id
            AND admin.${colName} = admin_role_link.admin_id
            AND 1 ${this.like ? ` AND ${this.like}` : ''} `)
            .query();
        this.res = result?.slice(this.start - 1, this.end);
        this.totalCount = result.length;

        return this;
    }
}

module.exports = CommonTableModels;
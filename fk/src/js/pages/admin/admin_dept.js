
import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import ValuesStore from '../../store/values-store';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import utils from '../../dependencies/custom/react-utilities';
import { Space, Table, Button, Card } from 'antd';
// import { Card, Input, Avatar, Dropdown, Button, Affix, Space, Modal, Empty, Badge, Menu } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import qs from 'qs';
import useTable from '../../hooks/table';
import useEdit from '../../hooks/edit';
import useAdd from '../../hooks/add';
import useDelete from '../../hooks/delete';
import Settings from '../../dependencies/custom/settings';


const AdminSettings = (props) => {
    const valuesStore = ValuesStore();
    const edit = useEdit('tables_metadata', 'table_name');//make this hook be aware of where to get tbl metadata 
    const add = useAdd('tables_metadata', 'table_name');
    const del = useDelete();
    const { filters, filterTypes } = utils.generateTableFilters();
    const navigate = useNavigate();
    //and key value that points to the table names from zustand store.    
    const table = useTable(
        {
            pagination: {
                current: 1,
                pageSize: 10,
                hideOnSinglePage: true,
            },
            filters: { ...filters },
            filterTypes: { ...filterTypes }
        },
        `${Settings.backend}/get_admin_dept`,
        'post',
        'result',
        'totalCount',
        'id',
        { prop: 'LIKE', value: 'LIKE' },
        { table: 'admin_dept', fields: ['*'] });

    const columns = ([
        {
            title: 'User',
            dataIndex: 'adminName',
            ...table.getColumnSearchProps('adminName'),
        },
        {
            title: 'Dept',
            dataIndex: 'orgType',
            filterSearch: true
            // ...table.getColumnSearchProps('orgType'),
        },
        // {
        //     title: 'Group',
        //     dataIndex: 'group_name',
        //     ...table.getColumnSearchProps('group_name'),
        // },
        // {
        //     title: 'Comment',
        //     dataIndex: 'comment',
        // },
        // {
        //     title: 'Is Public',
        //     dataIndex: 'is_public',
        // },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                return <Space size="middle">
                    <Button className='btn-successx border-0x' onClick={e => editRecord(record, 'admin_dept')}><i className='fas fa-edit text-success' /></Button>
                    {del.confirm(
                        `${Settings.backend}/delete`,
                        record,
                        'Are you sure to delete this item',
                        { tableName: 'admin_dept', where: 'id', whereType: 'closed' },
                        <Button className='btn-dangerx border-0x'>  <i className='fas fa-trash text-danger' /></Button>
                    )}
                </Space>
            },
        },
    ]);


    function editRecord(record, tableName) {
        const storeKey = 'editableRecord';
        valuesStore.setValue(storeKey, record);
        edit.setTblName(tableName);
        edit.setData(record);
        edit.setRecordKey(storeKey);
        edit.setShowModal(true);
        edit.setSaveCompleted(false);
    }

    function addRecord(tableName = 'admin_dept') {
        add.setTblName(tableName);
        add.setShowModal(true);
        add.setSaveCompleted(false);
    }

    async function editOnOk() {
        let res = await edit.save(undefined, `${Settings.backend}/edit`, 'admin_dept', { tbl: 'admin_dept', where: 'id', whereType: 'closed' })
    }

    async function addOnOk() {
        // let res = await add.save(`${Settings.backend}/add`, { tbl: 'settings' })
        await add.save(undefined, { tbl: 'admin_dept' });
    }
    const colFilters = [
        {
            filter: 'orgType',
            sql: "SELECT alias,name FROM organizational_type ",
            key: 'alias',
            value: 'name'
        }
    ];

    useMemo(() => {
        table.setColumns(columns);
        table.setColFilters(colFilters, columns, `${Settings.backend}/get_col_filters`);
        console.log('looping')
        table.fetchData();
    }, [add.saveCompleted, edit.saveCompleted, del.saveCompleted]);


    return (
        <>
            {/* {console.log('render render')} */}
            <div className='container-fluid' /*style={{ marginTop: '4rem' }}*/>
                <div className='row'>
                    <Card
                        bordered={false}
                        className="criclebox tablespace border-0 mb-24 p-2"
                        title="User Departments"
                        extra={
                            <Space>
                                <Button className='btn-primary border-0' onClick={e => addRecord()}><i className='fas fa-user-plus me-2' /> Add New Item</Button>
                            </Space>
                        }
                    >
                        {table.table}
                    </Card>                 
                </div>
            </div>
            {edit.editModal('Edit Settings', editOnOk)}
            {add.addModal('Add New Settings', addOnOk)}
        </>
    );
}

export default memo(AdminSettings);
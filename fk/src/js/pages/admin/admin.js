
import React, { useState, useEffect, memo, useMemo, useRef } from 'react';
import ValuesStore from '../../store/values-store';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import utils from '../../dependencies/custom/react-utilities';
import { Space, Button, Card } from 'antd';
// import { Card, Input, Avatar, Dropdown, Button, Affix, Space, Modal, Empty, Badge, Menu } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import qs from 'qs';
import useTable from '../../hooks/table';
import useAdd from '../../hooks/add';
import useDelete from '../../hooks/delete';
import Settings from '../../dependencies/custom/settings';


const Admin = (props) => {
    const valuesStore = ValuesStore();
    const add = useAdd('tables_metadata', 'table_name');
    const del = useDelete();
    const { filters, filterTypes } = utils.generateTableFilters();
    const keyOverrides = { categoryAlias: 'category' };
    const [modalTitle, setModalTitle] = useState('Add New User');
    //and key value that points to the table names from zustand store.    
    const table = useTable(
        {
            pagination: {
                current: 1,
                pageSize: 10,
                position: ['bottomRight'],
                hideOnSinglePage: true
            },
            filters: { ...filters },
            filterTypes: { ...filterTypes }
        },
        `${Settings.backend}/get_data`,
        'post',
        'result',
        'totalCount',
        'id',
        { /*alias: 'LIKE', acadyr: 'LIKE', semester: 'IN', end_date: 'IN', is_active: 'IN' */ },
        { table: 'admin', fields: ['*'] });


    const columns = ([
        {
            title: 'Name',
            dataIndex: 'name',
            ...table.getColumnSearchProps('name'),
        },
        {
            title: 'Staff Id',
            dataIndex: 'staff_id',
            ...table.getColumnSearchProps('staff_id'),
        },
        {
            title: 'Primary Role',
            dataIndex: 'primary_role',
            ...table.getColumnSearchProps('primary_role'),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                return <Space size="middle">
                    {/* <Button className='btn-secondary border-0' onClick={e => manageScope(record)}><i className='fas fa-eye' /></Button> */}
                    {/* <Button className='btn-secondary border-0' onClick={e => manageScope(record)}><i className='fas fa-eye' /></Button> */}
                    <Button className='btn-successx border-0x' onClick={e => editRecord(record, 'admin')}><i className='fas fa-edit text-success' /></Button>
                    {del.confirm(
                        `${Settings.backend}/delete`,
                        record,
                        'Are you sure to delete this item',
                        { tableName: 'admin', where: 'id', whereType: 'closed' },
                        <Button className='btn-dangerx border-0x'>  <i className='fas fa-trash text-danger' /></Button>,
                        undefined, undefined, undefined, afterDelete
                    )}
                </Space>
            },
        },
    ]);

    async function manageScope() {

    }

    async function afterDelete(status, msg, data) {
        const rc = valuesStore.getArrayObjectsValue('settings', 'prop', 'deleteAdmin');
        const res = await utils.requestWithReauth('post', rc?.value, null, data);
        if (res.status == 'Ok') {
            utils.showNotification(undefined, 'User has been deleted from authentication system', 'text-success');
        } else {
            utils.showNotification(undefined, 'User could not be deleted from authentication system');
        }
    }

    async function editRecord(record, tableName) {
        setModalTitle('Edit Item');
        const rc = valuesStore.getArrayObjectsValue('settings', 'prop', 'getAdmin');
        const res = await utils.requestWithReauth('post', rc?.value, null, record);
        add.setTblName(tableName);
        add.setShowModal(true);
        add.setSaveCompleted(false);
        if (res.status == 'Ok') {
            const result = res.results[0];
            record['block'] = result?.block?.toString();
            record['username'] = result?.username;
            record['campus'] = result?.campus;
            record['email'] = result?.email;
            record['auth_id'] = result?.id;
            record['to_reset'] = result?.to_reset?.toString();
            record['telephone'] = result?.telephone;
        }
        add.setRecord({ ...record });
    }


    function addRecord(tableName = 'admin') {
        add.setTblName(tableName);
        add.setShowModal(true);
        add.setSaveCompleted(false);
    }

    async function addOnOk() {
        try {
            add.setLoading(true);
            const rc = valuesStore.getArrayObjectsValue('settings', 'prop', 'saveAdmin');
            let saveToAuth = await utils.requestWithReauth('post', rc?.value, null, { ...add.record, origin: window.location.origin });
            if (saveToAuth.status == 'Ok') {
                let res = await utils.requestWithReauth('post', `${Settings.backend}/save_user_account_details`, null, add.record)
                if (res.status == 'Ok') {
                    utils.showNotification(undefined, 'Operation successful', 'text-success');
                    add.reset();
                } else {

                    utils.showNotification(undefined, res.msg);
                }
            } else {
                utils.showNotification(undefined, saveToAuth.details);
            }
            add.setLoading(false);
        } catch (err) {
            add.setLoading(false);
        }
    }


    useMemo(() => {
        table.setColumns(columns);
        console.log('looping')
        table.fetchData();
    }, [add.saveCompleted, del.saveCompleted, table.extraFetchParams]);


    return (
        <>
            {/* {console.log('render render')} */}
            <div className='container-fluidx' /*style={{ marginTop: '4rem' }}*/>
                <div className='row'>
                    <div className='col-md-12 mb-2'>
                        <Card
                            bordered={false}
                            className="criclebox tablespace border-0 mb-24 p-2"
                            title="Users"
                            extra={
                                <div className='d-flex'>
                                    <Button className='btn-primary border-0' onClick={e => addRecord()}><i className='fas fa-user-plus me-2' /> Add New Item</Button>
                                </div>
                            }
                        >
                            {table.table}
                        </Card>
                    </div>                   
                </div>
            </div>
            {add.addModal(modalTitle, addOnOk)}
        </>
    );
}

export default memo(Admin);
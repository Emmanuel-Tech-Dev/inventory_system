
import React, { useState, memo, useMemo, useRef } from 'react';
import utils from '../dependencies/custom/react-utilities';
import { Space, Table, Button, Input, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import qs from 'qs';



const useTable = (initTblParam, dataEndpoint, requestMethod = 'get', resultKey, totalCountKey, rowId, filterTypes, extraEndpoint = null, autoFetch = true) => {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [columns, setColumns] = useState([]);
    const [tableParams, setTableParams] = useState({ ...initTblParam });
    const [extraFetchParams, setExtraFetchParams] = useState(undefined);
    const [cssClasses, setCssClasses] = useState('');
    const [rowClassNameKey, setRowClassNameKey] = useState('');
    const [selectionType, setSelectionType] = useState('checkbox');
    const [allowSelection, setAllowSelection] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [rowSelectionObject, setRowSelectionObject] = useState(rowSelection());
    const [selectedRows, setSelectedRows] = useState([]);
    const [dataURL, setDataURL] = useState();
    const [currentSelectedRow, setCurrentSelectedRow] = useState({});
    const [title, setTitle] = useState();
    const [footer, setFooter] = useState();
    const [queryResult, setQueryResult] = useState();
    const [extraDataKey, setExtraDataKey] = useState('');
    const [extraData, setExtraData] = useState();
    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };


    const getQueryParams = (params) => ({
        results: params.pagination?.pageSize,
        page: params.pagination?.current,
        ...params,
    });

    async function setColFilters(d, columns, url) {
        const data = { data: d };
        const res = await utils.requestWithReauth('post', url, null, data);
        const finalFilters = res.result?.map((r) => {
            const result = r.res;
            const filter = r.filter;
            const key = r.key;
            const value = r.value;
            const vl = value?.split(',');
            const f = result.map((rr) => {
                // const v = rr[vl]?.map()?.join(' - ');                
                const val = vl?.map(v => rr[v])?.join(' - ');
                return {
                    filter,
                    // text: rr[value],
                    text: val,
                    value: rr[key],
                }
            });
            return f;
        });
        columns?.forEach((c) => {
            finalFilters?.forEach((finalFilter) => {
                const filter = finalFilter[0]?.filter;
                if (c.dataIndex === filter) {
                    if (Array.isArray(c['filters'])) {
                        c['filters'] = [...finalFilter, c['filters']];
                    } else {
                        c['filters'] = finalFilter;
                    }
                }
            })
        })
    }

    const fetchData = async () => {
        setLoading(true);
        let results = [];
        if (requestMethod === 'get') {
            results = await utils.requestWithReauth(requestMethod, `${dataEndpoint ?? dataURL}?${qs.stringify(getQueryParams(tableParams))}`, null, undefined);
        } else if (requestMethod === 'post') {
            const data = getQueryParams(tableParams);
            results = await utils.requestWithReauth(requestMethod, `${dataEndpoint ?? dataURL}`, extraEndpoint, { ...data, extraFetchParams });
        }
        setExtraData(results[extraDataKey] || []);
        setQueryResult(results);
        setData(results[resultKey] || []);
        setLoading(false);
        setTableParams({
            ...tableParams,
            pagination: {
                ...tableParams.pagination,
                total: parseInt(results[totalCountKey]),
            },
        });
    }


    const handleTableChange = (pagination, filters, sorter) => {

        setTableParams(r => {
            return {
                pagination,
                filters: { ...r.filters, ...filters },
                sorter: { ...sorter },
                ...sorter,
                filterTypes,
            }
        });
        // `dataSource` is useless since `pageSize` changed
        // if (pagination.pageSize !== tableParams.pagination?.pageSize && dataEndpoint) {
        //     setData([]);
        // }
    };


    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div
                style={{
                    padding: 8,
                }}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{
                        marginBottom: 8,
                        display: 'block',
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({
                                closeDropdown: false,
                            });
                            setSearchText(selectedKeys[0]);
                            setSearchedColumn(dataIndex);
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            close();
                            // handleReset(clearFilters);
                            // confirm();
                        }}
                    >
                        close
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined
                style={{
                    color: filtered ? '#1890ff' : undefined,
                }}
            />
        ),
        onFilter: (value, record) => {
            return record[dataIndex]?.toString()?.toLowerCase()?.includes(value.toLowerCase())
        },
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{
                        backgroundColor: '#ffc069',
                        padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });

    function rowSelection() {
        return {
            selections: [
                Table.SELECTION_ALL,
                Table.SELECTION_INVERT,
                Table.SELECTION_NONE
            ],

            onChange: (selRowKeys, selRows) => {
                setSelectedRowKeys(selRowKeys);
                setSelectedRows(selRows);
            },
            //single item selection
            onSelect(record, selected, selectedRows, nativeEvent) {
                setCurrentSelectedRow({ record, selected, selectedRows, nativeEvent });
            },
            //all selected
            onSelectAll(selected, selectedRows, changeRows) {

            },
            //on toggle selection
            onSelectInvert(selectedRowKeys) {

            },
            onSelectNone() {

            },
            onSelectMultiple(selected, selectedRows, changeRows) {

            }
        }
    };

    function rowSelectionDebug() {
        /*a hack to deselect selected rows. 
                    adding selectedRowKeys object to the table does not allow the checkboxes to be checked
                    so in order to make it work, copy the rowSelectionObject without the selectedRowKeys
                    and and set a new rowSelectionObject with the an empty selectedRowKeys to deselect checkboxes
                    Aterwards, set the rowSelctionObject back to the previous*/
        const prevRowSelectionObject = rowSelectionObject;
        setRowSelectionObject({
            ...prevRowSelectionObject,
            selectedRowKeys: [],
        });
        setTimeout(() => {
            setRowSelectionObject(prevRowSelectionObject);
        }, 1000);
    }


    useMemo(() => {
        // console.log('table hook looping');                
        //if autofetch is enabled and dataEndpoint is truthy  
        if ((dataEndpoint || dataURL) && autoFetch && !loading) {
            fetchData();
        }
    }, [JSON.stringify(tableParams), columns, JSON.stringify(extraFetchParams), /*allowSelection,*/ selectedRows, selectedRowKeys, rowSelectionObject, dataURL]);

    const table = <Table
        rowSelection={allowSelection ? rowSelectionObject : undefined}
        className={cssClasses}
        rowClassName={(record) => record[rowClassNameKey]}
        columns={columns}
        rowKey={(record) => record[rowId]}
        dataSource={data}//data
        pagination={tableParams.pagination}
        loading={loading}
        size='small'
        onChange={handleTableChange}
    />;

    function tableWithHeader(header, extraProps = {}) {
        return <Table
            rowSelection={allowSelection ? rowSelectionObject : undefined}
            className={cssClasses}
            rowClassName={(record) => record[rowClassNameKey]}
            columns={columns}
            rowKey={(record) => record[rowId]}
            dataSource={data}//data
            pagination={tableParams.pagination}
            loading={loading}
            size='small'
            title={() => typeof header === 'function' ? header(queryResult || data) : <label className='fw-bold text-primary'>Total Count:  {queryResult?.[totalCountKey]}</label>}
            onChange={handleTableChange}
            {...extraProps}
        />;
    }

    function tableWithFooter(footer, extraProps = {}) {
        return <Table
            rowSelection={allowSelection ? rowSelectionObject : undefined}
            className={cssClasses}
            rowClassName={(record) => record[rowClassNameKey]}
            columns={columns}
            rowKey={(record) => record[rowId]}
            dataSource={data}//data
            pagination={tableParams.pagination}
            loading={loading}
            size='small'
            footer={() => typeof footer === 'function' ? footer(queryResult || data) : <label className='fw-bold text-primary'>Total Count:  {queryResult?.[totalCountKey]}</label>}
            onChange={handleTableChange}
            {...extraProps}
        />;
    }

    function tableWithHeaderFooter(header, footer) {
        return <Table
            rowSelection={allowSelection ? rowSelectionObject : undefined}
            className={cssClasses}
            rowClassName={(record) => record[rowClassNameKey]}
            columns={columns}
            rowKey={(record) => record[rowId]}
            dataSource={data}//data
            pagination={tableParams.pagination}
            loading={loading}
            size='small'
            title={() => typeof header === 'function' ? header(queryResult || data) : <label className='fw-bold text-primary'>Total Count:  {queryResult?.[totalCountKey]}</label>}
            footer={() => typeof footer === 'function' ? footer(queryResult || data) : <label className='fw-bold text-primary'>Total Count:  {queryResult?.[totalCountKey]}</label>}
            onChange={handleTableChange}
        />;
    }

    return {
        title, setTitle, footer, setFooter,
        rowSelectionDebug,
        selectedRows, setSelectedRows,
        rowSelectionObject, setRowSelectionObject,
        setAllowSelection, selectionType, setSelectionType,
        rowClassNameKey, setRowClassNameKey, cssClasses,
        setCssClasses, handleReset, table,
        setColumns, getColumnSearchProps,
        setData, fetchData, setColFilters,
        setExtraFetchParams, extraFetchParams,
        data, selectedRowKeys, setSelectedRowKeys,
        tableParams, setTableParams, dataURL, setDataURL,
        loading, setLoading, currentSelectedRow, setCurrentSelectedRow,
        queryResult, setQueryResult, tableWithHeader, tableWithFooter, tableWithHeaderFooter,
        extraDataKey, setExtraDataKey, extraData, setExtraData
    }
}

export default useTable;
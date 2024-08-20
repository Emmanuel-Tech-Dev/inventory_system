import React, { useState, useEffect, memo, useMemo, useRef } from "react";
import ValuesStore from "../../store/values-store";
import {
  useSearchParams,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import utils from "../../dependencies/custom/react-utilities";
import { Space, Button, Card, Tag, Tooltip } from "antd";
// import { Card, Input, Avatar, Dropdown, Button, Affix, Space, Modal, Empty, Badge, Menu } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import qs from "qs";
import useTable from "../../hooks/table";
import useEdit from "../../hooks/edit";
import useAdd from "../../hooks/add";
import useDelete from "../../hooks/delete";
import Settings from "../../dependencies/custom/settings";

const AllCategories = (props) => {
  const valuesStore = ValuesStore();
  const edit = useEdit("tables_metadata", "table_name"); //make this hook be aware of where to get tbl metadata
  const add = useAdd("tables_metadata", "table_name");
  const del = useDelete();
  const { filters, filterTypes } = utils.generateTableFilters();
  const [dateRange, setDateRange] = useState([]);
  const navigate = useNavigate();
  const keyOverrides = { categoryAlias: "category" };


  const [editRow , setEditRow] = useState('')

  //and key value that points to the table names from zustand store.
  const table = useTable(
    {
      pagination: {
        current: 1,
        pageSize: 10,
        position: ["bottomRight"],
        hideOnSinglePage: true,
      },
      filters: { ...filters },
      filterTypes: { ...filterTypes },
    },
    `${Settings.backend}/get_data`,
    "post",
    "result",
    "totalCount",
    "id",
    {
      /*alias: 'LIKE', acadyr: 'LIKE', semester: 'IN', end_date: 'IN', is_active: 'IN' */
    },
    { table: "inventory_category", fields: ["*"] }
  );

  const columns = [
    {
      title: "Category",
      dataIndex: "name",
      ...table.getColumnSearchProps("name"),

      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Alias",
      dataIndex: "alias",
    },
    {
      title: "Description",
      dataIndex: "description",
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Tooltip title="Edit Products">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => editRecord(record, "inventory_category")}
              >
                <i className="fas fa-edit text-success" />
              </Button>
            </Tooltip>

            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              {
                tableName: "inventory_category",
                where: "id",
                whereType: "closed",
              },
              <Button className="btn-dangerx border-0x">
                {" "}
                <i className="fas fa-trash text-danger" />
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const subTable = useTable(
    {
      pagination: {
        current: 1,
        pageSize: 10,
        position: ["bottomRight"],
        hideOnSinglePage: true,
      },
      filters: { ...filters },
      filterTypes: { ...filterTypes },
    },
    `${Settings.backend}/get_data`,
    "post",
    "result",
    "totalCount",
    "id",
    {
      /*alias: 'LIKE', acadyr: 'LIKE', semester: 'IN', end_date: 'IN', is_active: 'IN' */
    },
    { table: "sub_category", fields: ["*"] }
  );

  const subColumns = [
    {
      title: "Sub Category",
      dataIndex: "name",
      ...table.getColumnSearchProps("name"),

      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Alias",
      dataIndex: "alias",
    },
    {
      title: "Main Category",
      dataIndex: "category",
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Tooltip title="Edit Products">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => editSubCat(record, "sub_category")}
              >
                <i className="fas fa-edit text-success" />
              </Button>
            </Tooltip>

            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              {
                tableName: "sub_category",
                where: "id",
                whereType: "closed",
              },
              <Button className="btn-dangerx border-0x">
                {" "}
                <i className="fas fa-trash text-danger" />
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  function editRecord(record, tableName) {
    utils.renameKeys(record, keyOverrides);
    const storeKey = "editableRecord";
    valuesStore.setValue(storeKey, record);
    edit.setTblName(tableName);
    edit.setData(record);
    edit.setRecordKey(storeKey);
    edit.setShowModal(true);
    edit.setSaveCompleted(false);
    setEditRow(tableName)
  }

  function editSubCat(record, tableName) {
    utils.renameKeys(record, keyOverrides);
    const storeKey = "editableRecord";
    valuesStore.setValue(storeKey, record);
    edit.setTblName(tableName);
    edit.setData(record);
    edit.setRecordKey(storeKey);
    edit.setShowModal(true);
    edit.setSaveCompleted(false);
    setEditRow(tableName);
  }

  function addCategory(tableName = "inventory_category") {
    add.setTblName(tableName);
    add.setShowModal(true);
    add.setSaveCompleted(false);
  }

  function addSubCategory(tableName = "sub_category") {
    add.setTblName(tableName);
    add.setShowModal(true);
    add.setSaveCompleted(false);
  }

  //   async function editOnOk() {
  //     let res = await edit.save(
  //       undefined,
  //       `${Settings.backend}/edit`,
  //       "product",
  //       { tbl: "product", where: "id", whereType: "closed" }
  //     );
  //     console.log(res);
  //   }

  async function editCategoryOnOk() {
    let res = await edit.save(
      undefined,
      `${Settings.backend}/edit`,
      "inventory_category",
      { tbl: "inventory_category", where: "id", whereType: "closed" }
    );

    setEditRow('')
    console.log(res);
  }

  async function editSubCategoryOnOk() {
    let res = await edit.save(
      undefined,
      `${Settings.backend}/edit`,
      "sub_category",
      { tbl: "sub_category", where: "id", whereType: "closed" }
    );
    setEditRow('')
    console.log(res);
  }

  async function addCategoryOnOk() {
    let res = await add.save(`${Settings.backend}/add`, {
      tbl: "inventory_category",
    });

    console.log(res);
  }

  async function addSubCategoryOnOk() {
    let res = await add.save(`${Settings.backend}/add`, {
      tbl: "sub_category",
    });

    console.log(res);
  }

  useMemo(() => {
    table.setColumns(columns);
    subTable.setColumns(subColumns);
    console.log("looping");
    table.fetchData();
  }, [
    add.saveCompleted,
    edit.saveCompleted,
    del.saveCompleted,
    table.extraFetchParams,
  ]);



  return (
    <>
      {/* {console.log('render render')} */}
      <div className="containerx" /*style={{ marginTop: '4rem' }}*/>
        <div className="row">
          <div className="col-md-6">
            <Card
              bordered={false}
              className="criclebox tablespace border-0 mb-24 p-2"
              title="Categories"
              extra={
                <Space>
                  <Button
                    className="btn-primary border-0"
                    onClick={(e) => addCategory()}
                  >
                    <i className="fas fa-cart-plus me-2" /> New Category
                  </Button>
                </Space>
              }
            >
              <div className="row">
                <div className="col-md-12">
                  <div className="h-scrolling-wrapper">{table.table} </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-md-6">
            <Card
              bordered={false}
              className="criclebox tablespace border-0 mb-24 p-2"
              title="Sub Categories"
              extra={
                <Space>
                  <Button
                    className="btn-primary border-0"
                    onClick={(e) => addSubCategory()}
                  >
                    <i className="fas fa-cart-arrow-down me-2" /> New
                    Sub-Category
                  </Button>
                </Space>
              }
            >
              <div className="row">
                <div className="col-md-12">{subTable.table}</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {editRow === "inventory_category"
        ? edit.editModal("Edit Category", editCategoryOnOk)
        : edit.editModal("Edit Sub Category", editSubCategoryOnOk)}
     
      {add.tblName === "inventory_category"
        ? add.addModal("Add New Category", addCategoryOnOk)
        : add.addModal("Sub Category", addSubCategoryOnOk)}
    </>
  );
};

export default memo(AllCategories);

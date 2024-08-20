import React, { useState, useEffect, memo, useMemo, useRef } from "react";
import ValuesStore from "../../store/values-store";
import {
  useSearchParams,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import utils from "../../dependencies/custom/react-utilities";
import { Space, Table, Button, Card } from "antd";
// import { Card, Input, Avatar, Dropdown, Button, Affix, Space, Modal, Empty, Badge, Menu } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import qs from "qs";
import useTable from "../../hooks/table";
import useEdit from "../../hooks/edit";
import useAdd from "../../hooks/add";
import useDelete from "../../hooks/delete";
import Settings from "../../dependencies/custom/settings";

const Cards = (props) => {
  const valuesStore = ValuesStore();
  const edit = useEdit("tables_metadata", "table_name"); //make this hook be aware of where to get tbl metadata
  const add = useAdd("tables_metadata", "table_name");
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
      filterTypes: { ...filterTypes },
    },
    `${Settings.backend}/get_data`,
    "post",
    "result",
    "totalCount",
    "id",
    {},
    { table: "card_type", fields: ["*"] }
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      ...table.getColumnSearchProps("name"),
    },

    {
      title: "Alias",
      dataIndex: "alias",
      ...table.getColumnSearchProps("alias"),
    },
     {
      title: "Is NHIS",
      dataIndex: "is_nhis",
     
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Button
              className="btn-successx border-0x"
              onClick={(e) => editRecord(record, "card_type")}
            >
              <i className="fas fa-edit text-success" />
            </Button>
            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              { tableName: "card_type", where: "id", whereType: "closed" },
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
    const storeKey = "editableRecord";
    valuesStore.setValue(storeKey, record);
    edit.setTblName(tableName);
    edit.setData(record);
    edit.setRecordKey(storeKey);
    edit.setShowModal(true);
    edit.setSaveCompleted(false);
  }

  function addRecord(tableName = "card_type") {
    add.setTblName(tableName);
    add.setShowModal(true);
    add.setSaveCompleted(false);
  }

  async function editOnOk() {
    let res = await edit.save(
      undefined,
      `${Settings.backend}/edit`,
      "card_type",
      { tbl: "card_type", where: "id", whereType: "closed" }
    );

    console.log(res)
  }

  async function addOnOk() {
    let res = await add.save(`${Settings.backend}/add`, { tbl: "card_type" });
  }

  useMemo(() => {
    table.setColumns(columns);
    console.log("looping");
    table.fetchData();
  }, [add.saveCompleted, edit.saveCompleted, del.saveCompleted]);

  return (
    <>
      {/* {console.log('render render')} */}
      <div className="containerx" /*style={{ marginTop: '4rem' }}*/>
        <Card
          bordered={false}
          className="criclebox tablespace border-0 mb-24 p-2"
          // title="Students List"
          extra={
            <Space>
              <Button
                className="btn-primary border-0"
                onClick={(e) => addRecord()}
              >
                <i className="fas fa-id-card me-2" /> Add Card Types
              </Button>
            </Space>
          }
        >
          <div className="row">
            <div className="col-md-12">{table.table}</div>
          </div>
        </Card>
      </div>
      {edit.editModal("Edit Card", editOnOk)}
      {add.addModal("Add New Card", addOnOk)}
    </>
  );
};

export default memo(Cards);

import React, { useState, useEffect, memo, useMemo, useRef } from "react";
import ValuesStore from "../../store/values-store";
import {
  useSearchParams,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import utils from "../../dependencies/custom/react-utilities";
import { Space, Button, Card, Tag, Skeleton } from "antd";
// import { Card, Input, Avatar, Dropdown, Button, Affix, Space, Modal, Empty, Badge, Menu } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import qs from "qs";
import useTable from "../../hooks/table";
import useEdit from "../../hooks/edit";
import useAdd from "../../hooks/add";
import useDelete from "../../hooks/delete";
import Settings from "../../dependencies/custom/settings";
import record from "./record";
import { genComponentStyleHook } from "antd/es/theme/internal";
import ProductOverview from "../../components/productOverview";

const Product = (props) => {
  const valuesStore = ValuesStore();
  const edit = useEdit("tables_metadata", "table_name"); //make this hook be aware of where to get tbl metadata
  const add = useAdd("tables_metadata", "table_name");
  const del = useDelete();
  const { filters, filterTypes } = utils.generateTableFilters();
  const [dateRange, setDateRange] = useState([]);
  const navigate = useNavigate();
  const keyOverrides = { categoryAlias: "category" };
  //and key value that points to the table names from zustand store.
  const [singleProduct, setSingleProduct] = useState();
  const [singleSupplier, setSingleSupplier] = useState();
  const [subCat, setSubCat] = useState();
  const [activeTabKey1, setActiveTabKey1] = useState("Overview");
  const [preview, setPreview] = useState(true);
  //  const [activeTabKey2, setActiveTabKey2] = useState("app");

  const productLoadPreview =  () => {
    const timer =  setTimeout(() => {
     setPreview(!preview);
    }, 2000);

    return () => clearTimeout(timer);
  };

  const onTab1Change = (key) => {
    setActiveTabKey1(key);
  };
  //  const onTab2Change = (key) => {
  //    setActiveTabKey2(key);
  //  };

  const { id } = useParams();

  const tabList = [
    {
      key: "Overview",
      tab: "Overview",
    },
    {
      key: "Purchases",
      tab: "Purchases",
    },
  ];
  const contentList = {
    Overview: (
      <>
        {preview ? (
          <Skeleton active paragraph className="mt-4"/>
        ) : (
          <ProductOverview
            product={singleProduct}
            supplier={singleSupplier}
           
          />
        )}
      </>
    ),
    Purchases: <p>content2</p>,
  };

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
    { table: "supplier", fields: ["*"] }
  );

  const columns = [
    {
      title: "Supplier ID",
      dataIndex: "supplier_id",
      ...table.getColumnSearchProps("custom_id"),
    },
    {
      title: "Supplier Name",
      ...table.getColumnSearchProps("firstname"),
      render: (v, record) => {
        return (
          <p>
            {record?.surname} {record?.firstname} {record?.middlename}
          </p>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      ...table.getColumnSearchProps("email"),
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
    },
    {
      title: "Supplier Type",
      dataIndex: "supplier_type",
      ...table.getColumnSearchProps("custom_id"),
    },

    {
      title: "Availabilty",
      ...table.getColumnSearchProps("availability_status"),
      render: (_, record) => {
        const statusClass =
          record?.availability_status === "Active"
            ? "green"
            : record?.availability_status === "Suspended"
            ? "orange"
            : record?.availability_status === "Inactive"
            ? "default"
            : record?.availability_status === "Terminated"
            ? "red"
            : record?.availability_status === "Under Review"
            ? "processing"
            : "";

        return <Tag color={statusClass}>{record?.availability_status}</Tag>;
      },
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Button
              className="btn-successx border-0x"
              onClick={(e) => editRecord(record, "supplier")}
            >
              <i className="fas fa-edit text-success" />
            </Button>
            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              { tableName: "supplier", where: "id", whereType: "closed" },
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
  }

  //   function addSupplier(tableName = "supplier") {
  //     add.setTblName(tableName);
  //     add.setShowModal(true);
  //     add.setSaveCompleted(false);
  //   }

  async function fetchSingleProduct() {
    console.log(id);
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_single_product/`,
      null,
      { custom_id: id }
    );

    if (res.status === "Ok") {
      setSingleProduct(res?.product[0]);

      const supplierRes = await utils.requestWithReauth(
        "post",
        `${Settings.backend}/get_single_supplier/`,
        null,
        { supplier_id: res.product[0]?.supplier_id }
      );
      if (supplierRes.status === "Ok") {
        setSingleSupplier(supplierRes?.supplier[0]);
      }

      
    }
    return;
  }

  //   console.log(singleSupplier);

  async function editOnOk() {
    let res = await edit.save(
      undefined,
      `${Settings.backend}/edit`,
      "product",
      { tbl: "product", where: "id", whereType: "closed" }
    );
  }

  async function addOnOk() {
    let res = await add.save(`${Settings.backend}/add`, { tbl: "supplier" });

    console.log(res);
  }

  useMemo(() => {
    table.setColumns(columns);
    console.log("looping");
    table.fetchData();
    fetchSingleProduct();

    productLoadPreview();
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
        <Card
          bordered={false}
          className=" tablespace border-0 mb-24 p-2"
          title="Product Details"
          extra={
            <Space>
              <Button
                className="btn-infox border-0x"
                onClick={(e) => editRecord(singleProduct, "product")}
              >
                <i className="fas fa-edit text-info me-2" /> Edit Product
                Details
              </Button>
            </Space>
          }
          tabList={tabList}
          activeTabKey={activeTabKey1}
          onTabChange={onTab1Change}
        >
          {contentList[activeTabKey1]}
        </Card>
      </div>
      {edit.editModal("Edit Supplier Details", editOnOk)}
      
    </>
  );
};

export default memo(Product);

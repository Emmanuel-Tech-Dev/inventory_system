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
import StoreListing from "../../components/storeListing";

const StoreDetails = (props) => {
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

  const productLoadPreview = () => {
    const timer = setTimeout(() => {
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

  function changeSupplier(tableName = "delivery") {
    add.setTblName(tableName);
    add.setSaveCompleted(false);
  }

  async function OnChangeSupplier() {
    const record = add.record;

    console.log(record);
  }

  async function fetchSingleProduct() {
    console.log(id);
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_single_product/`,
      null,
      { id: id }
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

      const subCatRes = await utils.requestWithReauth(
        "post",
        `${Settings.backend}/get_single_subCategory`,
        null,
        { custom_id: res.product[0]?.sub_cat_custom_id }
      );

      if (subCatRes.status === "Ok") {
        setSubCat(subCatRes?.subCategory[0]);
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
    console.log("looping");

    fetchSingleProduct();
    changeSupplier();

    productLoadPreview();
  }, [edit.saveCompleted, add.saveCompleted]);

  return (
    <>
      {/* {console.log('render render')} */}
      <div className="containerx" /*style={{ marginTop: '4rem' }}*/>
        <Card
          bordered={false}
          className=" tablespace border-0 mb-4 p-2"
          title="Store Name with Location"
        >
          <div className="container">
            <div className="row g-2">
              <div className="col-md-6">
                <img
                  src="https://ergo-store.com/wp-content/uploads/2018/11/levis_2.jpg"
                  alt="store"
                  className="img-fluid w-100 h-100 rounded"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="col-md-6">
                <div className="row g-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="col-md-6">
                      <img
                        src="https://ergo-store.com/wp-content/uploads/2018/11/levis_2.jpg"
                        alt="store"
                        className="img-fluid w-100 rounded"
                        style={{ objectFit: "cover", height: "200px" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className=" mt-5 mb-5 px-4">
            <div className="row">
              <div className="col-md-8">
                <StoreListing />
              </div>

              <div
                className="col-md-4 position-relative"
                style={{ height: "calc(100vh - 100px)", overflowY: "auto" }}
              >
                <Card
                  className=" shadow-lg  p-4 border-0 position-sticky"
                  title="$total sales"
                  style={{ top: "20px", zIndex: 1000 }}
                >
                  <div className="container">
                    <div className="row row-cols-2 border border-danger rounded mb-3">
                      <div className="col p-3 border-end border-danger">
                        Column
                      </div>
                      <div className="col p-3">Column</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="custom-form">{add.form}</div>

                    <Button
                      onClick={OnChangeSupplier}
                      className="bg-danger border-0 w-100 text-white"
                    >
                      Check for other Supplier
                    </Button>
                  </div>
                  <p className="text-center text-muted fw-semibold mt-3 mb-5">
                    You wont be charged till delivery is made
                  </p>
                  <div>
                    <ul className="list-unstyled fw-semibold mb-4">
                      <li className="d-flex justify-content-between mb-2">
                        <span>$435 x 5 deliveries made</span>
                        <span>$2,175</span>
                      </li>
                      <li className="d-flex justify-content-between mb-2">
                        <span>Discount fee</span>
                        <span>$385</span>
                      </li>
                      <li className="d-flex justify-content-between mb-2">
                        <span>Delivery fee</span>
                        <span>$391</span>
                      </li>
                    </ul>

                    <hr />

                    <div className="d-flex justify-content-between fw-bold mt-2">
                      <span>Total before taxes</span>
                      <span>$2,951</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {edit.editModal("Edit Supplier Details", editOnOk)}
    </>
  );
};

export default memo(StoreDetails);

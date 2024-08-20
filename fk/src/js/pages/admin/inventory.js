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
import useModal from "../../hooks/modal";
import useSearch from "../../hooks/searchHook";


const Inventory = (props) => {
  const valuesStore = ValuesStore();
  const edit = useEdit("tables_metadata", "table_name"); //make this hook be aware of where to get tbl metadata
  const add = useAdd("tables_metadata", "table_name");
  const del = useDelete();
  const subCategoryCardModal = useModal();
  const { filters, filterTypes } = utils.generateTableFilters();
  const [dateRange, setDateRange] = useState([]);
  const [category, setCateogry] = useState([]);
  const [product, setProduct] = useState([]);
  const { search } = useSearch()
  const navigate = useNavigate();
 
  const keyOverrides = { categoryAlias: "category" };
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
    { table: "product", fields: ["*"] }
  );

  const columns = [
    {
      title: "Products",
      ...table.getColumnSearchProps("name"),
      render: (v, record) => {
          return (
            <Link
              className="blue-text"
              to={`/admin/inventory/product/${record?.custom_id}`}
            >
              {record?.name}
            </Link>
          );
      }
    },
    {
      title: "Buying Price ($)",
      ...table.getColumnSearchProps("price"),
      render: (_, record) => {
        return <p>${record?.price}</p>;
      },
    },
    {
      title: "Quantity",

      ...table.getColumnSearchProps("quantity"),
      render: (_, record) => {
        return <p className="">{record?.quantity} Packets</p>;
      },
    },
    {
      title: "Threshold Value",
      ...table.getColumnSearchProps("threshold_value"),
      render: (_, record) => {
        return <p className="">{record?.threshold_value} Packets</p>;
      },
    },

    {
      title: "Expiry Date",
      dataIndex: "expiry_date",
      ...table.getColumnSearchProps("expiry_date"),
    },
    {
      title: "Availabilty",
      ...table.getColumnSearchProps("availability_status"),
      render: (_, record) => {
        const statusClass =
          record?.availability_status === "In-stock"
            ? "green"
            : record?.availability_status === "Low-on-stock"
            ? "orange"
            : record?.availability_status === "Out-of-stock"
            ? "red"
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
            <Tooltip title="Edit Products">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => editRecord(record, "product")}
              >
                <i className="fas fa-edit text-success" />
              </Button>
            </Tooltip>

            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              {
                tableName: "product",
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
  }

  function addRecord(tableName = "product") {
    add.setTblName(tableName);
    add.setShowModal(true);
    add.setSaveCompleted(false);
  }

  function addCategory(tableName = "inventory_category") {
    add.setTblName(tableName);
    add.setShowModal(true);
    add.setSaveCompleted(false);
  }
  

  function addSubCategory(record) {
    add.setTblName("sub_category");
    subCategoryCardModal.setTitle("Add Sub Category");
    subCategoryCardModal.setOpen(true);
   
  }


 async function categories() {
   const res = await utils.requestWithReauth(
     "post",
     `${Settings.backend}/get_all_categories`,
     null,
     
   );
  
   if (res.status == "Ok") {
     setCateogry(res.category)
   } else {
     // utils.showNotification(undefined, 'User could not be deleted from authentication system');
    
   }
 }
async function products() {
  const res = await utils.requestWithReauth(
    "post",
    `${Settings.backend}/get_all_products`,
    null
  );
 
  if (res.status == "Ok") {
    setProduct(res.product);

  
  } else {
    // utils.showNotification(undefined, 'User could not be deleted from authentication system');
  } 
  
  console.log(product);
}




  async function editOnOk() {
    let res = await edit.save(
      undefined,
      `${Settings.backend}/edit`,
      "product",
      { tbl: "product", where: "id", whereType: "closed" }
    );
    console.log(res);
  }

  async function addOnOk() {
    let res = await add.saveWithFiles(`${Settings.backend}/add_with_files`, {
      tbl: "product",
    });

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

    if(res.status === 'Ok'){
      subCategoryCardModal.setOpen(false);
    }
    console.log(res);
  }

  useMemo(() => {
    table.setColumns(columns);
    console.log("looping");
    table.fetchData();
    categories();
    products();
  }, [
    add.saveCompleted,
    edit.saveCompleted,
    del.saveCompleted,
    table.extraFetchParams,
   
  ]);


   const totalPrice = product.reduce((sum, item) => sum + item.price, 0);
  return (
    <>
      {/* {console.log('render render')} */}
      <div className="containerx" /*style={{ marginTop: '4rem' }}*/>
        <Card
          bordered={false}
          className=" border-0 mb-24 p-2"
          title="Overall Inventory"
        >
          <div className="row">
            <div className="col-md-3 border-end px-4">
              <h1 className="fs-6 fw-semibold text-primary mb-4 ">
                Categories
              </h1>
              <div className="">
                <h2 className="fw-semibold fs-5 text-muted">
                  {category.length}
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                  }}
                  className="text-muted"
                >
                  Last 7 days
                </span>
              </div>
            </div>
            <div className="col-md-3 border-end px-4">
              <h1 className="fs-6 fw-semibold text-warning bg-white mb-4">
                Total Products
              </h1>
              <div className="row">
                <div className="col-6">
                  <h2 className="fw-semibold fs-5 text-muted">
                    {product.length}
                  </h2>
                  <span
                    style={{
                      fontSize: "12px",
                    }}
                    className="text-muted"
                  >
                    Last 7 days
                  </span>
                </div>
                <div className="col-6">
                  <h2 className="fw-semibold fs-5 text-muted">
                    ${totalPrice.toLocaleString("en-US")}
                  </h2>
                  <span
                    style={{
                      fontSize: "12px",
                    }}
                    className="text-muted"
                  >
                    Revenue
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-3 border-end px-4">
              <h1 className="fs-6 fw-semibold text-indigo mb-4 ">
                Top Selling
              </h1>
              <div className="row">
                <div className="col-6">
                  <h2 className="fw-semibold fs-5 text-muted">40</h2>
                  <span
                    style={{
                      fontSize: "12px",
                    }}
                    className="text-muted"
                  >
                    Last 7 days
                  </span>
                </div>
                <div className="col-6">
                  <h2 className="fw-semibold fs-5 text-muted">$40,000</h2>
                  <span
                    style={{
                      fontSize: "12px",
                    }}
                    className="text-muted"
                  >
                    Cost
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-3 px-4">
              <h1 className="fs-6 fw-semibold text-danger mb-4">Low Stock</h1>

              <div className="row">
                <div className="col-6">
                  <h2 className="fw-semibold fs-5 text-muted">40</h2>
                  <span
                    style={{
                      fontSize: "12px",
                    }}
                    className="text-muted"
                  >
                    Ordered
                  </span>
                </div>
                <div className="col-6">
                  <h2 className="fw-semibold fs-5 text-muted">5</h2>
                  <span
                    style={{
                      fontSize: "12px",
                    }}
                    className="text-muted"
                  >
                    Not in stock
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          bordered={false}
          className="tablespace border-0 mb-24 p-2"
          title="Products"
          extra={
            <Space>
              {/* <div className="p-2">{search()}</div> */}
              <Button
                className="btn-primary border-0"
                onClick={(e) => addRecord()}
              >
                <i className="fas fa-shopping-cart me-2" /> Add New Product
              </Button>
              <Button
                className="btn-primaryx border"
                onClick={(e) => addCategory()}
              >
                <i className="fas fa-cart-plus me-2" /> New Category
              </Button>
              <Button
                className="btn-primaryx border"
                onClick={(e) => addSubCategory()}
              >
                <i className="fas fa-cart-arrow-down me-2" /> New Sub-Category
              </Button>
            </Space>
          }
        >
          <div className="row">
            <div className="col-md-12">{table.table}</div>
          </div>
        </Card>
      </div>
      {edit.editModal("Edit Product", editOnOk)}

      {add.tblName === "product"
        ? add.addModal("Add New Product", addOnOk)
        : add.tblName === "inventory_category"
        ? add.addModal("Add New Category", addCategoryOnOk)
        : ""}

      {subCategoryCardModal.modalJSX(
        addSubCategoryOnOk,
        <>
          <div className="containerx">
            <div className="row">
              <div className="col-md-12 mb-2">{add.form}</div>
            </div>
          </div>
        </>,
        undefined
        // { footer: null }
      )}
    </>
  );
};

export default memo(Inventory);

import React, { useState, useEffect, memo, useMemo, useRef } from "react";
import ValuesStore from "../../store/values-store";
import {
  useSearchParams,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import utils from "../../dependencies/custom/react-utilities";
import { Space, Button, Card, Tag } from "antd";
// import { Card, Input, Avatar, Dropdown, Button, Affix, Space, Modal, Empty, Badge, Menu } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import qs from "qs";
import useTable from "../../hooks/table";
import useAdd from "../../hooks/add";
import useDelete from "../../hooks/delete";
import Settings from "../../dependencies/custom/settings";
// import UpcomingShows from "../../components/upcomingShows";
import useChart from "../../hooks/chart";

const Dashboard = (props) => {
  const valuesStore = ValuesStore();
 const {
    BarChart,
    LineChart,
    setOptions,
    data,
    setData,
    setPlugins,
    allPlugins
  } = useChart('Product Data Visualizaton' , 'bottom')
  const add = useAdd("tables_metadata", "table_name");
  const del = useDelete();
  const { filters, filterTypes } = utils.generateTableFilters();
  const keyOverrides = { categoryAlias: "category" };
  const [modalTitle, setModalTitle] = useState("Add New User");
 


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
            to={`/admin/inventory/product/${record?.id}`}
          >
            {record?.name}
          </Link>
        );
      },
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
   
  ];

  




  // useMemo(() => {
  //     // table.setColumns(columns);
  //     // console.log('looping')
  //     // table.fetchData();
  // }, [add.saveCompleted, del.saveCompleted]);



 async function products() {
   const res = await utils.requestWithReauth(
     "post",
     `${Settings.backend}/get_all_products`,
     null
   );

   if (res.status == "Ok") {
  
    const product = res.product

 const chartData = {
   //  labels: product.map((product) => product.name),
   labels: [
     "Jan",
     "Feb",
     "Mar",
     "Apr",
     "May",
     "Jun",
     "Jul",
     "Aug",
     "May",
     "Jun",
   ],
   datasets: [
     {
       label: "Quantity",
       data: product.map((product) => product.quantity),
       backgroundColor: "rgba(75, 192, 112, 0.8)",
       barPercentage: 0.8, // Adjust this value to change bar width
       categoryPercentage: 0.9,
       borderRadius: {
         topLeft: 10,
         topRight: 10,
         bottomLeft: 0,
         bottomRight: 0,
       },
     },
     {
       label: "Threshod Value",
       data: product.map((product) => product.threshold_value),
       backgroundColor: "rgba(100, 180, 255, 0.8)",
       barPercentage: 0.8, // Adjust this value to change bar width
       categoryPercentage: 0.9,
       borderRadius: {
         topLeft: 10,
         topRight: 10,
         bottomLeft: 0,
         bottomRight: 0,
       },
     },
   ],
 };

 setData(chartData);

 // Set up chart options
 setOptions((prevOptions) => ({
   ...prevOptions,
   plugins: {
     ...prevOptions.plugins,
     datalabels: {
       color: "#fff",
       anchor: "end",
       align: "start",
       offset: -10,
       font: {
         weight: "bold",
       },
     },
   },
   scales: {
     y: {
       beginAtZero: true,
       title: {
         display: true,
         text: "Quantity",
       },
     },
   },
 }));

 // Add plugins if needed
 setPlugins([allPlugins.ChartDataLabels]);


   } else {
     // utils.showNotification(undefined, 'User could not be deleted from authentication system');
   }

 
 }

  useMemo(() => {
    table.setColumns(columns);
    console.log("looping");
    table.fetchData();
   
    products();
  }, [
    add.saveCompleted,
  
    del.saveCompleted,
    table.extraFetchParams,
  ]);


  return (
    <>
      {/* {console.log('render render')} */}
      <div className="container-fluid" /*style={{ marginTop: '4rem' }}*/>
        <div className="row">
          <div className="col-md-12">
            <h1 className="font-bold">Dashboard</h1>
            <p className="opacity-5">
              Quick glance at sales overview , product summary and revenue
              insights
            </p>
          </div>
        </div>
        <div className="row">
          <div className="col-md-8 mb-2">
            {/* Upcoming SHows card */}
            <Card
              bordered={false}
              className="tablespace border-0 mb-24 px-3"
              title="Sales Overview"
            >
              <div className="row">
                <div className="col-md-3 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#E8F1FD", width: "30px" }}
                  >
                    <i
                      className="fa fa-database  text-center m-auto"
                      style={{ color: "#629FF4" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Sales
                    </p>
                  </div>
                </div>
                <div className="col-md-3 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#ECEAFF", width: "30px" }}
                  >
                    <i
                      className="	fas fa-chart-line  text-center m-auto"
                      style={{ color: "#817AF3" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Revenue
                    </p>
                  </div>
                </div>{" "}
                <div className="col-md-3 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#FFEEDB", width: "30px" }}
                  >
                    <i
                      className="fas fa-chart-bar text-center m-auto"
                      style={{ color: "#DBA362" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Profit
                    </p>
                  </div>
                </div>{" "}
                <div className="col-md-3 py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#EBFFED", width: "30px" }}
                  >
                    <i
                      className="fas fa-dollar-sign  text-center m-auto"
                      style={{ color: "#58D365" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Cost
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Purchase Overview */}
            <Card
              bordered={false}
              className="tablespace border-0 mb-24 px-3"
              title="Purchase Overview"
            >
              <div className="row">
                <div className="col-md-3 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#E5F6FD", width: "30px" }}
                  >
                    <i
                      className="fas fa-shopping-cart  text-center m-auto"
                      style={{ color: "#009ED8" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Purchases
                    </p>
                  </div>
                </div>
                <div className="col-md-3 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#EBFFED", width: "30px" }}
                  >
                    <i
                      className="fas fa-dollar-sign m-auto"
                      style={{ color: "#58D365", width: "100%" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Cost
                    </p>
                  </div>
                </div>
                <div className="col-md-3 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#ECEAFF", width: "30px" }}
                  >
                    <i
                      className="far fa-window-close text-center m-auto"
                      style={{ color: "#817AF3" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Cancel
                    </p>
                  </div>
                </div>{" "}
                <div className="col-md-3 py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#FFEEDB", width: "30px" }}
                  >
                    <i
                      className="fas fa-chart-bar text-center m-auto"
                      style={{ color: "#DBA362" }}
                    ></i>
                  </div>
                  <div className=" d-flex justify-content-between align-items-baseline mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Return
                    </p>
                  </div>
                </div>{" "}
              </div>
            </Card>
            {/* Insight card */}

            <Card
              bordered={false}
              className="tablespace border-0 mb-24 p-2"
              title="Sales and Purchase"
            >
              <div className="row">
                <div className="col-md-12">
                  {" "}
                  <BarChart />
                </div>
              </div>
            </Card>

            <Card
              bordered={false}
              className="tablespace border-0 mb-24 p-2"
              title="Top Selling Stock"
            >
              <div className="row">
                <div className="col-md-12">{table.table}</div>
              </div>
            </Card>
          </div>
          <div className="col-md-4 mb-2">
            <Card
              bordered={false}
              className="tablespace border-0 mb-24 px-3"
              title="Inventory Overview"
            >
              <div className="row">
                <div className="col-md-6 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#E8F1FD", width: "30px" }}
                  >
                    <i
                      className="fa fa-database  text-center m-auto"
                      style={{ color: "#629FF4" }}
                    ></i>
                  </div>
                  <div className=" d-flex flex-column justify-content-center align-items-center mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Quantity in Hand
                    </p>
                  </div>
                </div>
                <div className="col-md-6 py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#ECEAFF", width: "30px" }}
                  >
                    <i
                      className="	fas fa-chart-line  text-center m-auto"
                      style={{ color: "#817AF3" }}
                    ></i>
                  </div>
                  <div className="  d-flex flex-column justify-content-center align-items-center mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      To be Received
                    </p>
                  </div>
                </div>{" "}
              </div>
            </Card>{" "}
            <Card
              bordered={false}
              className="tablespace border-0 mb-24 px-3"
              title="Product Summary"
            >
              <div className="row">
                <div className="col-md-6 border-end py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#E8F1FD", width: "30px" }}
                  >
                    <i
                      className="fa fa-database  text-center m-auto"
                      style={{ color: "#629FF4" }}
                    ></i>
                  </div>
                  <div className=" d-flex flex-column justify-content-center align-items-center mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Number of Suppliers
                    </p>
                  </div>
                </div>
                <div className="col-md-6 py-4 px-4">
                  <div
                    className="fs-6 fw-semibold text-primary m-auto p-2 mb-2"
                    style={{ background: "#ECEAFF", width: "30px" }}
                  >
                    <i
                      className="	fas fa-chart-line  text-center m-auto"
                      style={{ color: "#817AF3" }}
                    ></i>
                  </div>
                  <div className="  d-flex flex-column justify-content-center align-items-center mx-5">
                    <h2 className="fw-semibold fs-5 text-muted">898</h2>
                    <p
                      style={{
                        fontSize: "12px",
                      }}
                      className="text-muted"
                    >
                      Number of Categories
                    </p>
                  </div>
                </div>{" "}
              </div>
            </Card>
            <Card
              bordered={false}
              className=" tablespace border-0 mb-24 p-2"
              title="Order Summary"
            >
              <div className="row">
                <div className="col-md-12">
                  {" "}
                  <LineChart />
                </div>
              </div>
            </Card>
            <Card
              bordered={false}
              className="tablespace border-0 mb-24 p-2 h-25"
              title="Low Quantity Stock"
            >
              <div className="row">
                <div className="col-md-12">{table.table}</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {/* {add.addModal(modalTitle, addOnOk)} */}
    </>
  );
};

export default memo(Dashboard);

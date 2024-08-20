import React, { useState, useEffect, memo, useMemo, useRef } from "react";
import ValuesStore from "../../store/values-store";
import {
  useSearchParams,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import utils from "../../dependencies/custom/react-utilities";
import { Space, Button, Card, Tooltip } from "antd";
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
import Map from "../../components/map";
import { resolveObjectURL } from "buffer";

import useSearch from '../../hooks/searchHook'; // Adjust the path as needed

const Store = (props) => {
  const valuesStore = ValuesStore();
  const edit = useEdit("tables_metadata", "table_name"); //make this hook be aware of where to get tbl metadata
  const add = useAdd("tables_metadata", "table_name");
  const del = useDelete();
  const storeModalMap = useModal()
  const storeModalForm = useModal()
  const { filters, filterTypes } = utils.generateTableFilters();
  const [dateRange, setDateRange] = useState([]);
  const navigate = useNavigate();
  const keyOverrides = { categoryAlias: "category" };
  //and key value that points to the table names from zustand store

 

  const [storeLocation, setStoreLocation] = useState(null);
  const [storeAddress, setStoreAddress] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStore , setSelectedStore] = useState({})
  const [storeId , setStoreID] = useState({})
  // const [showMap, setShowMap] = useState(false);
const [searchParams, setSearchParams] = useSearchParams();
   const { search } = useSearch({
     onSearch: (term) => {
       setSearchTerm(term);
       if (term) {
         navigate(`/admin/store/search?q=${encodeURIComponent(term)}`);
       } else {
         navigate("/admin/store");
       }
        setSearchParams(term ? { q: term } : {});
       // You might want to reset pagination here
       table.setPagination({ ...table.pagination, current: 1 });
     },
   });

   const [searchTerm, setSearchTerm] = useState("");

  // console.log(storeAddress)
  // console.log(storeLocation)
  const geocodeAddress = async (address) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    } else {
      throw new Error(
        `Geocoding error: No results found for address "${address}"`
      );
    }
  };

  useEffect(() => {
    const fetchStoreLocation = async () => {
      try {
        const location = await geocodeAddress(storeAddress);
        setStoreLocation(location);
        setError(null);
      } catch (error) {
        console.error("Error fetching store location:", error);
        setError(error.message);
      }
    };
    fetchStoreLocation();
  }, [storeAddress]);

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
    { table: "store", fields: ["*"] }
  );

  const columns = [
    {
      title: "Store ID",
      // dataIndex: "store_id",
      ...table.getColumnSearchProps("store_id"),
      render: (v, record) => {
        return (
          <Link
            className="blue-text"
            to={`/admin/store/storeDetails/${record?.store_id}`}
          >
            {record?.store_id}
          </Link>
        );
      },
    },
    {
      title: "Store Name",
      dataIndex: "store_name",
      ...table.getColumnSearchProps("store_name"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Telephone",
      dataIndex: "telephone",
      ...table.getColumnSearchProps("telephone"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Location",
      dataIndex: "location",
      ...table.getColumnSearchProps("location"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Address",
      dataIndex: "address",
      ...table.getColumnSearchProps("address"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    // {
    //     title: 'Dets.',
    //     key: 'details',
    //     render: (_, record) => {
    //         return <a className='blue-text' onClick={e => navigate(`./ad_details?advert_id=${record['custom_id']}#page=5`)}><i className='fas fa-user' /></a>
    //     },
    // },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Button
              className="btn-successx border-0x"
              onClick={(e) => editRecord(record, "store")}
            >
              <i className="fas fa-edit text-success" />
            </Button>

            <Tooltip title="Add New Product">
              <Button
                className="btn-success border-0x"
                onClick={(e) => openStoreModalForm(record)}
              >
                <i className="fas fa-plus text-white" />
              </Button>
            </Tooltip>
            <Tooltip title="Store Infomation">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => openStoreModalMap(record)}
              >
                <i className="fas fa-eye text-info" />
              </Button>
            </Tooltip>

            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              { tableName: "store", where: "id", whereType: "closed" },
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

//  const store = table.data.forEach(td => {setStoreID(td.store_id)})

  

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

  async function openStoreModalMap(record){
    console.info(record)

    storeModalMap.setTitle(record?.store_name)
    storeModalMap.setOpen(true)
    const details = `${record?.address}, ${record?.location}`
    // console.log(details)
    setStoreAddress(details);
    // setStoreAddress(record?.address)

    
  } 
  
function openStoreModalForm(record ){
    console.info(record)
    const newData = add.record
    console.log(newData)
    add.setTblName('store_product');
    storeModalForm.setTitle(`Store Name - ${record?.store_name}`)
    storeModalForm.setOpen(true)
    setSelectedStore(record)
  
    // setStoreAddress(record?.address)
  }

  async function addNewStoreProduct () {
       const record = add.record
      //console.log(record , selectedStore)
       const res  = await utils.requestWithReauth(
        "post",
        `${Settings.backend}/add_store_product`,
        null,
        {record , selectedStore}
       )
       console.log(res)

         if (res.status === "Ok") {
          // Update the card table to reflect the newly added card
          // add.reset();
           storeModalForm.setOpen(false)
           utils.showNotification(undefined, res?.msg, "text-success");
         } else {
           utils.showNotification(undefined, res?.msg);
         }
  }


  async function highestID() {
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_highest_store_id`,
      null
    );

    if (res.status === "Ok") {
      const storageKey = "STR_CurrentID";
      // console.log(res);
      // console.log(res.highestID);
      localStorage.setItem(storageKey, res.highestID);
    }

    //   localStorage.setItem()
    return;
  }

  function addRecord(tableName = "store") {
    add.setTblName(tableName);
    add.setShowModal(true);
    add.setSaveCompleted(false);
  }

  async function editOnOk() {
    let res = await edit.save(
      undefined,
      `${Settings.backend}/edit`,
      "store",
      { tbl: "store", where: "id", whereType: "closed" }
    );
  }

  async function addOnOk() {
    let res = await add.save(`${Settings.backend}/add`, { tbl: "store" });
  }

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchTerm(query);
      filterData(query);
    } else {
      table.fetchData();
    }
  }, [searchParams]);
 
  const filterData = (query) => {
    const filteredData = table.data.filter((item) =>
      Object.values(item).some(
        (value) =>
          value && value.toString().toLowerCase().includes(query.toLowerCase())
      )
    );
    table.setData(filteredData);
  };

 useMemo(() => {
   table.setColumns(columns);
   if (!searchTerm) {
     table.fetchData();
   }
   highestID();
 }, [
   add.saveCompleted,
   edit.saveCompleted,
   del.saveCompleted,
   table.extraFetchParams,
 ]);

  const sh = search()

  console.log(sh)

  return (
    <>
      {/* {console.log('render render')} */}
      <div className="containerx" /*style={{ marginTop: '4rem' }}*/>
        <Card
          bordered={false}
          className=" tablespace border-0 mb-24 p-2"
          title="Manage Stores"
          extra={
            <Space>
              <Button
                className="btn-primary border-0"
                onClick={(e) => addRecord()}
              >
                <i className="fas fa-store me-2" /> Add New Store
              </Button>
              <div className="row">
                <div className="col-md-12">{search()}</div>
              </div>
            </Space>
          }
        >
          {" "}
          <div className="row">
            <div className="col-md-12">{table.table}</div>
          </div>
        </Card>
      </div>
      {edit.editModal("Edit Item", editOnOk)}
      {add.addModal("Add New Item", addOnOk)}

      {storeModalMap.modalJSX(
        undefined,
        <>
          <div className="containerx">
            <div className="row">
              <div className="col-md-12">
                {storeLocation && <Map storeLocation={storeLocation} />}
              </div>
            </div>
          </div>
        </>,

        800,
        { footer: null }
      )}

      {storeModalForm.modalJSX(
        undefined,
        <>
          <div className="containerx">
            <div className="row">
              <div className="col-md-12 mb2">
                {/* {selectedCard !== undefined ? edit.form : add.form} */}
                {add.form}
                <div className="d-flex mt-3 mb-2">
                  <Button
                    className="border ms-auto me-2"
                    onClick={(e) => storeModalForm.setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="border btn-primary"
                    onClick={(e) => addNewStoreProduct()}
                    icon={<i className="fas fa-paper-plane me-1" />}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>,
        undefined,
        { footer: null }
      )}
    </>
  );
};

export default memo(Store);

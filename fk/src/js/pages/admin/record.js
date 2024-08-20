import React, { useState, useEffect, memo, useMemo, useRef } from "react";
import ValuesStore from "../../store/values-store";
import {
  useSearchParams,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import utils from "../../dependencies/custom/react-utilities";
import { Space, Button, Card, Table, Tooltip, Popover } from "antd";
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

const Record = (props) => {
  const valuesStore = ValuesStore();
  const edit = useEdit("tables_metadata", "table_name"); //make this hook be aware of where to get tbl metadata
  const add = useAdd("tables_metadata", "table_name");
  const patientCardModal = useModal();
  const patientRecordModal = useModal();
  const cardTypeModal = useModal();
  const sessionModal = useModal();
  const dependentModal = useModal();
  const del = useDelete();
  const { filters, filterTypes } = utils.generateTableFilters();
  const [selectedCard, setSelectedCard] = useState({});
  const [dateRange, setDateRange] = useState([]);
  const navigate = useNavigate();
  const keyOverrides = { categoryAlias: "category" };
  const [forceRenderer, setForceRenderer] = useState(false);
  //and key value that points to the table names from zustand store.
  const [selectedPatient, setSelectedPatient] = useState({});
  const [sesssionStarted, setSessionStarted] = useState(false);
  const [showEditSessionButton, setShowEditSessionButton] = useState(false);

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
    { table: "records", fields: ["*"] }
  );

  const columns = [
    {
      title: "Custom ID",
      dataIndex: "custom_id",
    },
    {
      title: "Name",
      dataIndex: "firstname",
      ...table.getColumnSearchProps("firstname"),
      render: (v, record) => {
        return `${record?.firstname} ${record?.middlename} ${record?.surname}`;
      },
    },

    {
      title: "Dob",
      dataIndex: "dob",
      ...table.getColumnSearchProps("dob"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Gender",
      dataIndex: "gender",
      ...table.getColumnSearchProps("gender"),
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
    {
      title: "Locality",
      dataIndex: "locality",
      ...table.getColumnSearchProps("locality"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Occupation",
      dataIndex: "occupation",
      ...table.getColumnSearchProps("occupation"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Relative",
      dataIndex: "locality",
      ...table.getColumnSearchProps("locality"),
      // render: (v, record) => {
      //     return <a className='blue-text' onClick={e => navigate(`./users?email=${record['owner']}#page=1`)}>{utils.truncateText(v, 8)}</a>
      // }
    },
    {
      title: "Emp_Status",
      dataIndex: "employment_status",
      ...table.getColumnSearchProps("employment_status"),
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
            <Tooltip title="Edit record">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => editRecord(record, "records")}
              >
                <i className="fas fa-edit text-success" />
              </Button>
            </Tooltip>
            <Tooltip title="Add Patient Card">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => openPatientCardModal(record)}
              >
                <i className="fas fa-plus text-success " />
              </Button>
            </Tooltip>
            <Tooltip title="Add Dependent">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => openDependentModal(record)}
              >
                <i className="fas fa-user-plus text-success " />
              </Button>
            </Tooltip>
            <Button
              className="btn-success border-0x "
              onClick={(e) => openSessionModal(record)}
            >
              Sart session
            </Button>

            {del.confirm(
              `${Settings.backend}/delete`,
              record,

              "Are you sure to delete this item",
              { tableName: "records", where: "id", whereType: "closed" },

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

  // card table filed and where the table records is comming from
  const cardTable = useTable(
    {
      pagination: {
        current: 1,
        pageSize: 5,
        position: ["bottomRight"],
        hideOnSinglePage: true,
      },
    },
    undefined,
    undefined,
    undefined,
    undefined,
    "id",
    { table: "patient_cards", fields: ["*"] }
  );

  //Card column to populate the table
  const cardColumns = [
    {
      title: "Card Name",
      dataIndex: "card_type",
    },
    {
      title: "R/N",
      dataIndex: "reg_number",
    },
    {
      title: "S/N",
      dataIndex: "serial_number",
    },
    {
      title: "C/N",
      dataIndex: "card_number",
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Tooltip title="Edit Record">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => setMeta(record, "patient_cards")}
              >
                <i className="fas fa-edit text-success" />
              </Button>
            </Tooltip>
            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              { tableName: "patient_cards", where: "id", whereType: "closed" },

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

  //card table filed and where the table records is comming from
  const sessionTable = useTable(
    {
      pagination: {
        current: 1,
        pageSize: 5,
        position: ["bottomRight"],
        hideOnSinglePage: true,
      },
    },
    undefined,
    undefined,
    undefined,
    undefined,
    "id",
    { table: "session", fields: ["*"] }
  );

  //Card column to populate the table
  const sessionColumns = [
    {
      title: "R/N",
      dataIndex: "reg_number",
    },
    {
      title: "Status",
      dataIndex: "status",
    },
    {
      title: "Session Type",
      dataIndex: "type",
    },
    // {
    //   title: "C/N",
    //   dataIndex: "card_number",
    // },

    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Tooltip title="Edit Record">
              <Button
                className="btn-successx border-0x"
                onClick={(e) => setSessionToEdit(record, "session")}
              >
                <i className="fas fa-edit text-success" />
              </Button>
            </Tooltip>
            {del.confirm(
              `${Settings.backend}/delete`,
              record,
              "Are you sure to delete this item",
              { tableName: "session", where: "id", whereType: "closed" },

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

  async function editSession() {
    const record = add.record;
    // console.log(record);
    // console.log(record?.patient_card_type)
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/update_patient_session`,
      null,
      { record }
    );
    console.log(res);
    if (res.status == "Ok") {
       add.reset();
       sessionModal.setOpen(false);
      setShowEditSessionButton(false);
      utils.showNotification(undefined, res?.msg, "text-success");
    } else {
      utils.showNotification(undefined, res?.msg);
    }
  }

  function setSessionToEdit(record, tableName) {
    setMeta(record, tableName);
    setShowEditSessionButton(true);
  }
  // const content = <div>{table.table}</div>;

  //Edit a new patient records function that triggers a modal populated with patient records
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

  function setMeta(record, tableName) {
    // console.log(record);
    add.setTblName(tableName);
    add.setRecord(record);
    // setSelectedCard(record);
  }

  // Add a new patient records function that triggers a modal
  function addPatientRecord(tableName = "records") {
    add.setTblName(tableName);
    patientRecordModal.setOpen(true);
    patientRecordModal.setTitle("Add New Patient");

    // add.setShowModal(true);
    // add.setSaveCompleted(false);
  }

  //Add a new card type function that triggers a modal
  function addNewCardtype(tableName = "card_type") {
    add.setTblName(tableName);
    cardTypeModal.setOpen(true);
    cardTypeModal.setTitle("Add New Card Type");
    // add.setShowModal(true);
    // add.setSaveCompleted(false);
  }

  //Add a new card type function that triggers a modal
  // function beginSession(tableName = "session") {
  //   add.setTblName(tableName);
  //   add.setShowModal(true);
  //   add.setSaveCompleted(false);
  // }

  // trigger a patient card modal function with a table and a form
  async function openPatientCardModal(record) {
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_patient_card`,
      null,
      { patient_custom_id: record?.custom_id }
    );
    console.log(res);
    if (res.status == "Ok") {
      const data = res?.patient_cards;
      cardTable.setData(data);
      add.setTblName("patient_cards");
      patientCardModal.setTitle("Add New Patient Card");
      patientCardModal.setOpen(true);
      setSelectedPatient(record);
      // utils.showNotification(undefined, 'Record', 'text-success');
    } else {
      // utils.showNotification(undefined, 'User could not be deleted from authentication system');
      patientCardModal.setOpen(false);
    }
  }

  //Submit a patient Card
  async function submitPatientCard() {
    const record = add.record;
    console.log(record);
    // return;
    const v = add.validateShowErrorMessage();

    if (!v?.isValid) return;
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/submit_patient_card`,
      null,
      { record, selectedPatient }
    );

    console.log(res);

    if (res.status === "Ok") {
      // Update the card table to reflect the newly added card
      add.reset();
      // patientCardModal.setOpen(false);
      await openPatientCardModal(selectedPatient);
      utils.showNotification(undefined, res?.msg, "text-success");
    } else {
      utils.showNotification(undefined, res?.msg);
    }
  }

  async function openSessionModal(record) {
    setShowEditSessionButton(false);
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_dependent_parent`,
      null,
      { reg_number: record?.reg_number }
    );
    const data = utils.genSqlIn([
      record?.reg_number,
      ...utils.createArrayFromSingleObjectKey(res.result, "parent_id"),
    ]);

    const sessionRes = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_patient_sessions`,
      null,
      { patient_custom_id: record?.custom_id }
    );

    if (sessionRes.status === "Ok") {
      const data = sessionRes?.session;
      sessionTable.setData(data);
      // utils.showNotification(undefined, 'Record', 'text-success');
    }
    add.resetCompletely();
    add.setSqlPlaceHolders({ p1: data });
    add.setTblName("session");
    sessionModal.setTitle("Start Session");
    sessionModal.setOpen(true);
    setSelectedPatient(record);
    // console.log(data)
  }

  async function startSession() {
    const record = add.record;
    console.log(record);
    // return;
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/start_session`,
      null,
      { record, selectedPatient }
    );

    if (res.status === "Ok") {
      // Update the card table to reflect the newly added card
      add.reset();
      sessionModal.setOpen(false);
      utils.showNotification(undefined, res?.msg, "text-success");
      setSessionStarted(true);
    } else {
      utils.showNotification(undefined, res?.msg);
    }
  }

  // Trigger Dependent modal

  async function openDependentModal(record) {
    add.setTblName("dependent");
    dependentModal.setTitle("Add Dependent");
    dependentModal.setOpen(true);
    setSelectedPatient(record);
    console.log(selectedPatient);
  }

  async function addDependent() {
    const record = add.record;
    console.log(record);

    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/add_dependent`,
      null,
      { record, selectedPatient }
    );

    if (res.status === "Ok") {
      // Update the card table to reflect the newly added card
      add.reset();
      dependentModal.setOpen(false);
      utils.showNotification(undefined, res?.msg, "text-success");
      setSessionStarted(true);
    } else {
      utils.showNotification(undefined, res?.msg);
    }
  }

  // async function submitCard() {
  //   try {
  //     if (add.record.id) {
  //       // If `id` exists, it's an update operation
  //       const res = await utils.requestWithReauth(
  //         "post",
  //         `${Settings.backend}/submit_card`,
  //         null,
  //         { record: add.record }
  //       );
  //       console.log("Update response:", res.data);
  //       add.record();
  //       if (res.status === "Ok") {
  //         // Example: Update UI or perform actions upon successful update
  //         await fetchCards(); // Assuming fetchCards() fetches the updated list of cards
  //         setSelectedCard({}); // Clear selected card after update
  //       } else {
  //         console.error("Update failed:", res.data.msg); // Log error message from server
  //       }
  //     } else {
  //       // If `id` doesn't exist, it's an insert operation
  //       const res = await utils.requestWithReauth(
  //         "post",
  //         `${Settings.backend}/submit_card`,
  //         null,
  //         { record: add.record }
  //       );
  //       console.log("Insert response:", res.data);

  //       if (res.status === "Ok") {
  //         // Example: Update UI or perform actions upon successful insertion
  //         await fetchCards(); // Assuming fetchCards() fetches the updated list of cards
  //         setSelectedCard({}); // Clear selected card after insertion
  //       } else {
  //         console.error("Insert failed:", res.data.msg); // Log error message from server
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error:", error.message); // Log any network or other errors
  //   }
  // }

  // async function fetchCards() {
  //   const res = await utils.requestWithReauth(
  //     "post",
  //     `${Settings.backend}/get_patient_card`,
  //     null,
  //     { patient_id: add.record.patient_id }
  //   );
  //   if (res.status == "Ok") {
  //     cardTable.setData(res.cards);
  //   }
  // }

  // async function fetchCardData(recordId) {
  //     const res = await utils.requestWithReauth('post', `${Settings.backend}/get_patient_card`, null, { id: recordId });
  //    console.log(res)
  //     if (res.status === 'Ok') {
  //         const data = res?.cards[0]; // Assuming you get a list of cards and you want the first one
  //         setSelectedCard(data);
  //         editRecord(data, 'cards');
  //     }
  // }

  // console.log(selectedCard)

  //edit a record on a table using the id as a reference point

  async function editOnOk() {
    let res = await edit.save(
      undefined,
      `${Settings.backend}/edit`,
      "records",
      { tbl: "records", where: "id", whereType: "closed" }
    );
  }

  //save response to a table name records
  async function recordsOnOk() {
    const v = add.validateShowErrorMessage();
    if (!v?.isValid) return;
    await add.save(
      `${Settings.backend}/add`,
      { tbl: "records" },
      function (status) {
        if (status) {
          patientRecordModal.setOpen(false);
        }
      }
    );
  }

  //save response to a table name card_type
  async function cardTypeOnOk() {
    console.log(24);
    let res = await add.save(
      `${Settings.backend}/add`,
      { tbl: "card_type" },
      function (status) {
        if (status) {
          cardTypeModal.setOpen(false);
        }
      }
    );
    if (res.status == "Ok") {
      patientCardModal.setOpen(false);
      utils.showNotification(undefined, res?.msg, "text-success");
      add.reset();
    } else {
      utils.showNotification(undefined, res?.msg);
    }
  }

  //save response to a table name patient_cards
  async function addOnOk2() {
    await add.save(`${Settings.backend}/add`, {
      tbl: "patient_cards",
    });
  }

  async function sessionOnOk() {
    let res = await add.save(`${Settings.backend}/add`, {
      tbl: "session",
    });
  }

  useMemo(() => {
    cardTable.setColumns(cardColumns);
    table.setColumns(columns);
    sessionTable.setColumns(sessionColumns);
    // cardTable.setExtraFetchParams({ customFilters: `custom_id='custom_id'` });
    console.log("looping");
    table.fetchData();
  }, [
    // add.extraMetaList,
    add.saveCompleted,
    edit.saveCompleted,
    del.saveCompleted,
    table.extraFetchParams,
    forceRenderer,
  ]);

  return (
    <>
      {/* {console.log("render render")} */}
      <div className="containerx" /*style={{ marginTop: '4rem' }}*/>
        <Card
          bordered={false}
          className="criclebox tablespace border-0 mb-24 p-2"
          title="Patient Records"
          extra={
            <Space>
              <Button
                className="btn-primary border-0"
                onClick={(e) => addPatientRecord()}
              >
                <i className="fas fa-user-plus me-2" /> Add Patient
              </Button>

              <Button
                className=""
                type="primary"
                ghost
                onClick={(e) => addNewCardtype()}
              >
                <i className="fas fa-id-card me-2" /> Add Card Type
              </Button>
            </Space>
          }
        >
          <div className="row">
            <div className="col-md-12">
              <div className="h-scrolling-wrapper">{table.table}</div>
            </div>
          </div>
        </Card>
      </div>
      {edit.editModal("Edit Patient", editOnOk)}

      {patientRecordModal.modalJSX(
        recordsOnOk,
        <>
          <div className="containerx">
            <div className="row row-cols-3">{add.form}</div>
          </div>
        </>,
        1000
        // { footer: null }
      )}

      {cardTypeModal.modalJSX(
        cardTypeOnOk,
        <>
          <div className="containerx">
            <div className="row row-cols-1">{add.form}</div>
          </div>
        </>

        // { footer: null }
      )}

      {/* {add.tblName === "card_type"
        ? add.addModal("Add New Card Type", addOnOk1)
        : add.addModal("Add New Patient", addOnOk)} */}

      {/* Patient card model */}
      {patientCardModal.modalJSX(
        undefined,
        <>
          <div className="containerx">
            <div className="row">
              <div className="col-md-12 mb2">
                {/* {selectedCard !== undefined ? edit.form : add.form} */}
                {add.form}
                <div className="d-flex mt-2 mb-2">
                  <Button
                    className="border ms-auto me-2"
                    onClick={(e) => patientCardModal.setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="border btn-primary"
                    onClick={(e) => submitPatientCard()}
                    icon={<i className="fas fa-paper-plane me-1" />}
                  >
                    Submit
                  </Button>
                </div>
              </div>
              <div className="col-md-12">{cardTable.table}</div>
            </div>
          </div>
        </>,
        undefined,
        { footer: null }
      )}

      {/* session model */}
      {sessionModal.modalJSX(
        undefined,
        <>
          <div className="containerx">
            <div className="row">
              <div className="col-md-12 mb-2">
                {add.form}
                <div className="d-flex mt-2 mb-2">
                  <Button
                    className="border ms-auto me-2"
                    onClick={(e) => sessionModal.setOpen(false)}
                  >
                    Cancel
                  </Button>
                  {!showEditSessionButton && (
                    <Button
                      className="border btn-primary"
                      onClick={(e) => startSession()}
                      icon={<i className="fas fa-paper-plane me-1" />}
                    >
                      Start Session
                    </Button>
                  )}
                  {showEditSessionButton && (
                    <Button
                      className="border btn-success"
                      onClick={(e) => editSession()}
                      icon={<i className="fas fa-edit me-1" />}
                    >
                      Edit Session
                    </Button>
                  )}
                </div>
              </div>
              <div className="col-md-12">{sessionTable.table}</div>
            </div>
          </div>
        </>,
        undefined,
        { footer: null }
      )}

      {/* Depedendant model */}
      {dependentModal.modalJSX(
        undefined,
        <>
          <div className="containerx">
            <div className="row">
              <div className="col-md-12 mb-2">
                {add.form}
                <div className="d-flex mt-4">
                  <Button
                    className="border ms-auto me-2"
                    onClick={(e) => dependentModal.setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="border btn-primary"
                    onClick={(e) => addDependent()}
                    icon={<i className="fas fa-user-plus me-1" />}
                  >
                    Add dependent
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>,
        undefined,
        { footer: null }
      )}
      {/* New card type model */}
    </>
  );
};

export default memo(Record);

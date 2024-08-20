
import React, { useState, useMemo } from 'react';
import ValuesStore from '../store/values-store';
import utils from '../dependencies/custom/react-utilities';
import { Space, Image, Modal, Input, Select, message, Checkbox, Radio } from 'antd';
import Settings from '../dependencies/custom/settings';
import useUpload from './upload';
import cryptoRandomString from 'crypto-random-string';
import useTextEditor from './text_editor';
import useDraggable from './draggable';


const { TextArea } = Input;
//this hook is based on zustand
const useAdd = (tablesMetaData, whereKeyName, autoFetch = true) => {
    const valuesStore = ValuesStore();
    const [showModal, setShowModal] = useState(false);
    const [tblMetaDataName, setTblMetaDataName] = useState(tablesMetaData);
    const [whrKeyName, setWhrKeyName] = useState(whereKeyName);
    const [record, setRecord] = useState({});
    const [form, setForm] = useState(undefined);
    const [tblName, setTblName] = useState(undefined);
    const upload = useUpload('', '');
    const [saveCompleted, setSaveCompleted] = useState(false);
    const [sqlPlaceHolders, setSqlPlaceHolders] = useState({});
    const [customIDIsSet, setCustomIDIsSet] = useState(false);
    const [sqlSelectResult, setSqlSelectResult] = useState({});
    const [whichElementChanged, setWhichElementChanged] = useState('');
    const [childrenBottom, setChildrenBottom] = useState(undefined);
    const [childrenTop, setChildrenTop] = useState(undefined);
    const [fields, setFields] = useState(undefined);
    const draggable = useDraggable();
    const editor = useTextEditor();
    const [extraMetaList, setExtraMetaList] = useState([]);
    const [loading, setLoading] = useState(false);



    async function save(url = `${Settings.backend}/add`, endpoint = null, callback) {
        let res = await utils.requestWithReauth('post', url, endpoint, record);
        if (res.status === 'Ok') {
            reset();
            if (callback) {
                callback(true, 'Record has been added successfully');
            }
            message.success('Record has been added succesfully');
        } else {
            if (callback) {
                callback(false, 'Record has been added successfully');
            }
            message.error(res.msg);
        }
    }

    async function saveWithFiles(url = `${Settings.backend}/add_with_files`, endpoint = null, callback) {
        const data = { 'record': JSON.stringify(record), 'files': JSON.stringify(upload.base64FileList) }
        let res = await utils.requestWithReauth('post', url, endpoint, data);
        if (res.status === 'Ok') {
            reset();
            if (callback) {
                callback(true, 'Record has been added successfully');
            }
            message.success('Record has been added succesfully');
        } else {
            if (callback) {
                callback(false, res.msg);
            }
            message.error(res.msg);
        }
    }

    function reset() {
        setTblName(undefined);
        setShowModal(false);
        upload.setBase64FileList([]);
        upload.setFileList([]);
        setRecord({});
        setSaveCompleted(true);
        setLoading(false);
    }

    function resetCompletely() {
        setTblName(undefined);
        setShowModal(false);
        upload.setBase64FileList([]);
        upload.setFileList([]);
        setRecord({});
        setSaveCompleted(true);
        setLoading(false);
        setSqlSelectResult({});
        setExtraMetaList([]);
    }

    useMemo(() => {
        if (autoFetch) {
            addForm(tblName);
        }
        // console.log('add hook looping');
    }, [tblName, upload.fileList, record, sqlSelectResult, fields]);

    function selectOptionLabelRender(image, key, value, row) {
        const vl = value?.split(',').map(val => row[val]).join(' - ');
        return image ?
            <div key={`${row[key]}_select_options`} className={`d-flex`}>
                <Image
                    className=''
                    width={18}
                    src={`${Settings.backend}/${row[image]}`}
                />
                <span className="flex-grow-1">{vl}</span>
            </div> : vl;
    }


    async function addForm(tableName) {
        try {
            let meta = valuesStore?.getValuesBy(tblMetaDataName, whrKeyName, tableName)?.sort((a, b) => a.rank - b.rank);
            // console.log(meta,tblMetaDataName,whereKeyName,tableName);
            if (fields && fields?.length) {
                meta = meta.filter((v) => {
                    return fields.includes(v.column_name)
                });

            }
            let html = [];
            for (let i = 0; i < meta.length; i++) {
                let realName = meta[i]['col_real_name'];
                let name = meta[i]['column_name'];
                const key = name;
                let type = meta[i]['type'];
                let options = undefined;
                let visible = meta[i]['backend_visible'];
                let icon = meta[i]['icon'];
                if (!visible) continue;
                const value = record[name] || undefined;
                const marginBottom = 'mb-2';
                switch (type) {
                    case 'jsonRadio':
                    case 'jsonCheck':
                    case 'jsonSelect':
                    case 'jsonMultiSelect': {
                        const p = !!meta[i]['options'] ? JSON.parse(meta[i]['options']) : {};
                        const a = Object.entries(p);
                        options = a?.map(v => ({ value: v[0], label: v[1] }));
                        if (!sqlSelectResult[name]) {
                            setSqlSelectResult(r => ({ ...r, [name]: options }));
                        }
                        break;
                    }
                    case 'csvRadio':
                    case 'csvCheck':
                    case 'csvSelect':
                    case 'csvMultiSelect': {
                        options = !!meta[i]['options'] ? meta[i]['options'].split(',').map(v => ({ value: v, label: v })) : [];
                        if (!sqlSelectResult[name]) {
                            setSqlSelectResult(r => ({ ...r, [name]: options }));
                        }
                        break;
                    }
                    case 'sqlRadio':
                    case 'sqlCheck':
                    case 'sqlSelect':
                    case 'sqlMultiSelect': {
                        const p = !!meta[i]['options'] ? JSON.parse(meta[i]['options']) : {};
                        let sql = p?.sql;
                        const key = p?.key;
                        const value = p?.value;
                        const image = p?.image;
                        const groupBy = p?.groupBy;
                        const endpoint = p?.endpoint;
                        const endpointResKey = p?.endpoint_result_key;
                        const requestTo = endpoint ? endpoint : 'get_extra_meta_options';

                        for (let placeholder in sqlPlaceHolders) {
                            sql = sql.replace(placeholder, sqlPlaceHolders[placeholder]);
                        }

                        if (sql) {
                            if (sqlSelectResult[name]) {//to prevent multiple request
                                options = sqlSelectResult[name];
                            } else {
                                if (!extraMetaList.includes(name)) {//for optimization
                                    setExtraMetaList(r => [...r, name]);
                                    const res = await utils.requestWithReauth('post', `${Settings.backend}/${requestTo}`, null, { sql });
                                    if (groupBy) {
                                        const grouped = utils.groupBy(res.details, groupBy);
                                        let final = [];
                                        for (let group in grouped) {
                                            final.push({
                                                label: group,
                                                options: grouped[group]?.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }))
                                            });
                                        }
                                        options = final;
                                        setSqlSelectResult(r => ({ ...r, [name]: options }));
                                    } else {
                                        if (res.details) {
                                            options = res?.details?.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }));
                                        } else {
                                            options = res[endpointResKey]?.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }));
                                        }
                                        setSqlSelectResult(r => ({ ...r, [name]: options }));
                                    }
                                }
                            }
                        }
                        break;
                    }
                }

                switch (type.trim()) {
                    // case 'dateTime': {
                    //     html.push(<DatePicker key={`${name}_editable`} value={new Date(value)} placeholder={`Select ${realName}`} showTime onChange={(dateObject, dateString) => {
                    //         dateTimeChange(dateString, key, recordKey)
                    //     }} />)
                    //     break;
                    // }
                    case 'customGenerateString': {
                        const cid = cryptoRandomString({ length: 10 });
                        if (!customIDIsSet) {
                            setRecord(record => ({ ...record, [key]: cid }));
                            setCustomIDIsSet(true);
                        }
                        html.push(<Input
                            disabled
                            className={`${marginBottom} d-none`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='text' placeholder={`Enter ${realName}`} value={cid} onChange={e => changeValue(e.target.value, key)} />)
                        break;
                    }
                    case 'number': {
                        html.push(<Input
                            className={`${marginBottom}`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='number' placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key)} />)
                        break;
                    }

                    case 'password':
                    case 'cpassword': {
                        html.push(<Input.Password
                            className={`${marginBottom}`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='number' placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key)} />)
                        break;
                    }
                    case "text": {
                        html.push(<Input
                            className={`${marginBottom}`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='text' placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key)} />)
                        break;
                    }
                    case "jsonCheck":
                    case "csvCheck":
                    case "sqlCheck": {
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`${marginBottom}`}>
                                <span className="">{realName}:</span>
                                <div className='mt-1'>
                                    <Checkbox.Group
                                        className=''
                                        key={`${name}_editable`}
                                        options={sqlSelectResult[name]}
                                        onChange={v => changeValue(v, key)}
                                        value={value ? value?.toString()?.split(',') : []}
                                    />
                                </div>
                            </div>)
                        break;
                    }
                    case "jsonRadio":
                    case "csvRadio":
                    case "sqlRadio": {
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`${marginBottom}`}>
                                <span className="">{realName}:</span>
                                <div className='mt-1'>
                                    <Radio.Group
                                        className=''
                                        key={`${name}_editable`}
                                        options={sqlSelectResult[name]}
                                        onChange={v => changeValue(v?.target?.value, key)}
                                        value={value}
                                    />
                                </div>
                            </div>)
                        break;
                    }
                    case "sqlSelect":
                    case "jsonSelect":
                    case "csvSelect": {
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`input-groupx input-group-smx d-flexx ${marginBottom}`}>
                                <span className="input-group-textx">{realName}:</span>
                                <div className='mt-1'>
                                    <Select
                                        key={`${name}_editable`}
                                        placeholder={`Select ${realName}`}
                                        className='bd-highlight flex-grow-1x w-100'
                                        onChange={v => changeValue(v, key)}
                                        value={value}
                                        options={sqlSelectResult[name]}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </div>
                            </div>)
                        break;
                    }
                    case "sqlMultiSelect":
                    case "jsonMultiSelect":
                    case "csvMultiSelect": {
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`input-groupx input-group-smx d-flexx ${marginBottom}`}>
                                <span className="input-group-textx">{realName}:</span>
                                <div className='mt-1'>
                                    <Select
                                        key={`${name}_editable`}
                                        mode="multiple"
                                        allowClear
                                        placeholder={`Select ${realName}`}
                                        className='bd-highlight flex-grow-1x w-100'
                                        onChange={v => changeValue(v, key)}
                                        value={value ? value?.toString()?.split(',') : []}
                                        options={sqlSelectResult[name]}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </div>
                            </div>);
                        break;
                    }
                    case 'textEditor': {
                        html.push(
                            <div key={`${name}_editable`} className={`${marginBottom}`}>
                                <label className={`fw-bold ${marginBottom}`}>Enter {realName}</label>
                                {editor.editor()}
                            </div>
                        );
                        break;
                    }
                    case "file": {
                        html.push(
                            <div key={`${name}_editable`}>
                                <label className={`fw-bold ${marginBottom}`}>Upload {realName}</label>
                                {upload.uploader('uploadedImages', '', `${name}_editable`)}
                            </div>
                        );
                        break;
                    }
                    case "textArea": {
                        html.push(
                            <div key={`${name}_textarea_wrapper`} className={`${marginBottom} w-100`}>
                                <span className="">{realName}</span>
                                <Input.TextArea key={`${name}_editable`} className="w-100" placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key)} autoSize />
                            </div>
                        );
                        break;
                    }
                    default: html.push(<Input
                        className={`${marginBottom}`}
                        addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                        key={`${name}_editable`} type={type} placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key)} />)
                }
            }

            setForm(html);
        } catch (err) {
            console.log(err.message, err.stack);
        }
    }

    function changeValue(value, key) {
        if (Array.isArray(value)) {
            value = value.join(',');
        }
        setWhichElementChanged(key);
        setRecord(record => ({ ...record, [key]: value }));
        setTarget(value, key);
    }

    // "SELECT staff_id,name FROM admin,admin_dept WHERE admin.staff_id = admin_dept.admin_id AND dept='this.value'
    // {"sql":"SELECT name,alias from organizational_type WHERE type IN (5)","key":"alias","value":"name"}
    // {"targets":[{"target":"lecturer_id","sql":"SELECT staff_id,name FROM admin WHERE staff_id='ph1'","key":"staff_id","value":"staff_id,name","image":"image"}]}


    async function setTarget(v, key) {
        const tblMeta = valuesStore.getValuesBy(tblMetaDataName, whereKeyName, tblName);
        let elem = {};
        for (let i = 0; i < tblMeta.length; i++) {
            if (tblMeta[i]?.column_name == key) {
                elem = tblMeta[i];
                break;
            }
        }
        let options = elem.extra_options;
        if (!options) return;
        const j = JSON.parse(options);
        const targets = j?.targets;
        targets.forEach(async p => {
            let sql = p?.sql;
            const key = p?.key;
            const value = p?.value;
            const image = p?.image;
            const target = p?.target;
            const groupBy = p?.groupBy;
            if (sql) {
                sql = sql.replace('this.value', v);
                const res = await utils.requestWithReauth('post', `${Settings.backend}/get_extra_meta_options`, null, { sql });
                if (groupBy) {
                    const grouped = utils.groupBy(res.details, groupBy);
                    let final = [];
                    for (let group in grouped) {
                        final.push({
                            label: group,
                            options: grouped[group]?.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }))
                        });
                    }
                    setSqlSelectResult(r => ({ ...r, [target]: final }));
                } else {
                    options = res.details.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }));
                    setSqlSelectResult(r => ({ ...r, [target]: options }));
                }
                // const opt = res.details.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }));
                // setSqlSelectResult(r => ({ ...r, [target]: opt }));
            }
        });
    }


    function addModal(title, handleOk, okText = 'Save', okButtonProps = { style: { background: Settings.secondaryColorHex, border: 'none' } }, width, shouldDrag = true) {
        title = shouldDrag ? <div {...draggable.draggableTitleProps}>{title}</div> : title;
        return <>
            <Modal
                modalRender={(modal) => {
                    return shouldDrag ? draggable.drag(modal) : modal
                }}
                confirmLoading={loading}
                zIndex={1002} title={title} width={width} open={showModal} onOk={handleOk} onCancel={e => setShowModal(false)} okText={okText} okButtonProps={okButtonProps}>

                <div className='row'>
                    <Space className='col-12' direction='vertical'>
                        <div className='col-12 '>
                            {childrenTop}
                        </div>
                        <div className='col-12'>
                            {form}
                        </div>
                        <div className='col-12'>
                            {childrenBottom}
                        </div>
                    </Space>
                </div>
            </Modal>
            {upload.preview()}
        </>
    }

    return {
        fields, setFields, whichElementChanged, setWhichElementChanged,
        setSqlPlaceHolders, setRecord, reset,
        addModal, saveCompleted, setSaveCompleted,
        setTblName, setShowModal, setTblMetaDataName,
        setWhrKeyName, save, saveWithFiles,
        upload, record, editor,
        childrenBottom, setChildrenBottom,
        childrenTop, setChildrenTop, form, addForm, loading, setLoading,
        sqlSelectResult, setSqlSelectResult, extraMetaList, setExtraMetaList,
        resetCompletely
    };

}
export default useAdd;
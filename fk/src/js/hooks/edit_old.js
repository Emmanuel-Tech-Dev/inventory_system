
import React, { useState, useMemo } from 'react';
import ValuesStore from '../store/values-store';
import utils from '../dependencies/custom/react-utilities';
import { Space, Image, Modal, Input, Select, message, DatePicker, Radio, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Settings from '../dependencies/custom/settings';
import useUpload from './upload';
// import moment from 'moment';
import useTextEditor from './text_editor';
import useDraggable from './draggable';
const { TextArea } = Input;


//this hook is based on zustand
const useEdit = (tablesMetaData, whereKeyName) => {
    const valuesStore = ValuesStore();
    const [showModal, setShowModal] = useState(false);
    const [tblMetaDataName, setTblMetaDataName] = useState(tablesMetaData);
    const [whrKeyName, setWhrKeyName] = useState(whereKeyName);
    const [form, setForm] = useState(undefined);
    const [tblName, setTblName] = useState(undefined);
    const [data, setData] = useState(undefined);
    const [recordKey, setRecordKey] = useState(undefined);
    const upload = useUpload('', '');
    const [saveCompleted, setSaveCompleted] = useState(false);
    const [sqlPlaceHolders, setSqlPlaceHolders] = useState({});
    const [sqlSelectResult, setSqlSelectResult] = useState({});
    const [whichElementChanged, setWhichElementChanged] = useState('');
    const [childrenBottom, setChildrenBottom] = useState(undefined);
    const [childrenTop, setChildrenTop] = useState(undefined);
    const [fields, setFields] = useState(undefined);
    const editor = useTextEditor();
    const draggable = useDraggable();
    const [extraMetaList, setExtraMetaList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedKeysToEdit, setSelectedKeysToEdit] = useState([]);

    async function saveRaw(key = undefined, url = `${Settings.backend}/edit`, tableName = null, endpoint = null, callback) {
        removeNonEditableFields(key || recordKey, tableName);
        let data = valuesStore.getValue(key || recordKey);
        let res = await utils.requestWithReauth('post', url, endpoint, data);
        if (res.status === 'Ok') {
            reset(key);
            if (callback) {
                callback(true, 'Record has been updated successfully');
            }
            message.success('Record has been updated succesfully');
        } else {
            if (callback) {
                callback(false, res.msg);
            }
            message.error(res.msg);
        }
    }

    async function saveSelected(key = undefined, url = `${Settings.backend}/edit`, tableName = null, endpoint = null, callback, localSelectedKeysToEdit) {
        removeNonEditableFields(key || recordKey, tableName);
        let data = valuesStore.getValue(key || recordKey);
        let b = {};
        if (!Array.isArray(localSelectedKeysToEdit) && !Array.isArray(selectedKeysToEdit)) {
            message.error('Keys to selected must be an array');
            return;
        }
        for (let key of localSelectedKeysToEdit || selectedKeysToEdit) {
            b[key] = data[key];
        }
        let res = await utils.requestWithReauth('post', url, endpoint, b);
        if (res.status === 'Ok') {
            reset(key);
            if (callback) {
                callback(true, 'Record has been updated successfully');
            }
            message.success('Record has been updated succesfully');
        } else {
            if (callback) {
                callback(false, res.msg);
            }
            message.error(res.msg);
        }
    }

    async function save(key = undefined, url = `${Settings.backend}/edit`, tableName = null, endpoint = null, callback) {
        removeNonEditableFields(key || recordKey, tableName);
        let data = valuesStore.getValue(key || recordKey);
        let b = removeUnknownFields(tableName, data);
        let res = await utils.requestWithReauth('post', url, endpoint, b);

        if (res.status === 'Ok') {
            reset(key);
            if (callback) {
                callback(true, 'Record has been updated successfully');
            }
            message.success('Record has been updated succesfully');
        } else {
            if (callback) {
                callback(false, res.msg);
            }
            message.error(res.msg);
        }
    }

    async function saveWithFiles(key = undefined, url = `${Settings.backend}/edit_with_files`, tableName = null, endpoint = null) {
        removeNonEditableFields(key || recordKey, tableName);
        let d = valuesStore.getValue(key || recordKey);
        let b = removeUnknownFields(tableName, d);
        const data = { 'record': JSON.stringify(b), 'files': JSON.stringify(upload.fileList) }
        let res = await utils.requestWithReauth('post', url, endpoint, data);
        if (res.status === 'Ok') {
            reset(key);
            message.success('Record has been updated succesfully');
        } else {
            message.error(res.msg);
        }
    }

    function reset(key) {
        setTblName(undefined);
        setShowModal(false);
        setData(undefined);
        valuesStore.deleteValue(key || recordKey);
        upload.setBase64FileList([]);
        upload.setFileList([]);
        setSaveCompleted(true);
    }

    function resetCompletely() {
        setTblName(undefined);
        setShowModal(false);
        upload.setBase64FileList([]);
        upload.setFileList([]);
        setData(undefined);
        setSaveCompleted(true);
        setLoading(false);
        setSqlSelectResult({});
        setExtraMetaList([]);
    }

    function removeNonEditableFields(recordKey, tableName) {
        let meta = valuesStore.getValuesBy(tblMetaDataName, whrKeyName, tableName);
        for (let i = 0; i < meta.length; i++) {
            let editable = meta[i]['editable'];
            let name = meta[i]['column_name'];
            let type = meta[i]['type'];
            if (!editable && type !== 'primaryKey') {
                valuesStore.deleteObjectValue(recordKey, name);
            }
        }
    }

    function removeUnknownFields(tableName, data) {
        let meta = valuesStore.getValuesBy(tblMetaDataName, whrKeyName, tableName)?.sort((a, b) => a.rank - b.rank);
        for (let key in data) {//check if key is in meta. remove key from data if key not found
            let keyFound = false;
            for (let i = 0; i < meta.length; i++) {
                let name = meta[i]['column_name'];
                if (name.trim() === key.trim()) {
                    keyFound = true;
                    break;
                }
            }
            if (!keyFound) {
                delete data[key];
            }
        }
        return data;
    }

    useMemo(() => {
        editableForm(data, recordKey, tblName);
        // console.log('edit hook looping');
    }, [tblName, /*valuesStore[recordKey]*/ valuesStore.getValue(recordKey), sqlSelectResult, upload.fileList, fields]);

    function recallFiles(record, filePathDBField, tableName, fileDelURL, fileDelRowIDFieldName, container) {
        let value = record[filePathDBField];
        let fs = value?.split(',').filter(f => f !== '')?.map(filename => ({ name: filename, uid: filename, url: `${Settings.backend}/${filename}`, container }));
        fs = fs ? fs : [];
        upload.setMultipleFiles(fs, 'name', 'url', 'uid', { tableName, fileDelURL, fileDelRowIDFieldName, fileDelRowIDValue: record[fileDelRowIDFieldName], filePathDBField, container });
    }


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


    function dateTimeChange(dateString, key, recordKey) {
        changeValue(dateString, key, recordKey)
    }



    async function editableForm(data, recordKey, tableName) {
        try {
            // let meta = valuesStore?.getValuesBy(tblMetaDataName, whrKeyName, tableName);
            let meta = valuesStore?.getValuesBy(tblMetaDataName, whrKeyName, tableName)?.sort((a, b) => a.rank - b.rank);
            if (fields && fields?.length) {
                meta = meta.filter((v) => {
                    return fields.includes(v.column_name)
                });

            }

            let html = [];
            for (let key in data) {
                let realName = key;
                let name = key;
                let type = undefined;
                let options = undefined;
                let visible = 0;
                let icon = undefined;
                const marginBottom = 'mb-2';
                let value = valuesStore.getValue(recordKey)[key];
                for (let i = 0; i < meta.length; i++) {
                    if (meta[i].column_name === key) {
                        realName = meta[i]['col_real_name'];
                        name = meta[i]['column_name'];
                        type = meta[i]['type'];
                        visible = meta[i]['backend_visible'];
                        icon = meta[i]['icon'];
                        if (!visible) {
                            continue;
                        }
                        switch (type) {
                            case 'jsonCheck':
                            case 'jsonRadio':
                            case 'jsonSelect':
                            case 'jsonMultiSelect': {
                                const p = !!meta[i]['options'] ? JSON.parse(meta[i]['options']) : {};
                                const a = Object.entries(p);
                                options = a.map(v => ({ value: v[0], label: v[1] }));
                                if (!sqlSelectResult[name]) {
                                    setSqlSelectResult(r => ({ ...r, [name]: options }));
                                }
                                break;
                            }
                            case 'csvCheck':
                            case 'csvRadio':
                            case 'csvSelect':
                            case 'csvMultiSelect': {
                                options = !!meta[i]['options'] ? meta[i]['options'].split(',').map(v => ({ value: v, label: v })) : [];
                                if (!sqlSelectResult[name]) {
                                    setSqlSelectResult(r => ({ ...r, [name]: options }));
                                }
                                break;
                            }
                            case 'sqlCheck':
                            case 'sqlRadio':
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
                                        options = sqlSelectResult[name];//?.details?.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }));
                                    } else {
                                        if (!extraMetaList.includes(name)) {
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
                                                // options = res.details.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }));
                                                setSqlSelectResult(r => ({ ...r, [name]: options }));
                                            }
                                        }
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
                // let b = await setup(meta, key, name, realName, type, visible, icon);
                // options = b?.options;
                // visible = b.visible;
                //visibility is determined in the nested loop
                if (!visible) {
                    continue;
                }
                switch (type.trim()) {
                    case 'dateOnly': {
                        html.push(<Input
                            className={`${marginBottom}`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='text' placeholder={`Enter ${realName}`} value={utils.formatDate(value, '/')} onChange={e => changeValue(e.target.value, key, recordKey)} />)
                        break;
                    }
                    case 'customGenerateString': {
                        html.push(<Input
                            disabled
                            className={`${marginBottom} d-none`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='text' placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key)} />);
                        break;
                    }
                    case 'number': {
                        html.push(<Input
                            className={`${marginBottom}`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='number' placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key, recordKey)} />);
                        break;
                    }
                    case "text": {
                        html.push(<Input
                            className={`${marginBottom}`}
                            addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                            key={`${name}_editable`} type='text' placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key, recordKey)} />);
                        break;
                    }
                    case "jsonCheck":
                    case "csvCheck":
                    case "sqlCheck": {
                        const checked = options?.filter(opt => opt.value == value);
                        const val = checked?.length ? checked[0]?.value?.toString() : (value || undefined);
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`${marginBottom}`}>
                                <span className="me-2">{realName}:</span>
                                <div className='mt-1'>
                                    <Checkbox.Group
                                        key={`${name}_editable`}
                                        options={sqlSelectResult[name]}
                                        onChange={v => changeValue(v, key, recordKey)}
                                        value={val}
                                    />
                                </div>
                            </div>)
                        break;
                    }
                    case "jsonRadio":
                    case "csvRadio":
                    case "sqlRadio": {
                        const checked = options?.filter(opt => opt.value == value);
                        const val = checked?.length ? checked[0]?.value?.toString() : (value || undefined);
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`${marginBottom}`}>
                                <span className="">{realName}:</span>
                                <div className='mt-1'>
                                    <Radio.Group
                                        key={`${name}_editable`}
                                        options={sqlSelectResult[name]}
                                        onChange={v => changeValue(v?.target?.value, key, recordKey)}
                                        value={val}
                                    />
                                </div>
                            </div>)
                        break;
                    }
                    case "sqlSelect":
                    case "jsonSelect":
                    case "csvSelect": {
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`input-groupx input-group-smx d-flexx bd-highlightx ${marginBottom}`}>
                                <span className="input-group-textx bd-highlightx">{realName}:</span>
                                <div className='mt-1'>
                                    <Select
                                        key={`${name}_editable`}
                                        placeholder={`Select ${realName}`}
                                        className={`bd-highlightx flex-grow-1x w-100`}
                                        onChange={v => changeValue(v, key, recordKey)}
                                        value={options?.filter(opt => opt.value == value) || value || undefined}
                                        options={sqlSelectResult[name]}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </div>
                            </div>
                        );
                        break;
                    }
                    case "sqlMultiSelect":
                    case "jsonMultiSelect":
                    case "csvMultiSelect": {
                        html.push(
                            <div key={`${name}_select_wrapper`} className={`input-groupx input-group-smx d-flexx bd-highlightx ${marginBottom}`}>
                                <span className="input-group-textx bd-highlightx">{realName}:</span>
                                <div className='mt-1'>
                                    <Select
                                        key={`${name}_editable`}
                                        mode="multiple"
                                        allowClear
                                        placeholder={`Select ${realName}`}
                                        className={`bd-highlightx flex-grow-1x w-100`}
                                        onChange={v => changeValue(v, key, recordKey)}
                                        value={value ? value?.toString()?.split(',')?.map(v => (options[v] || v)) : []}
                                        options={sqlSelectResult[name]}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </div>
                            </div>
                        )
                        break;
                    }
                    case 'textEditor': {
                        html.push(
                            <div key={`${name}_editable`} className={`${marginBottom}`}>
                                <label className={`fw-bolder ${marginBottom}`}>Enter {realName}</label>
                                {editor.editor(value)}
                            </div>
                        );
                        break;
                    }
                    case "file": {
                        html.push(
                            <div key={`${name}_editable`}>
                                <label className={`fw-bolder ${marginBottom}`}>Upload {realName}</label>
                                {upload.uploader('uploadedImages', '', `${name}_editable`)}
                            </div>
                        )
                        break;
                    }
                    case "textArea": {
                        html.push(
                            <div key={`${name}_textarea_wrapper`} className={`${marginBottom} w-100`}>
                                <span className="">{realName}</span>
                                <Input.TextArea key={`${name}_editable`} className="w-100" placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key,recordKey)} autoSize />
                            </div>
                        );
                        break;
                    }
                    default: html.push(<Input
                        className={`${marginBottom}`}
                        addonBefore={<><label className='d-none d-md-flex'>{realName}</label><i className={`d-md-none d-flex fas ${icon}`} /></>}
                        key={`${name}_editable`} type={type.trim()} placeholder={`Enter ${realName}`} value={value} onChange={e => changeValue(e.target.value, key, recordKey)} />)
                }
            }
            setForm(html);
        } catch (err) {
            console.log(err.message, err.stack);
        }
    }

    //sqlFilterSelect,csvFilterSelect,jsonFilterSelect, 
    // {
    // "sql":"SELECT DISTINCT tag from products",
    // "key":"tag",
    // "value":"tag"
    // "onFilterSql":"Select value,key from sometable",
    // "onFilterKey":"key",
    // "onFilterValue":"value",
    // "onFilterTarget":"someColInTheMeta"
    // }
    // {
    // "csv":"item1,item2",       
    // "onFilterSql":"Select value,key from sometable",
    // "onFilterKey":"key",
    // "onFilterValue":"value",
    // "onFilterTarget":"someColInTheMeta"
    // }
    // {
    // "json":{"0":"No","1":"Yes"},
    // "onFilterSql":"Select value,key from sometable",
    // "onFilterKey":"key",
    // "onFilterValue":"value",
    // "onFilterTarget":"someColInTheMeta"
    // }


    function changeValue(value, key, recordKey) {
        if (Array.isArray(value)) {
            value = value.join(',');
        }
        let val = valuesStore.getValue(recordKey);
        if (val[key] !== undefined) {
            val[key] = value;
            valuesStore.updateObjectValue(recordKey, key, value);
        }
        setTarget(value, key);
        setWhichElementChanged(key);
    }

    // async function setTarget(v, key) {
    //     const elem = valuesStore.getArrayObjectsValue(tblMetaDataName, 'column_name', key);
    //     const options = elem.extra_options;
    //     if (!options) return;
    //     const j = JSON.parse(options);
    //     const targets = j?.targets;
    //     targets.forEach(async p => {
    //         let sql = p?.sql;
    //         const key = p?.key;
    //         const value = p?.value;
    //         const image = p?.image;
    //         const target = p?.target;
    //         if (sql) {
    //             sql = sql.replace('this.value', v);
    //             const res = await utils.requestWithReauth('post', `${Settings.backend}/get_extra_meta_options`, null, { sql });
    //             const opt = res.details.map(v => ({ value: v[key], label: selectOptionLabelRender(image, key, value, v) }));
    //             setSqlSelectResult(r => ({ ...r, [target]: opt }));
    //         }
    //     });
    // }
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

    function editModal(title, handleOk, okText = 'Save', okButtonProps = { style: { background: Settings.secondaryColorHex, border: 'none' } }, width, shouldDrag = true) {
        title = shouldDrag ? <div {...draggable.draggableTitleProps}>{title}</div> : title;
        return <>
            <Modal
                confirmLoading={loading}
                modalRender={(modal) => {
                    return shouldDrag ? draggable.drag(modal) : modal
                }} zIndex={1002} width={width} title={title} open={showModal} onOk={handleOk} onCancel={e => setShowModal(false)} okText={okText} okButtonProps={okButtonProps}>
                <div className='row'>
                    <Space className='col-12' direction='vertical'>
                        <div className='col-12'>
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
        fields, setFields, setSqlPlaceHolders, whichElementChanged, setWhichElementChanged,
        reset, editModal, saveCompleted,
        setSaveCompleted, recallFiles, setShowModal,
        setTblMetaDataName, setWhrKeyName, save,
        setTblName, setData, setRecordKey, upload,
        record: valuesStore.getValue(recordKey), saveWithFiles, editor,
        childrenBottom, setChildrenBottom,
        childrenTop, setChildrenTop, form, loading, setLoading,
        sqlSelectResult, setSqlSelectResult, extraMetaList, setExtraMetaList,
        resetCompletely, selectedKeysToEdit, setSelectedKeysToEdit, saveSelected, saveRaw
    };
}

export default useEdit;
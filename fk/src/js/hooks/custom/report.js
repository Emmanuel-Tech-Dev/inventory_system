
import React, { useState, useMemo, useRef } from 'react';
import ValuesStore from '../../store/values-store';
import utils from '../../dependencies/custom/react-utilities';
import { Space, Button, Card, theme, Image, Form, Input, Tag } from 'antd';
import useTable from '../../hooks/table';
import Settings from '../../dependencies/custom/settings';
import { useReactToPrint } from "react-to-print";

const useReport = (prop) => {
    const valuesStore = ValuesStore();
    const { filters, filterTypes } = utils.generateTableFilters();
    const [aspirantData, setAspirantData] = useState([]);
    const [data, setData] = useState();
    const drawer = prop.drawer;
    const [aspirantPhotoPath, setAspirantPhotoPath] = useState([]);
    const printableRef = useRef();
    let hasNominated = new Set();
    let hasNotNominated = new Set();

    const handlePrint = useReactToPrint({
        content: () => printableRef.current,
    });

    const filesTable = useTable(
        {
            pagination: {
                current: 1,
                pageSize: 10,
                position: ['bottomRight'],
                hideOnSinglePage: true
            },
            filters: { ...filters },
            filterTypes: { ...filterTypes }
        },
        undefined,
        undefined,
        undefined,
        undefined,
        'id',
        {},
        {});

    const nominationTable = useTable(
        {
            pagination: {
                current: 1,
                pageSize: 10,
                position: ['bottomRight'],
                hideOnSinglePage: true
            },
            filters: { ...filters },
            filterTypes: { ...filterTypes }
        },
        undefined,
        undefined,
        undefined,
        undefined,
        'id',
        {},
        {});

    const fileColumns = ([
        {
            title: 'View',
            dataIndex: 'view',
            render: (v, record) => {
                return record?.is_row ? <Space size="middle">
                    <Button className='' onClick={e => viewDocx(record)}><i className='fas fa-eye text-success' /></Button>
                </Space> : record.rows_group_label
            },
        },
        {
            title: 'Index Number',
            dataIndex: 'index_no',
            // ...table.getColumnSearchProps('index_no'),
        },
        {
            title: 'Category',
            dataIndex: 'category'
        },
        {
            title: 'Name',
            dataIndex: 'name',
        },
        {
            title: 'Type',
            dataIndex: 'type',
        },
        {
            title: 'Size',
            dataIndex: 'size',
        }
    ]);

    const nominationColumns = ([
        {
            title: 'Index Number',
            dataIndex: 'index_no',
        },
        {
            title: 'Nominated',
            dataIndex: 'nominated',
            render(v, record) {
                return v ? <Tag color='green-inverse'>Yes</Tag> : <Tag color={'red-inverse'}>No</Tag>
            }
        }
    ]);

    function viewDocx(record){
        window.open(`${Settings.backend}/${record.id}`, '_blank', 'location=yes,height=670,width=900,scrollbars=yes,status=yes')
    }

    function reset() {
        setAspirantData([]);
        setAspirantPhotoPath([]);
        filesTable.setData([]);
        nominationTable.setData([]);
    }

    async function procecessApplicant(record) {
        reset();
        const res = await utils.requestWithReauth('post', `${Settings.backend}/get_aspirant_details`, null, { user_id: record?.applicant_id });
        if (res.status == 'Ok') {
            const dataTypes = utils.groupBy(res?.data, 'datatype');
            const textTypes = dataTypes?.text;
            const fileTypes = dataTypes?.file;
            const groupAspirantPeopleFiles = utils.groupBy(fileTypes, 'dep_type');
            const groupedAspirantPeopleRoles = utils.groupBy(textTypes, 'dep_type');
            let persons = {};
            for (let role in groupedAspirantPeopleRoles) {
                const prs = utils.groupBy(groupedAspirantPeopleRoles[role], 'index_no');
                for (let person in prs) {
                    const p = prs[person];
                    if (Array.isArray(persons[role])) {
                        persons[role]?.push(utils.groupBy(p, 'lookup_id'));
                    } else {
                        persons[role] = [utils.groupBy(p, 'lookup_id')];
                    }

                }
            }
            buildJSX(persons, groupAspirantPeopleFiles);
            drawer?.setTitle(<div className='d-flex justify-content-between'>
                <label>Aspirant ID:{record?.applicant_id} / Index Number:{record?.index_no}</label>
                <Button onClick={e => handlePrint()} type='primary' icon={<i className='fas fa-print me-1' />}>Print</Button>
            </div>);
        } else {
            utils.showNotification(undefined, res?.msg);
        }
    }

    function buildJSX(persons, files) {
        let cards = [];
        for (let role in persons) {
            if (persons.hasOwnProperty(role)) {
                cards.push(...generateCards(role, persons[role]));
            }
        }
        filesTableSetup(files);
        setAspirantData(cards);
        // drawer?.setOpen(true);
    }


    function filesTableSetup(files) {
        //building files table
        let filesList = [];
        for (let role in files) {
            const fs = files[role];
            const r = valuesStore.getArrayObjectsValue('dependent_types', 'alias', role)?.type;
            filesList.push({ id: role, rows_group_label: <label className='fw-bold'>{r?.toUpperCase() || 'ASPIRANT DETAILS'}</label>, is_row: false });
            for (let file of fs) {
                const params = JSON.parse(file?.extra_params || '{}');
                filesList.push({ id: file?.value, category: file?.real_name, index_no: file?.index_no, name: params?.fileName, size: params?.covertedFileSize, type: params?.fileType, is_row: true });
                if (role == 'null' && ['jpg', 'jpeg', 'png'].includes(params?.fileType?.toLowerCase())) {
                    setAspirantPhotoPath(`${Settings.backend}/${file?.value}`);
                }
            }
        }
        filesTable.setData(filesList);
    }

    function generateCards(role, roleDetails) {
        let cards = [];
        const r = valuesStore.getArrayObjectsValue('dependent_types', 'alias', role)?.type;
        for (let person of roleDetails) {
            cards.push(
                // #0fa193
                <Card key={utils.generateUuid()} className='mb-2'>
                    <div style={{ background: '#4e6a7a' }} className='border rounded text-white p-1'>{r?.toUpperCase() || 'ASPIRANT DETAILS'}</div>
                    <div className='row'>
                        {generateSections(person)}
                    </div>
                </Card>
            );
        }
        return cards;
    }

    function generateSections(person) {
        let sections = [];
        for (let category in person) {
            if (person.hasOwnProperty(category)) {
                const components = generateComponents(person[category]);
                sections.push(
                    <div key={category} className='border-bottomx border-2x col-md-12 mt-2 mb-1'>
                        <div>{person[category][0]?.real_name}</div>
                        <div className={`row row-cols-${components.length == 1 || components.length == 2 ? `${components.length}` : '3'}`}>
                            {components}
                        </div>
                    </div>
                );
            }
        }
        return sections;
    }


    function generateComponents(data) {
        const d = data?.map((d, index) => {
            if (d?.nominated) {
                hasNominated.add(d?.index_no);
            } else {
                hasNotNominated.add(d?.index_no);
            }
            return <div key={`${index}`} className='mb-2 border-end border-1'>
                <span className='text-muted'>{valuesStore.getArrayObjectsValue('tables_metadata', 'column_name', d?.item)?.col_real_name}</span>
                <br />
                <span className='text-muted h6'>{d?.value}</span>
            </div>
        });
        //using this function as a place to also build the nomination table
        const y = Array.from(hasNominated)?.map((v, i) => ({ id: v, index_no: v, nominated: true }));
        const n = Array.from(hasNotNominated)?.map((v, i) => ({ id: v, index_no: v, nominated: false }));
        nominationTable.setData([...y, ...n]);
        return d;
    }


    useMemo(() => {
        if (data) {
            procecessApplicant(data);
        }
        filesTable.setColumns(fileColumns);
        filesTable.setCssClasses('table table-sm table-striped')

        console.log('looping')

        drawer?.setWidth('75%');
        drawer?.setPlacement('right');
        nominationTable.setColumns(nominationColumns);
    }, [data]);


    function tableHeader() {
        let yes = 0;
        let no = 0;
        nominationTable?.data?.forEach(v => {
            v?.nominated ? yes++ : no++;
        });
        return <label className='fw-bold text-primary'>Nominated - {yes} / Not nominated - {no}</label>;
    }

    function reportJSX() {
        return (
            <div className='px-4' ref={printableRef}>
                <label className='fw-bold text-danger mt-4'>Aspirant ID:{data?.applicant_id} / Index Number:{data?.index_no}</label>
                <hr/>
                <div className='row'>
                    <div className='col-8 mb-3 border rounded'>
                        {nominationTable.tableWithHeader(tableHeader)}
                    </div>
                    <div className='col-4'>
                        <Image src={aspirantPhotoPath || `${Settings.backend}/placeholder.jpg`} width={200} />
                    </div>
                    <div className='col-12 mb-3 border rounded'>
                        {filesTable.table}
                    </div>
                    <div className='col-12'>
                        {aspirantData}
                    </div>
                </div>
            </div>
        );
    }

    return { data, setData, reportJSX, reset, printableRef }
}

export default useReport;
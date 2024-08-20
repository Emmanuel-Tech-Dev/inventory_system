import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space, Modal } from 'antd';
import { useState, useMemo } from 'react';
import useDraggable from './draggable';
import Settings from '../dependencies/custom/settings';

const useDynamicForm = (formName, itemToCreate, submitBtnDetails, onFinish, showFormAddBtn = true) => {
    const draggable = useDraggable();
    const [formJSX, setFormJSX] = useState();
    const [childrenBottom, setChildrenBottom] = useState(undefined);
    const [childrenTop, setChildrenTop] = useState(undefined);
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState(formName);
    const [formFieldsToCreate, setFormFieldsToCreate] = useState(itemToCreate);
    const [addBtnDetails, setAddBtnDetails] = useState(submitBtnDetails);
    const [modalTitle, setModalTitle] = useState();
    const [data, setData] = useState();
    const [formChildren, setFormChildren] = useState();
    const [form] = Form.useForm();
    const [formSubmit, setFormSubmit] = useState(undefined);
    const [formAddBtn,setFormAddBtn] = useState(showFormAddBtn);
    useMemo(() => {
        dynForm();
    }, [formChildren, formSubmit, data,/*formFieldsToCreate,*/form]);


    function dynForm() {
        const theForm = <Form
            form={form}
            name="dynamic_form_nest_item"
            onFinish={values => {
                formSubmit.onFormSubmit(values);
                setData(values);
                onFinish && onFinish(values);
            }}
            style={{
                maxWidth: 600,
            }}
            autoComplete="off"
        >
            {formChildren}

            <Form.List name={name}>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Space
                                key={key}
                                style={{
                                    display: 'flex',
                                    marginBottom: 8,
                                }}
                                align="baseline"
                            >
                                {formFieldsToCreate.map((v, i) => {
                                    return <Form.Item
                                        key={i}
                                        {...restField}
                                        label={v.name}
                                        name={[name, v.name]}
                                        rules={[
                                            {
                                                required: v.isRequired,
                                                message: v.errorMsg,
                                                type: v.type || 'string'
                                            },
                                        ]}
                                    >
                                        <Input placeholder={v.placeholder} type={v.inputType} />
                                    </Form.Item>
                                })}

                                <MinusCircleOutlined onClick={() => remove(name)} />
                            </Space>
                        ))}

                        {formAddBtn && <Form.Item>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                {'Add field'}
                            </Button>
                        </Form.Item>}
                    </>
                )}
            </Form.List>


            <Form.Item>
                <Button style={addBtnDetails?.style} className={addBtnDetails?.classes} type={addBtnDetails?.type} htmlType='submit'>
                    {addBtnDetails?.text}
                </Button>
            </Form.Item>
        </Form>
        setFormJSX(theForm);
    }

    function formModal(title, handleOk, okText = 'Save', okButtonProps = { style: { background: Settings.secondaryColorHex, border: 'none' } }, width, shouldDrag = true, footer = null) {
        if (!title) title = modalTitle;
        title = shouldDrag ? <div {...draggable.draggableTitleProps}>{title}</div> : title;
        return <>
            <Modal
                modalRender={(modal) => {
                    return shouldDrag ? draggable.drag(modal) : modal
                }}
                zIndex={1002} title={title} width={width} open={showModal} onOk={handleOk} onCancel={e => setShowModal(false)} okText={okText} okButtonProps={okButtonProps} footer={footer}>

                <div className='row'>
                    <Space className='col-12' direction='vertical'>
                        <div className='col-12 '>
                            {childrenTop}
                        </div>
                        <div className='col-12'>
                            {formJSX}
                        </div>
                        <div className='col-12'>
                            {childrenBottom}
                        </div>
                    </Space>
                </div>
            </Modal>
        </>
    }

    return {
        formJSX, setFormJSX, formModal, form,
        childrenBottom, setChildrenBottom,
        childrenTop, setChildrenTop,
        showModal, setShowModal,
        name, setName, addBtnDetails, setAddBtnDetails,
        formFieldsToCreate, setFormFieldsToCreate,
        data, setData, setFormChildren, formChildren,
        modalTitle, setModalTitle, formSubmit, setFormSubmit,
        formAddBtn,setFormAddBtn
    };
}
export default useDynamicForm;
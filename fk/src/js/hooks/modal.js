import { Drawer } from 'antd';
import { useState, useMemo } from 'react';
import { Modal } from 'antd';
import useDraggable from './draggable';
const useModal = () => {
    const [open, setOpen] = useState(false);

    const [content, setContent] = useState();
    const [title, setTitle] = useState();
    const [width, setWidth] = useState(378);
    const [height, setHeight] = useState(378);//number or string

    const [closable, setClosable] = useState();
    const [zIndex, setZIndex] = useState();
    const [size, setSize] = useState();
    const [style, setStyle] = useState();
    const [rootStyle, setRootStyle] = useState();
    const [rootClassName, setRootClassName] = useState();
    const [push, setPush] = useState();
    const [maskStyle, setMaskStyle] = useState();
    const [maskClosable, setMaskClosable] = useState(true);//boolean default:true
    const [mask, setMask] = useState(true);//boolean default: true
    const [keyboard, setKeyboard] = useState(true);//boolean default:true    
    const [headerStyle, setHeaderStyle] = useState();//css properties
    const [footer, setFooter] = useState(null);
    const draggable = useDraggable();
    const onClose = () => {
        setOpen(false);
    };

    function modalJSX(handleOk, localContent , localWidth = 500, extraProps = {}, shouldDrag = true) {               
        return <Modal
            modalRender={(modal) => {
                return shouldDrag ? draggable.drag(modal) : modal
            }}
            title={shouldDrag ? <div {...draggable.draggableTitleProps}>{title}</div> : title}
            open={open}
            onOk={handleOk}
            width={parseInt(localWidth) || width}
            onCancel={onClose}
            {...extraProps}
        >

            {localContent}
            { content}
          
        </Modal>
    }

    useMemo(() => {
        // console.log(content, open);
    }, [open]);


    return {
        open, setOpen, content, setContent, title, setTitle, modalJSX, width, setWidth, height, setHeight, footer, setFooter
    };
};
export default useModal;
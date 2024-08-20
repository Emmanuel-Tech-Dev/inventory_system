import { Drawer } from 'antd';
import { useState, useMemo } from 'react';
const useDrawer = () => {
    const [open, setOpen] = useState(false);
    const [placement, setPlacement] = useState('left');
    const [content, setContent] = useState();
    const [title, setTitle] = useState();
    const [closable, setClosable] = useState();

    const [zIndex, setZIndex] = useState();
    const [width, setWidth] = useState(378);
    const [size, setSize] = useState();
    const [style, setStyle] = useState();
    const [rootStyle, setRootStyle] = useState();
    const [rootClassName, setRootClassName] = useState();
    const [push, setPush] = useState();
    const [maskStyle, setMaskStyle] = useState();
    const [maskClosable, setMaskClosable] = useState(true);//boolean default:true
    const [mask, setMask] = useState(true);//boolean default: true
    const [keyboard, setKeyboard] = useState(true);//boolean default:true
    const [height, setHeight] = useState(378);//number or string
    const [headerStyle, setHeaderStyle] = useState();//css properties

    const onClose = () => {
        setOpen(false);
    };

    useMemo(()=>{

    },[]);

    function drawerJSX(localzIndex, localContent) {
        return (
            <>
                <Drawer
                    width={width}
                    height={height}
                    title={title}
                    placement={placement}
                    closable={closable}
                    onClose={onClose}
                    open={open}
                    key={placement}
                    zIndex={localzIndex || zIndex}
                >
                    {content}
                    {localContent}
                </Drawer>
            </>
        );
    }

    // function modalJSX(title,) {
    //     <Modal title={title} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
    //         {content}
    //     </Modal>
    // }

    return {
        open, setOpen, placement, setPlacement, content, setContent, title, setTitle, closable,
        setClosable, drawerJSX, width, setWidth, height, setHeight
    };
};
export default useDrawer;
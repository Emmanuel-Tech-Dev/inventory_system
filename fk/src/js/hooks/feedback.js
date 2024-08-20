

import { useState, useMemo, createElement } from 'react';
import $ from 'jquery';
import utils from '../dependencies/custom/react-utilities';
import Settings from '../dependencies/custom/settings';
import ValuesStore from '../store/values-store';
import { Button, Drawer, notification, Comment, Avatar, message } from 'antd';
import LoadingOverlay from 'react-loading-overlay';
import Loader from "react-spinners/ScaleLoader";
import { Link } from 'react-router-dom';
import IndexedDB from '../dependencies/custom/indexeddb';
import { UserOutlined, DislikeFilled, DislikeOutlined, LikeFilled, LikeOutlined } from '@ant-design/icons';
LoadingOverlay.propTypes = undefined;//fixing  a bug in LoadingOverlay

export default function useFeedback() {
    const valuesStore = ValuesStore();
    const [feedBackDrawer, setFeedBackDrawer] = useState(false);
    const [goodReviewCount, setGoodReviewCount] = useState(0);
    const [sellerReview, setSellerReview] = useState([]);
    const [neutralReviewCount, setNeutralReviewCount] = useState(0);
    const [badReviewCount, setBadReviewCount] = useState(0);
    const [sellerEmail, setSellerEmail] = useState('');
    const [feedbackLoaderActive, setFeedbackLoaderActive] = useState(true);
    const [sellerName, setSellerName] = useState('');

    useMemo(() => {
        getFeedbacks();
        //a hack to let loader follow scroll
        //trigger this function if feedback drawer opens
        //ant-drawer-body takes some time to be rendered so we have to wait
        let timer = setInterval(() => {
            if ($('.ant-drawer-body').length) {
                $('.ant-drawer-body').on('scroll', function (e) {
                    requestAnimationFrame(() => {
                        $('#feedbackLoader').css('margin', $(this).scrollTop() + 'px auto');
                    });
                });
                clearInterval(timer);
            }
        }, 1000);
        return () => {
            $('.ant-drawer-body').off('scroll');
        };
    }, [sellerEmail]);

    async function getFeedbacks() {
        setTimeout(async e => {
            const on = utils.getSettings(valuesStore, 'Feedback');
            if (!on) {
                setFeedbackLoaderActive(false);
                return;
            }
            let data = { item: sellerEmail };
            const res = await utils.requestWithReauth('POST', `${Settings.backend}/get_feedbacks`, null, data);
            setFeedbackLoaderActive(false);
            if (res.status === 'Ok') {
                let feedbacks = res.data.feedbacks;
                if (feedbacks.length >= 1) {
                    valuesStore.setValue('rawFeedbacks', feedbacks);
                    review(feedbacks);
                    countRemarks(feedbacks);
                }
            }
        }, 2000);
    }

    function countRemarks(feedbacks) {
        let g = 0;
        let n = 0;
        let b = 0;
        for (let i = 0; i < feedbacks.length; i++) {
            switch (feedbacks[i].remarks.toLowerCase()) {
                case 'good':
                    g += 1;
                    break;
                case 'neutral':
                    n += 1;
                    break;
                case 'bad':
                    b += 1;
                    break;
            }
        };
        setGoodReviewCount(g);
        setNeutralReviewCount(n);
        setBadReviewCount(b);
    }

    async function review(feedbacks) {
        let children = [];
        for (let i = 0; i < feedbacks.length; i++) {
            let item = feedbacks[i];
            item['children'] = [];
            getDeps(item, feedbacks, children);
        }
        let result = removeChildren(children, feedbacks);
        result = result.reverse();
        const tbl = Settings.dbTables[0].tblName;
        const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
        const data = await db.getByIndex(tbl, 'readwrite', 'user', 'user');
        let userId = null;
        if (data.data) {//if the user is logged in
            userId = data.data.data.id;
        }
        const comments = buildComments(result, [], userId);
        setSellerReview(comments);
    }

    const like = async (e) => {
        likeDislike(e, 'like');
    };

    const dislike = async (e) => {
        likeDislike(e, 'dislike');
    };

    async function likeDislike(e, type) {
        const parent = $(e.target).closest('.commentActionWrapper');
        const id = $(parent).data('id');
        const tbl = Settings.dbTables[0].tblName;
        const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
        const data = await db.getByIndex(tbl, 'readwrite', 'user', 'user');

        if (!data.data || !data.data.data.logged_in) {//not logged in
            valuesStore.setValue('showLoginModal', true);
            setFeedBackDrawer(false);
        } else {
            const userId = data.data.data.id;
            const d = { userId: userId, type, commentId: id };
            setFeedbackLoaderActive(true);
            const res = await utils.requestWithReauth('POST', `${Settings.backend}/like_dislike_comment`, null, d);
            if (res.status == 'Ok') {
                getFeedbacks();
            } else {
                setFeedbackLoaderActive(false);
                notification.open({
                    message: <label className="fw-bolder text-danger"><i className='fas fa-exclamation-circle'></i> Error</label>,
                    description: `${res.msg}`,
                    placement: 'bottomRight'
                });
            }
        }
    }

    const actions = function (likes, dislikes, id, userId, edited) {
        let l = likes.split(',');
        let dl = dislikes.split(',');
        let h = highLightLikeDislike(l, dl, userId);
        return [
            <div className='w-100 commentActionWrapper' data-id={id} style={{ cursor: 'pointer' }}>
                <span key={utils.generateUuid()} className='p-1' onClick={like}>
                    {createElement(h.like ? LikeFilled : LikeOutlined)}
                    <span className="comment-action">{likes ? l.length : 0}</span>
                </span>
                <span key={utils.generateUuid()} className='p-1' onClick={dislike}>
                    {createElement(h.dislike ? DislikeFilled : DislikeOutlined)}
                    <span className="comment-action">{dislikes ? dl.length : 0}</span>
                </span>
                <span key={utils.generateUuid()} className='p-1' onClick={e => editComment(e)}>
                    <i className='fas fa-edit'></i>
                </span>
                <span key={utils.generateUuid()} className='p-1' onClick={e => {
                    //the order of calling these two function is very important. previous action is needed to be compared to the current action
                    //this order will ensure that we the previous action
                    showCommentBox(e, 'replyComment');
                    valuesStore.setValue('commentAction', 'replyComment');
                }}>Reply</span>
                {edited ? <span key={utils.generateUuid()} className='fw-bolder p-1'>Edited</span> : ''}
                <div className='commentBox d-none'>
                    <textarea className='form-control mt-2' rows={3}></textarea>
                    <button className={`btn btn-sm rounded text-white mt-2 ${Settings.secondaryColor}`} onClick={e => addComment(e, 'oldThread')}><i className='far fa-comment'></i> Add Comment</button>
                </div>
            </div>
        ];
    }

    function highLightLikeDislike(likes, dislikes, id) {
        for (let i = 0; i < likes.length; i++) {
            if (likes[i] == id) {
                return { like: true, dislike: false };
            }
        }
        for (let i = 0; i < dislikes.length; i++) {
            if (dislikes[i] == id) {
                return { dislike: true, like: false };
            }
        }
        return { dislike: false, like: false };
    }


    async function editComment(e) {
        const parent = $(e.target).closest('.commentActionWrapper');
        const id = $(parent).data('id');
        const tbl = Settings.dbTables[0].tblName;
        const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
        const data = await db.getByIndex(tbl, 'readwrite', 'user', 'user');

        if (!data.data || !data.data.data.logged_in) {//not logged in
            valuesStore.setValue('showLoginModal', true);
            setFeedBackDrawer(false);
        } else {
            const email = data.data.data.email;
            const rawFeedbacks = valuesStore.getValue('rawFeedbacks');
            for (let i = 0; i < rawFeedbacks.length; i++) {
                if (id == rawFeedbacks[i].id && email == rawFeedbacks[i].commenter) {
                    $(parent).find('textarea').val(rawFeedbacks[i].feedback);
                    //the order of calling these two function is very important. previous action is needed to be compared to the current action
                    //this order will ensure that we the previous action
                    showCommentBox(e, 'editComment');
                    valuesStore.setValue('commentAction', 'editComment');
                }
            }
        }
    }

    async function addComment(e, type) {
        const on = utils.getSettings(valuesStore, 'Feedback');
        if (!on) {
            message.info('Feeback has been disabled by user');
            setFeedbackLoaderActive(false);
            return;
        }
        const tbl = Settings.dbTables[0].tblName;
        const db = new IndexedDB(Settings.dbName, Settings.dbVersion, Settings.dbTables).createDB();
        const data = await db.getByIndex(tbl, 'readwrite', 'user', 'user');

        if (!data.data || !data.data.data.logged_in) {//not logged in
            valuesStore.setValue('showLoginModal', true);
            setFeedBackDrawer(false);
        } else {
            const email = data.data.data.email;
            if (type == 'oldThread') {
                const el = $(e.target).closest('.commentActionWrapper');
                const id = $(el).data('id');
                const action = valuesStore.getValue('commentAction');
                const textarea = $(el).find('textarea');
                const comment = $(textarea).val();
                if (comment.trim() == '') {
                    notification.open({
                        message: <label className="fw-bolder text-danger"><i className='fas fa-exclamation-circle'></i> Error</label>,
                        description: 'Please type your comment',
                        placement: 'bottomRight'
                    });
                    return;
                }
                setFeedbackLoaderActive(true);
                $(e.target).prop('disabled', true);
                const data = { id, email, action, comment, seller: sellerEmail }
                const res = await utils.requestWithReauth('POST', `${Settings.backend}/add_comment`, null, data);
                if (res.status == 'Ok') {
                    getFeedbacks();
                    $(textarea).val('');
                } else {
                    setFeedbackLoaderActive(false);
                    notification.open({
                        message: <label className="fw-bolder text-danger"><i className='fas fa-exclamation-circle'></i> Error</label>,
                        description: `${res.msg}`,
                        placement: 'bottomRight'
                    });
                }
                $(e.target).prop('disabled', false);
            } else if (type == 'newThread') {
                const comment = $('#newThreadComment').val();
                if (comment.trim() == '') {
                    notification.open({
                        message: <label className="fw-bolder text-danger"><i className='fas fa-exclamation-circle'></i> Error</label>,
                        description: 'Please type your comment',
                        placement: 'bottomRight'
                    });
                    return;
                }
                setFeedbackLoaderActive(true);
                $(e.target).prop('disabled', true);
                const data = { email, action: 'newThreadComment', comment, seller: sellerEmail }
                const res = await utils.requestWithReauth('POST', `${Settings.backend}/add_comment`, null, data);
                if (res.status == 'Ok') {
                    getFeedbacks();
                    $('#newThreadComment').val('');
                } else {
                    setFeedbackLoaderActive(false);
                    notification.open({
                        message: <label className="fw-bolder text-danger"><i className='fas fa-exclamation-circle'></i> Error</label>,
                        description: `${res.msg}`,
                        placement: 'bottomRight'
                    });
                }
                $(e.target).prop('disabled', false);
            }
        }
    }

    function showCommentBox(e, button) {
        const action = valuesStore.getValue('commentAction');
        const box = $(e.target).closest('div').find('.commentBox');
        if ($(box).hasClass('d-none')) {
            $(box).removeClass('d-none');//show
        } else {
            if (action == button)
                $(box).addClass('d-none');//hide
        }
        if (button == 'replyComment') {
            $(box).find('textarea').val('')
        }
    }

    function faces(remark) {
        if (remark == 'good') return <i className='text-success far fa-smile'></i>
        if (remark == 'neutral') return <i className='text-info far fa-meh'></i>
        if (remark == 'bad') return <i className='text-danger far fa-frown'></i>
    }

    function buildComments(feedbacks, r, userId) {
        let children = [];
        let childrenToRender = [];
        feedbacks.forEach(f => {
            if (f.children.length > 0) {
                childrenToRender = buildComments(f.children, children, userId);
            } else {
                childrenToRender = [];
            }
            let res = <Comment key={utils.generateUuid()}
                actions={actions(f.likes, f.dislikes, f.id, userId, f.edited)}
                author={<a>{f.fname + ' ' + f.other_names}</a>}
                avatar={<Avatar src={f.picture || `https://joeschmoe.io/api/v1/random`} alt="Han Solo" />}
                content={<p>{f.feedback} {faces(f.remarks)}</p>}
                datetime={
                    <span>{utils.fromNow(f.date_inserted)}</span>
                }>
                {childrenToRender}
            </Comment>
            children.push(res);
        });
        return children;
    }


    function getDeps(feedback, feedbacks, children) {
        const id = feedback['id'];
        for (let j = 0; j < feedbacks.length; j++) {
            if (feedbacks[j].id == id) continue;
            if (feedbacks[j].super_type == id) {
                children.push(feedbacks[j]);
                feedback['children'].push(feedbacks[j]);
            }
        }
    }

    function removeChildren(children, feedbacks) {
        const final = feedbacks.filter(fd => {
            let track = [];
            children.forEach(child => {
                if (fd.id == child.id) {
                    track.push(true);
                } else {
                    track.push(false);
                }
            });

            if (track.every(val => val === false)) {
                return fd;
            }
        });
        return final;
    }

    const feedback = () => {
        return <Drawer
            headerStyle={{ background: `${Settings.primaryColorHex}` }}
            bodyStyle={{ padding: '5px' }}
            width={'100%'}
            zIndex={1200}
            title={<label className='text-white h5'>Feedbacks</label>}
            placement='right'
            closable={false}
            onClose={e => setFeedBackDrawer(false)}
            open={feedBackDrawer}
            extra={
                <i onClick={e => setFeedBackDrawer(false)} style={{ cursor: 'pointer' }} className='fas fa-times fa-2x text-white' />
            }>
            <LoadingOverlay
                styles={{
                    wrapper: (base) => ({
                        ...base,
                    }),
                    overlay: (base) => ({
                        ...base,
                        backgroundColor: 'rgba(255,255,255,.7)',
                    }),
                    content: (base) => ({
                        ...base,
                        margin: `0px auto`
                    }),
                    spinner: (base) => ({
                        ...base
                    })
                }}
                active={feedbackLoaderActive}
                spinner={<Loader id='feedbackLoader' color='#1565c0' loading={feedbackLoaderActive} cssOverride={{ display: "block", margin: '0 auto' }} size={50} />}>
                <div className='container mt-3'>
                    <div className='row'>
                        <div className='col-md-8'>
                            <div className='card p-3'>
                                <div className='row'>
                                    <div className='col-md-12'>
                                        <label className='h5'>Feedbacks about <Link to={`../fprofile/${sellerEmail}`} className={`fw-bolder ${Settings.textColor}`}>{sellerName}<br /></Link></label>
                                        <div className='d-flex mt-3'>
                                            <div className='me-4 text-success'>
                                                <div>
                                                    <i className='far fa-smile fa-2x'></i>
                                                    <label className='h4'> {goodReviewCount}</label>
                                                </div>
                                                <div>
                                                    <label>Good</label>
                                                </div>
                                            </div>
                                            <div className='me-4 text-info'>
                                                <div>
                                                    <i className='far fa-meh fa-2x'></i>
                                                    <label className='h4'> {neutralReviewCount}</label>
                                                </div>
                                                <div>
                                                    <label>Neutral</label>
                                                </div>
                                            </div>
                                            <div className='me-4 text-danger'>
                                                <div>
                                                    <i className='far fa-frown fa-2x'></i>
                                                    <label className='h4'> {badReviewCount}</label>
                                                </div>
                                                <div>
                                                    <label>Bad</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='mt-3'>
                                            <textarea className='form-control' id='newThreadComment' placeholder={
                                                valuesStore.getValue('rawFeedbacks').length == 0 ? `Be the first to add a comment about ${sellerName}` : `Add your comment`
                                            } rows='3'></textarea>
                                            <button className={`btn btn-sm rounded text-white mt-2 ${Settings.secondaryColor}`} onClick={e => addComment(e, 'newThread')}><i className='far fa-comment'></i> Add Comment</button>
                                        </div>
                                    </div>
                                    <div className='col-md-12 mt-3'>
                                        {
                                            sellerReview
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-4 d-none d-md-block'>
                            <div className={`card p-3 text-white ${Settings.primaryColor}`}>
                                <div className='d-flex flex-column'>
                                    <i className='far fa-comment fa-3x mb-3 mx-auto'></i>
                                    <p className='fw-bolder'>
                                        Your comments are very important for the seller and buyers.
                                        Please share your experience for doing business with {sellerName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </LoadingOverlay>
        </Drawer>
    }

    return { feedback, setFeedBackDrawer, setSellerName, setSellerEmail, sellerReview };
}


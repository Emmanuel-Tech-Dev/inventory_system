import '../../../css/custom/misc.css';

const NotFound = ({ homepage }) => {

    return (
        <>
            <div className="misc_mainbox">
                <div className="misc_err">4</div>
                <i className="misc_far far fa-question-circle fa-spin"></i>
                <div className="misc_err2">4</div>
                <div className="misc_msg">Maybe this page moved? Got deleted? Is hiding out in quarantine? Never existed in the first place?
                    <p>Let's go <a href={homepage}>home</a> and try from there.</p>
                </div>
            </div>

        </>

    )
}

export default NotFound;

